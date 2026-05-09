<?php
/**
 * OG Proxy for shared analysis links
 * Fetches OG HTML from API server and serves it directly (avoids external redirect for bots).
 * Humans are redirected to the SPA via ?view=1 which bypasses this script.
 */

$shareId = preg_replace('/[^A-Za-z0-9_\-]/', '', $_GET['id'] ?? '');

if (!$shareId) {
    header('Location: /');
    exit;
}

$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isBot = (bool) preg_match(
    '/(facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|LinkedInBot|Slackbot|Discordbot|SkypeUriPreview|vkShare|Googlebot|bingbot|ia_archiver)/i',
    $ua
);

if (!$isBot) {
    // Humans: redirect to SPA — .htaccess sees ?view=1 and skips this script
    header('Location: /analiza/' . rawurlencode($shareId) . '?view=1', true, 302);
    exit;
}

// Bot: fetch OG HTML from API and serve it directly from this domain
$apiUrl = 'https://recovery-calculator-bawolekw9.replit.app/api/vision/og/analiza/' . rawurlencode($shareId);

$ctx = stream_context_create([
    'http' => [
        'timeout'        => 5,
        'user_agent'     => 'MetalRecovery-OGProxy/1.0',
        'ignore_errors'  => true,
    ],
    'ssl' => [
        'verify_peer'      => false,
        'verify_peer_name' => false,
    ],
]);

$html = @file_get_contents($apiUrl, false, $ctx);

if ($html !== false && strlen($html) > 100) {
    // Remove the JS/meta-refresh redirect (bots should stay on this page)
    $html = preg_replace('/<meta[^>]+http-equiv=["\']refresh["\'][^>]*>/i', '', $html);
    $html = preg_replace('/<script[^>]*>window\.location\.replace[^<]+<\/script>/i', '', $html);

    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: public, max-age=300');
    echo $html;
    exit;
}

// Fallback: generic OG page if API unreachable
$esc = fn(string $s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
$shareUrl  = 'https://metalrecovery.online/analiza/' . $shareId;
$ogImage   = 'https://metalrecovery.online/og-preview-v2.jpg';
$ogTitle   = 'Analiza AI — MetalRecovery Pro';
$ogDesc    = 'Precyzyjne szacowanie odzysku złota, srebra, platyny i palladu z e-odpadów elektronicznych.';

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
</head>
<body><a href="{$esc($shareUrl)}">{$esc($ogTitle)}</a></body>
</html>
HTML;
exit;
