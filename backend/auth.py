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

# Tolerance (seconds) for clock skew between this Lambda and Google when checking
# time-based claims. Keeps legitimate tokens from being rejected by tiny drift
# while still failing closed on genuinely expired / not-yet-valid tokens.
CLOCK_SKEW_LEEWAY = 60

# Minimum seconds between forced cert refetches triggered by an unrecognized
# `kid`. Without this, anyone spraying tokens with garbage kids could force one
# outbound fetch to Google's cert endpoint per request (amplification/DoS, and a
# way to get rate-limited by Google). Tradeoff: too high = slower to recognize a
# genuine key rotation; too low = weaker DoS protection. 120s sits comfortably in
# the safe range given Google rotates keys on the order of hours.
MIN_REFRESH_INTERVAL = 120

# In-memory cert cache, reused across warm Lambda invocations. `last_fetch` is the
# time of the last actual network fetch (used to rate-limit forced refreshes).
_cert_cache = {"keys": {}, "expires_at": 0.0, "last_fetch": 0.0}


class AuthError(Exception):
    """Raised when a request is missing or carries an invalid token."""

    def __init__(self, message, status_code=401):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _fetch_public_keys():
    """Fetch Google's certs over the network and update the cache.

    Performs the actual HTTP request; raises on any network/parse error. Updates
    `keys`, `expires_at` (from Cache-Control max-age) and `last_fetch`.
    """
    now = time.time()
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
    _cert_cache["last_fetch"] = now
    return public_keys


def _load_public_keys():
    """Return Google's public signing keys, refreshing when the cache expires.

    On a refresh failure (Google unreachable/timeout/rate-limited) we fall back to
    the cached keys if we have any, rather than failing every login during a
    transient outage. Tradeoff: a key Google has rotated out could stay trusted
    slightly longer while Google is unreachable — an acceptable, very low risk
    versus breaking all auth. Only a cold start with no cached keys re-raises.
    """
    now = time.time()
    if _cert_cache["keys"] and now < _cert_cache["expires_at"]:
        return _cert_cache["keys"]

    try:
        return _fetch_public_keys()
    except Exception as e:
        if _cert_cache["keys"]:
            print(f"WARN: cert refresh failed, serving cached keys: {repr(e)}")
            return _cert_cache["keys"]
        raise


def _refresh_for_unknown_kid():
    """Force a cert refetch after a `kid` miss, rate-limited to at most once per
    MIN_REFRESH_INTERVAL. This still picks up genuine key rotation promptly while
    capping how often bad-kid traffic can trigger an outbound fetch. Returns the
    current key set (possibly unchanged if a refresh was skipped or failed)."""
    now = time.time()
    if now - _cert_cache["last_fetch"] < MIN_REFRESH_INTERVAL:
        # Too soon since the last fetch — treat the kid as unknown without hitting
        # the network. Forged/garbage kids are still rejected by the caller.
        return _cert_cache["keys"]
    try:
        return _fetch_public_keys()
    except Exception as e:
        # Same stale-key fallback as _load_public_keys.
        if _cert_cache["keys"]:
            print(f"WARN: forced cert refresh failed, serving cached keys: {repr(e)}")
            return _cert_cache["keys"]
        raise


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
        # kid not known: keys may have rotated. Force a refresh, but rate-limited
        # so a flood of tokens carrying bogus kids can't trigger one outbound
        # fetch per request.
        public_key = _refresh_for_unknown_kid().get(kid)
    if public_key is None:
        raise AuthError("Unknown signing key")

    issuer = f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}"
    try:
        # algorithms=["RS256"] pins the algorithm: "none" and HS256 tokens are
        # rejected (no algorithm-confusion). PyJWT verifies the signature and the
        # exp / iat (incl. future-iat) / aud / iss claims; require= makes their
        # absence a hard failure so we never accept a token missing them.
        claims = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=issuer,
            leeway=CLOCK_SKEW_LEEWAY,
            options={"require": ["exp", "iat", "aud", "iss", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise AuthError("Token expired")
    except jwt.PyJWTError:
        # Never echo the underlying exception or token contents.
        raise AuthError("Invalid token")

    # auth_time is a Firebase-specific claim PyJWT does not validate; reject a
    # token whose authentication time is in the future (fail closed).
    auth_time = claims.get("auth_time")
    if auth_time is not None:
        try:
            in_future = float(auth_time) > time.time() + CLOCK_SKEW_LEEWAY
        except (TypeError, ValueError):
            raise AuthError("Invalid token")
        if in_future:
            raise AuthError("Invalid token")

    uid = claims.get("sub")
    if not uid:
        raise AuthError("Token missing subject")
    claims["uid"] = uid
    return claims
