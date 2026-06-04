# Firebase ID token verification for the Old Is Gold Lambda.
#
# We do NOT trust any user_id sent by the client. Every protected request must
# carry a Firebase ID token in the `Authorization: Bearer <token>` header. We
# verify that token's RS256 signature against Google's public certificates and
# derive the caller's uid from the verified `sub` claim.
#
# This avoids bundling the heavy firebase-admin SDK (and its service-account
# secret): Firebase ID tokens are standard Google-signed JWTs, so verifying them
# against the public securetoken certs is sufficient and needs no secrets.

import json
import os
import time
import urllib.request

import jwt
from cryptography import x509
from cryptography.hazmat.backends import default_backend

# Google's public x509 certs for Firebase ID tokens (keyed by `kid`).
GOOGLE_CERTS_URL = (
    "https://www.googleapis.com/robot/v1/metadata/x509/"
    "securetoken@system.gserviceaccount.com"
)

# Firebase project id. Comes from the environment so the same code works across
# projects/stages; falls back to the known production project id.
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "old-is-gold-be8c8")

# Simple in-memory cert cache, reused across warm Lambda invocations.
_cert_cache = {"keys": {}, "expires_at": 0.0}


class AuthError(Exception):
    """Raised when a request is missing or carries an invalid token."""

    def __init__(self, message, status_code=401):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _load_public_keys():
    """Fetch and cache Google's public signing keys (kid -> RSA public key)."""
    now = time.time()
    if _cert_cache["keys"] and now < _cert_cache["expires_at"]:
        return _cert_cache["keys"]

    req = urllib.request.Request(GOOGLE_CERTS_URL, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=5) as resp:
        raw = resp.read()
        cache_control = resp.headers.get("Cache-Control", "")

    certs = json.loads(raw)
    # Each value is a PEM x509 cert; extract its RSA public key for verification.
    public_keys = {}
    for kid, cert_pem in certs.items():
        cert_obj = x509.load_pem_x509_certificate(cert_pem.encode(), default_backend())
        public_keys[kid] = cert_obj.public_key()

    # Respect the max-age hint so we refresh keys before they rotate out.
    max_age = 3600
    for part in cache_control.split(","):
        part = part.strip()
        if part.startswith("max-age="):
            try:
                max_age = int(part.split("=", 1)[1])
            except ValueError:
                pass

    _cert_cache["keys"] = public_keys
    _cert_cache["expires_at"] = now + max_age
    return public_keys


def verify_token(auth_header):
    """Verify a Firebase ID token and return its decoded claims.

    Raises AuthError on any problem. The caller's uid is in claims['uid'].
    """
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise AuthError("Missing or malformed Authorization header")

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise AuthError("Empty bearer token")

    try:
        unverified_header = jwt.get_unverified_header(token)
    except jwt.PyJWTError:
        raise AuthError("Malformed token")

    kid = unverified_header.get("kid")
    if not kid:
        raise AuthError("Token missing key id")

    public_keys = _load_public_keys()
    public_key = public_keys.get(kid)
    if public_key is None:
        # Key may have rotated; force a refresh once.
        _cert_cache["expires_at"] = 0.0
        public_key = _load_public_keys().get(kid)
    if public_key is None:
        raise AuthError("Unknown signing key")

    issuer = f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}"
    try:
        claims = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=issuer,
        )
    except jwt.ExpiredSignatureError:
        raise AuthError("Token expired")
    except jwt.PyJWTError as e:
        raise AuthError("Invalid token")

    uid = claims.get("sub")
    if not uid:
        raise AuthError("Token missing subject")
    claims["uid"] = uid
    return claims
