/* 앱 아이콘 생성 — 시안 03 "네 축"
   수익(파랑) · 경비(주황) · 소비(빨강) · 고정지출(보라) 네 갈래를
   앱 안에서 쓰는 색 그대로 링으로 옮긴 마크.
   실행: node gen-icons.js   (크롬으로 렌더해 PNG로 저장)
*/
const p = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = path.join('docs', 'icons');
const BG = '#15181D';

/* 링: 반지름 146, 선 굵기 62. 둘레 917.35 → 4등분 229.34, 사이 간격을 두고 203씩 그린다 */
const RING = `
  <g transform="rotate(-90 256 256)" fill="none" stroke-width="62" stroke-linecap="butt">
    <circle cx="256" cy="256" r="146" stroke="#2D6FF7" stroke-dasharray="203 714" stroke-dashoffset="0"/>
    <circle cx="256" cy="256" r="146" stroke="#E08700" stroke-dasharray="203 714" stroke-dashoffset="-229"/>
    <circle cx="256" cy="256" r="146" stroke="#EC4756" stroke-dasharray="203 714" stroke-dashoffset="-458"/>
    <circle cx="256" cy="256" r="146" stroke="#7C5CF0" stroke-dasharray="203 714" stroke-dashoffset="-688"/>
  </g>`;

const svg = (scale) =>
`<svg viewBox="0 0 512 512" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(256,256) scale(${scale}) translate(-256,-256)">${RING}
  </g>
</svg>`;

const page = (radius, scale) =>
`<!doctype html><html><body style="margin:0">
<div style="width:512px;height:512px;background:${BG};border-radius:${radius}px;
  display:flex;align-items:center;justify-content:center;overflow:hidden">${svg(scale)}</div>
</body></html>`;

/* [파일명, 출력크기, 모서리반경(512 기준), 마크 배율]
   maskable 은 안드로이드가 원형·스퀴클로 잘라내므로 배경을 꽉 채우고 마크를 안전영역 안에 둔다 */
const JOBS = [
  ['icon-512.png',          512, 114, 1],
  ['icon-192.png',          192, 114, 1],
  ['icon-maskable-512.png', 512,   0, 0.66],
  ['apple-touch-icon.png',  180,   0, 1],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  /* 원본 SVG도 보관 — 나중에 다른 크기가 필요할 때 여기서 다시 뽑는다 */
  fs.writeFileSync(path.join(OUT, 'logo.svg'),
`<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="114" fill="${BG}"/>${RING}
</svg>
`, 'utf8');

  const b = await p.launch({ executablePath: CHROME, headless: 'new' });
  for (const [name, size, radius, scale] of JOBS) {
    const pg = await b.newPage();
    await pg.setViewport({ width: 512, height: 512, deviceScaleFactor: size / 512 });
    await pg.setContent(page(radius, scale), { waitUntil: 'load' });
    await pg.screenshot({ path: path.join(OUT, name), omitBackground: true });
    await pg.close();
    console.log('  ' + name, size + 'x' + size);
  }
  await b.close();
  console.log('아이콘 생성 완료 — 시안 03 네 축');
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
