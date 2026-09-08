const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const publicDir = path.resolve(__dirname, '..', 'public');
const htmlFile = path.join(distDir, 'index.html');

console.log('[postbuild] Ensuring PWA icons and metadata in dist/...');

// 1. Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 2. Copy all files from public/ into dist/
if (fs.existsSync(publicDir)) {
  const files = fs.readdirSync(publicDir);
  files.forEach((file) => {
    const src = path.join(publicDir, file);
    const dest = path.join(distDir, file);
    fs.copyFileSync(src, dest);
    console.log(`[postbuild] Copied ${file} -> dist/${file}`);
  });
}

// 3. Inject homescreen tags into dist/index.html if missing
if (fs.existsSync(htmlFile)) {
  let html = fs.readFileSync(htmlFile, 'utf8');
  if (!html.includes('rel="apple-touch-icon"')) {
    const tags = `\n    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon-precomposed.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="ConstitutAI">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="application-name" content="ConstitutAI">
`;
    html = html.replace('</head>', `${tags}</head>`);
    fs.writeFileSync(htmlFile, html, 'utf8');
    console.log('[postbuild] Injected PWA tags into dist/index.html');
  } else {
    console.log('[postbuild] dist/index.html already contains PWA icon tags');
  }
} else {
  console.warn('[postbuild] dist/index.html not found!');
}

console.log('[postbuild] Completed successfully.');
