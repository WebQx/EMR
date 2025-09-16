<?php
// WebQX JWT Validator - Phase 1 HS256 shared secret implementation
// Validates Django-issued JWT and returns claims array or null.

function webqx_get_authorization_token(): ?string {
    // Header Authorization: Bearer <token>
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $m)) {
            return trim($m[1]);
        }
    }
    // Fallback cookie (HttpOnly cookie cannot be read by JS but PHP can)
    if (!empty($_COOKIE['webqx_access'])) {
        return $_COOKIE['webqx_access'];
    }
    return null;
}

function webqx_base64url_decode(string $data): string {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $padlen = 4 - $remainder;
        $data .= str_repeat('=', $padlen);
    }
    return base64_decode(strtr($data, '-_', '+/')) ?: '';
}

function webqx_fetch_jwks(): array {
    static $cache = null; static $cacheTime = 0;
    if ($cache && (time() - $cacheTime) < 300) return $cache; // 5 min cache
    // Prefer new short alias /auth/.well-known/jwks.json; fallback to legacy /api/v1/auth/.well-known/jwks.json for compatibility
    $jwksUrl = getenv('DJANGO_JWKS_URL');
    if (!$jwksUrl && getenv('DJANGO_BASE_URL')) {
        $base = rtrim(getenv('DJANGO_BASE_URL'), '/');
        $jwksUrl = $base . '/auth/.well-known/jwks.json';
        // Legacy fallback if alias not yet deployed
        if (!@file_get_contents($jwksUrl)) {
            $jwksUrl = $base . '/api/v1/auth/.well-known/jwks.json';
        }
    }
    if (!$jwksUrl) return [];
    try {
        $json = @file_get_contents($jwksUrl);
        if (!$json) return [];
        $data = json_decode($json, true);
        if (!isset($data['keys'])) return [];
        $cache = $data['keys'];
        $cacheTime = time();
        return $cache;
    } catch (Exception $e) {
        return [];
    }
}

function webqx_rsa_verify(string $message, string $signature, array $jwk): bool {
    if (($jwk['kty'] ?? '') !== 'RSA') return false;
    $n = $jwk['n'] ?? null; $e = $jwk['e'] ?? null;
    if (!$n || !$e) return false;
    $mod = base64_decode(strtr($n, '-_', '+/')); $exp = base64_decode(strtr($e, '-_', '+/'));
    if (!$mod || !$exp) return false;
    // Build PEM public key from modulus/exponent
    $components = [
        'modulus' => $mod,
        'publicExponent' => $exp
    ];
    // ASN.1 DER encoding (simplified)
    $rsaPublicKey = "\x30" . webqx_der_length(
        strlen("\x02".webqx_der_length(strlen(ltrim($mod, "\x00"))).ltrim($mod, "\x00")) +
        strlen("\x02".webqx_der_length(strlen($exp)).$exp)
    ) .
    "\x02" . webqx_der_length(strlen(ltrim($mod, "\x00"))) . ltrim($mod, "\x00") .
    "\x02" . webqx_der_length(strlen($exp)) . $exp;
    $bitString = "\x03" . webqx_der_length(strlen($rsaPublicKey)+1) . "\x00" . $rsaPublicKey;
    $algId = hex2bin('300d06092a864886f70d0101010500');
    $subjectPublicKeyInfo = "\x30" . webqx_der_length(strlen($algId) + strlen($bitString)) . $algId . $bitString;
    $pem = "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($subjectPublicKeyInfo), 64, "\n") . "-----END PUBLIC KEY-----\n";
    $ok = openssl_verify($message, $signature, $pem, OPENSSL_ALGO_SHA256);
    return $ok === 1;
}

function webqx_der_length($length): string {
    if ($length < 0x80) return chr($length);
    $bytes = ltrim(pack('N', $length), "\x00");
    return chr(0x80 | strlen($bytes)) . $bytes;
}

function webqx_validate_jwt(string $jwt): ?array {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return null;
    [$h64, $p64, $s64] = $parts;
    $header = json_decode(webqx_base64url_decode($h64), true);
    $payload = json_decode(webqx_base64url_decode($p64), true);
    if (!$header || !$payload) return null;
    $algo = $header['alg'] ?? '';

    $message = $h64 . '.' . $p64;
    $sigProvided = webqx_base64url_decode($s64);

    $valid = false;
    if ($algo === 'HS256') {
        $secret = getenv('DJANGO_JWT_SHARED_SECRET') ?: getenv('DJANGO_SECRET_KEY');
        if ($secret) {
            $expected = hash_hmac('sha256', $message, $secret, true);
            $valid = hash_equals($expected, $sigProvided);
        }
    } elseif ($algo === 'RS256') {
        $jwks = webqx_fetch_jwks();
        foreach ($jwks as $jwk) {
            if (($jwk['alg'] ?? '') === 'RS256') {
                if (webqx_rsa_verify($message, $sigProvided, $jwk)) { $valid = true; break; }
            }
        }
    }
    if (!$valid) return null;

    $now = time();
    if (isset($payload['exp']) && $now >= (int)$payload['exp']) return null;
    if (isset($payload['nbf']) && $now < (int)$payload['nbf']) return null;
    if (isset($payload['iat']) && $now + 300 < (int)$payload['iat']) return null;
    $issuer = getenv('DJANGO_JWT_ISSUER') ?: 'webqx.healthcare';
    if (isset($payload['iss']) && $payload['iss'] !== $issuer) return null;
    $aud = getenv('DJANGO_JWT_AUDIENCE') ?: 'webqx.emr';
    if (isset($payload['aud']) && $payload['aud'] !== $aud) return null;
    return $payload;
}

function webqx_extract_claims(): ?array {
    static $cached = null;
    if ($cached !== null) return $cached;
    $token = webqx_get_authorization_token();
    if (!$token) {
        $cached = null; return null;
    }
    $claims = webqx_validate_jwt($token);
    $cached = $claims;
    return $claims;
}

?>
