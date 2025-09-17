<?php
// WebQX Session Bridge
// Creates or resumes OpenEMR/PHP session from validated JWT claims.

require_once __DIR__ . '/jwt_validator.php';

// Ensure PHP session started early
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$claims = webqx_extract_claims();
if ($claims) {
    // Map claims to OpenEMR session context (simplified placeholder logic)
    $userId = $claims['user_id'] ?? $claims['sub'] ?? null;
    $role = $claims['role'] ?? 'user';
    $email = $claims['email'] ?? null;

    if ($userId) {
        // Example mapping; adjust to actual OpenEMR expected keys
        $_SESSION['webqx_jwt_user_id'] = $userId;
        $_SESSION['authUser'] = $email ?: ('user_' . $userId);
        $_SESSION['user_role'] = $role;
        $_SESSION['webqx_authenticated_via'] = 'django-jwt';

        // Basic role gating example
        if ($role === 'provider') {
            $_SESSION['is_provider'] = true;
        } elseif ($role === 'admin') {
            $_SESSION['is_admin'] = true;
        }
    }
}

?>
