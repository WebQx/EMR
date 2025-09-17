Development RSA keypair for JWT (DO NOT USE IN PROD)

Files (generate if missing):
  private.pem  (keep secret)
  public.pem   (published via JWKS)

Generate new pair:
```
openssl genrsa -out private.pem 4096
openssl rsa -in private.pem -pubout -out public.pem
```
