// Chụp màn hình app (khổ điện thoại) cho video hướng dẫn.
const puppeteer = require('puppeteer-core');
const path = require('path');
const OUT = path.join(__dirname, 'cap');
const LIVE = 'https://congtytnhhthuongmaihiennga-design.github.io/hiennga-app/';
const DEMO = 'http://localhost:3460/?demo=1';
const cho = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const br = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new' });
  async function trang(sess) {
    const p = await br.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.evaluateOnNewDocument(s => {
      try { localStorage.clear(); if (s) localStorage.setItem('hn_sess', JSON.stringify(s)); } catch (e) { }
    }, sess || null);
    return p;
  }
  async function chup(p, ten) { await cho(500); await p.screenshot({ path: path.join(OUT, ten + '.png') }); console.log('đã chụp', ten); }

  // --- App thật, chế độ khách ---
  let p = await trang(null);
  await p.goto(LIVE, { waitUntil: 'networkidle2', timeout: 90000 });
  await p.waitForSelector('.banner', { timeout: 90000 });
  await chup(p, '01-trangchu');
  await p.evaluate(() => { const h = [...document.querySelectorAll('.h2')].find(x => x.innerText.indexOf('Thương hiệu') === 0); window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 120); });
  await chup(p, '02-thuonghieu');
  await p.evaluate(() => { location.hash = 'n=gach'; window.scrollTo(0, 0); });
  await cho(800); await chup(p, '03-ds-gach');
  await p.evaluate(() => { location.hash = 'n=gach&sp=GHT.BC6600T'; });
  await cho(900); await chup(p, '04-chitiet-khach');
  await p.evaluate(() => { document.querySelector('[data-act=dong]').click(); });
  await cho(500);
  await p.evaluate(() => { document.querySelector('.topbar [data-act=dang-nhap]').click(); });
  await chup(p, '05-dangnhap');
  await p.close();

  // --- Dữ liệu dùng thử: đã đăng nhập (giá đại lý, tồn kho) ---
  const nv = { token: 'demo', role: 'nv', username: 'nv', name: 'Nhân viên Hiển Nga', tenCty: '' };
  p = await trang(nv);
  await p.goto(DEMO + '#n=gach', { waitUntil: 'networkidle2' });
  await p.waitForSelector('.row .ton', { timeout: 30000 });
  await p.evaluate(() => document.getElementById('demo-bar').hidden = true);
  await chup(p, '06-ds-dangnhap');
  await p.evaluate(() => { document.querySelector('[data-act=loc]').click(); });
  await chup(p, '07-loc');
  await p.evaluate(() => { document.querySelector('[data-act=dong]').click(); });
  await cho(400);
  await p.evaluate(() => { location.hash = 'n=gach&sp=GM400800007'; });
  await cho(900);
  await p.evaluate(() => { const i = document.getElementById('qd-m2'); if (i) { i.value = '25'; i.dispatchEvent(new Event('input', { bubbles: true })); } const s = document.getElementById('sheet'); s.scrollTop = 300; });
  await chup(p, '08-chitiet-tonkho');
  await p.close();

  // --- Đại lý: tồn kho chỉ thấy 50+ ---
  p = await trang({ token: 'demo', role: 'khachhang', username: 'daily', name: 'Đại lý Minh Phát', tenCty: 'Cửa hàng VLXD Minh Phát' });
  await p.goto(DEMO + '#n=gach&sp=GM300600008', { waitUntil: 'networkidle2' });
  await cho(1500);
  await p.evaluate(() => { document.getElementById('demo-bar').hidden = true; const s = document.getElementById('sheet'); s.scrollTop = 260; });
  await chup(p, '09-chitiet-daily');
  await p.close();

  // --- Quản trị: menu + quản lý tài khoản ---
  p = await trang({ token: 'demo', role: 'admin', username: 'admin', name: 'Lê Chí Linh', tenCty: '' });
  await p.goto(DEMO, { waitUntil: 'networkidle2' });
  await p.waitForSelector('.banner', { timeout: 30000 });
  await p.evaluate(() => { document.getElementById('demo-bar').hidden = true; document.querySelector('[data-act=menu]').click(); });
  await chup(p, '10-menu-admin');
  await p.evaluate(() => { document.querySelector('[data-act=quan-ly]').click(); });
  await cho(900); await chup(p, '11-quanly-taikhoan');
  await p.evaluate(() => { document.querySelector('[data-act=user-moi]').click(); });
  await cho(400); await chup(p, '12-them-taikhoan');
  await p.close();
  await br.close();
})().catch(e => { console.error(e); process.exit(1); });
