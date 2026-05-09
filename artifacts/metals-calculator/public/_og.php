<?php
/**
 * OG proxy for shared analysis links.
 * Fetches OG HTML from API and serves it directly.
 * Strips meta-refresh to prevent bots from making a 2nd request
 * (LiteSpeed rate-limits facebookexternalhit after 1st request).
 * JS redirect remains — browsers execute it, bots ignore it.
 */

$shareId = preg_replace('/[^A-Za-z0-9_\-]/', '', $_GET['id'] ?? '');

if (!$shareId) {
    header('Location: /');
    exit;
}

$apiUrl = 'https://recovery-calculator-bawolekw9.replit.app/api/vision/og/analiza/' . rawurlencode($shareId);

$ctx = stream_context_create([
    'http' => [
        'timeout'       => 6,
        'user_agent'    => 'MetalRecovery-OGProxy/1.0',
        'ignore_errors' => true,
    ],
    'ssl' => [
        'verify_peer'      => false,
        'verify_peer_name' => false,
    ],
]);

$html = @file_get_contents($apiUrl, false, $ctx);

if ($html !== false && strlen($html) > 100) {
    // Strip meta-refresh: bots (Facebook, WhatsApp etc.) would follow it and
    // make a 2nd request to the same domain — triggering LiteSpeed rate limit.
    // JS redirect remains in place — browsers execute it, bots ignore JS.
    $html = preg_replace(
        '/<meta\s[^>]*http-equiv=["\']refresh["\'][^>]*\/?>/i',
        '',
        $html
    );

    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: public, max-age=300');
    echo $html;
    exit;
}

// Fallback — generic OG when API is unreachable
$shareUrl = 'https://metalrecovery.online/analiza/' . $shareId;
$spaUrl   = 'https://metalrecovery.online/analiza/' . $shareId . '?view=1';
$ogImage  = 'https://metalrecovery.online/og-preview-v2.jpg';
$ogTitle  = 'Analiza AI — MetalRecovery Pro';
$ogDesc   = 'Precyzyjne szacowanie odzysku złota, srebra, platyny i palladu z e-odpadów elektronicznych.';
$esc      = fn(string $s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=60');
echo <<<HTML
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8"/>
<title>{$esc($ogTitle)}</title>
<meta name="description" content="{$esc($ogDesc)}"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="{$esc($shareUrl)}"/>
<meta property="og:site_name" content="MetalRecovery Pro"/>
<meta property="og:title" content="{$esc($ogTitle)}"/>
<meta property="og:description" content="{$esc($ogDesc)}"/>
<meta property="og:image" content="{$esc($ogImage)}"/>
<meta property="og:image:type" content="image/jpeg"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{$esc($ogTitle)}"/>
<meta name="twitter:image" content="{$esc($ogImage)}"/>
<script>window.location.replace({$esc(json_encode($spaUrl))});</script>
</head>
<body><a href="{$esc($spaUrl)}">{$esc($ogTitle)}</a></body>
</html>
HTML;
exit;
