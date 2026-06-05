"""Tests for the Firebase ID token verifier (auth.verify_token).

These confirm the verifier FAILS CLOSED: it rejects expired, wrong-audience,
wrong-issuer, tampered/wrong-key, alg:none, and missing-header cases, and only
accepts a structurally valid, correctly-signed token.

Google's JWKS/certs are mocked: we generate our own RSA keypair, register its
public key under a test `kid`, and sign tokens with the matching private key.

Run directly:   python test_auth.py
Or with pytest: pytest test_auth.py
"""

import base64
import hashlib
import hmac
import json
import time

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

import auth

PROJECT = auth.FIREBASE_PROJECT_ID
ISS = f"https://securetoken.google.com/{PROJECT}"
KID = "test-kid-1"

# Real signing key (its public half is what the verifier will trust) and a
# second, untrusted key used to forge signatures.
_signing_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_attacker_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

# Mock the cert/JWKS fetch: the verifier trusts only our public key under KID.
auth._load_public_keys = lambda: {KID: _signing_key.public_key()}

# Generic messages the verifier is allowed to return (never echoes token/exception).
ALLOWED_MESSAGES = {
    "Missing or malformed Authorization header", "Empty bearer token",
    "Malformed token", "Token missing key id", "Unknown signing key",
    "Token expired", "Invalid token", "Token missing subject",
}


def make_token(claims=None, key=None, kid=KID, algorithm="RS256"):
    now = int(time.time())
    payload = {
        "aud": PROJECT,
        "iss": ISS,
        "sub": "user-abc-123",
        "iat": now - 30,
        "auth_time": now - 60,
        "exp": now + 3600,
    }
    if claims:
        payload.update(claims)
    return jwt.encode(payload, key or _signing_key, algorithm=algorithm,
                      headers={"kid": kid})


def make_alg_none_token():
    """Hand-build an alg:none token (PyJWT won't sign one for us)."""
    def b64(obj):
        return base64.urlsafe_b64encode(json.dumps(obj).encode()).rstrip(b"=").decode()
    now = int(time.time())
    header = b64({"alg": "none", "kid": KID})
    payload = b64({"aud": PROJECT, "iss": ISS, "sub": "user-abc-123",
                   "iat": now - 30, "exp": now + 3600})
    return f"{header}.{payload}."  # empty signature


def assert_rejected(auth_header, label):
    try:
        auth.verify_token(auth_header)
    except auth.AuthError as e:
        assert e.status_code in (401, 403), f"{label}: status {e.status_code} not 401/403"
        assert e.message in ALLOWED_MESSAGES, f"{label}: non-generic message {e.message!r}"
        return
    raise AssertionError(f"{label}: token was ACCEPTED but should have been rejected")


# --------------------------------------------------------------------------- #
# Rejection cases (must all fail closed)
# --------------------------------------------------------------------------- #

def test_rejects_missing_header():
    assert_rejected(None, "missing header")
    assert_rejected("", "empty header")
    assert_rejected("Bearer ", "bearer with no token")
    assert_rejected("Basic abc", "wrong scheme")


def test_rejects_expired_token():
    now = int(time.time())
    tok = make_token({"iat": now - 7200, "exp": now - 3600})
    assert_rejected(f"Bearer {tok}", "expired token")


def test_rejects_wrong_audience():
    tok = make_token({"aud": "some-other-project"})
    assert_rejected(f"Bearer {tok}", "wrong audience")


def test_rejects_wrong_issuer():
    tok = make_token({"iss": "https://evil.example.com/x"})
    assert_rejected(f"Bearer {tok}", "wrong issuer")


def test_rejects_wrong_key_signature():
    # Correct kid, but signed with a key the verifier does not trust.
    tok = make_token(key=_attacker_key)
    assert_rejected(f"Bearer {tok}", "wrong-key signature")


def test_rejects_tampered_signature():
    tok = make_token()
    head, payload, sig = tok.split(".")
    tampered = f"{head}.{payload}.{sig[:-3]}AAA"
    assert_rejected(f"Bearer {tampered}", "tampered signature")


def test_rejects_alg_none():
    assert_rejected(f"Bearer {make_alg_none_token()}", "alg:none")


def test_rejects_hs256_confusion():
    # Algorithm-confusion attack: forge an HS256 token using the (public) RSA key
    # bytes as the HMAC secret. PyJWT refuses to do this on encode(), so we build
    # the token by hand to prove our verifier rejects it on decode().
    pub_pem = _signing_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    def b64(obj):
        return base64.urlsafe_b64encode(json.dumps(obj).encode()).rstrip(b"=")

    now = int(time.time())
    header = b64({"alg": "HS256", "kid": KID})
    payload = b64({"aud": PROJECT, "iss": ISS, "sub": "x",
                   "iat": now - 30, "exp": now + 3600})
    signing_input = header + b"." + payload
    sig = base64.urlsafe_b64encode(
        hmac.new(pub_pem, signing_input, hashlib.sha256).digest()).rstrip(b"=")
    tok = (signing_input + b"." + sig).decode()
    assert_rejected(f"Bearer {tok}", "HS256 confusion")


def test_rejects_future_iat():
    now = int(time.time())
    tok = make_token({"iat": now + 9999})
    assert_rejected(f"Bearer {tok}", "future iat")


def test_rejects_future_auth_time():
    now = int(time.time())
    tok = make_token({"auth_time": now + 9999})
    assert_rejected(f"Bearer {tok}", "future auth_time")


def test_rejects_empty_subject():
    tok = make_token({"sub": ""})
    assert_rejected(f"Bearer {tok}", "empty subject")


# --------------------------------------------------------------------------- #
# Acceptance case
# --------------------------------------------------------------------------- #

def test_accepts_valid_token():
    tok = make_token()
    claims = auth.verify_token(f"Bearer {tok}")
    assert claims["uid"] == "user-abc-123", "uid must come from verified sub"
    assert claims["sub"] == "user-abc-123"


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failures = 0
    for t in tests:
        try:
            t()
            print(f"PASS  {t.__name__}")
        except AssertionError as e:
            failures += 1
            print(f"FAIL  {t.__name__}: {e}")
    print(f"\n{len(tests) - failures}/{len(tests)} passed")
    raise SystemExit(1 if failures else 0)
