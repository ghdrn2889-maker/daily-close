/* 하나의 원본(prototype.html)에서 세 가지 배포본을 만든다.
     prototype.html  : 아티팩트용 (body 조각, doctype 없음)  ← 원본
     당일마감.html    : 단독 실행용 완전 문서 (더블클릭)
     docs/index.html  : 설치형 PWA (manifest + service worker)
   사용: node build-standalone.js
*/
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync('prototype.html', 'utf8');
const title = (src.match(/<title>([\s\S]*?)<\/title>/) || [, '당일 마감'])[1];
const body = src.replace(/<title>[\s\S]*?<\/title>\s*/, '');
const ver = (src.match(/class="ver">([^<]+)</) || [, '?'])[1];

/* 단독 실행본은 옆에 아이콘 파일이 없으므로 로고 SVG를 그대로 파비콘에 박는다 */
const logoPath = path.join('docs', 'icons', 'logo.svg');
const favicon = fs.existsSync(logoPath)
  ? '\n<link rel="icon" href="data:image/svg+xml,' +
    encodeURIComponent(fs.readFileSync(logoPath, 'utf8').replace(/\n\s*/g, ' ').trim()) + '">'
  : '';

const head = (extra) => `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#F4F5F7">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${title}">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<title>${title}</title>${extra}`;

/* ---------- 1) 단독 실행용 ---------- */
fs.writeFileSync('당일마감.html',
`<!doctype html>
<html lang="ko">
<head>
${head(favicon)}
</head>
<body>
${body}</body>
</html>
`, 'utf8');

/* ---------- 2) PWA ---------- */
const pwaHead = `
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" href="icons/icon-192.png" type="image/png">`;

const swBoot = `
<script>
/* 서비스 워커 등록 — 오프라인 실행과 설치 가능 조건을 만든다.
   보안 컨텍스트(https 또는 localhost)에서만 동작하며, file:// 에서는 조용히 건너뛴다. */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  });
}
</script>`;

fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync(path.join('docs', 'index.html'),
`<!doctype html>
<html lang="ko">
<head>
${head(pwaHead)}
</head>
<body>
${body}${swBoot}
</body>
</html>
`, 'utf8');

/* sw.js 의 캐시 버전을 앱 버전에 맞춰 둔다 — 배포하면 이전 캐시가 정리된다 */
const swPath = path.join('docs', 'sw.js');
if (fs.existsSync(swPath)) {
  const sw = fs.readFileSync(swPath, 'utf8')
    .replace(/const VERSION = '[^']*';/, `const VERSION = '${ver}';`);
  fs.writeFileSync(swPath, sw, 'utf8');
}

console.log('빌드 완료 (' + ver + ')');
console.log('  당일마감.html   ', fs.statSync('당일마감.html').size, 'bytes');
console.log('  docs/index.html  ', fs.statSync(path.join('docs', 'index.html')).size, 'bytes');
