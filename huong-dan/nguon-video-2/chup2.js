// Chụp màn hình (dữ liệu thử) cho video 2: đơn hàng, chừa hàng, trang quản trị, phân quyền.
// Ảnh điện thoại: cap2/aN.png (390x844 @2). Ảnh máy tính: cap2/bN.png (1280x760 @1.5); ảnh ngăn chi tiết: cap2/kN.png (chỉ phần ngăn bên phải).
const puppeteer = require('puppeteer-core');
const path = require('path');
const OUT = path.join(__dirname, 'cap2'); require('fs').mkdirSync(OUT, { recursive: true });
const cho = ms => new Promise(r => setTimeout(r, ms));
const APP = 'http://localhost:3460/?demo=1', QT = 'http://localhost:3460/quan-tri.html?demo=1';
(async () => {
  const br = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  async function trang(sess, mob) {
    const p = await br.newPage();
    p.on('pageerror', e => console.log('PAGEERROR', e.message));
    p.on('dialog', d => d.type() === 'prompt' ? d.accept('Anh Tư – xe 67C-123.45') : d.accept());
    if (mob) await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    else await p.setViewport({ width: 1280, height: 760, deviceScaleFactor: 1.5 });
    await p.evaluateOnNewDocument(s => { try { localStorage.clear(); if (s) localStorage.setItem('hn_sess', JSON.stringify(s)); } catch (e) { } }, sess || null);
    return p;
  }
  const chup = async (p, ten, ngan) => {
    await cho(500);
    if (ngan) await p.screenshot({ path: path.join(OUT, ten + '.png'), clip: { x: 1280 - 620, y: 0, width: 620, height: 760 } });
    else await p.screenshot({ path: path.join(OUT, ten + '.png') });
    console.log('chụp', ten);
  };
  const an = p => p.evaluate(() => { const b = document.getElementById('demo-bar'); if (b) b.hidden = true; });

  // ===== Đại lý (điện thoại) =====
  const dl = { token: 'demo', role: 'khachhang', username: 'daily', name: 'Đại lý Minh Phát', tenCty: 'Cửa hàng VLXD Minh Phát', sdt: '0909123456', diaChi: '12 Trần Hưng Đạo, Long Xuyên' };
  let p = await trang(dl, true);
  await p.goto(APP + '#n=gach', { waitUntil: 'networkidle2' }); await cho(1200); await an(p);
  const ma = await p.evaluate(() => document.querySelector('[data-sp]').getAttribute('data-sp'));
  await p.evaluate(m => { location.hash = 'n=gach&sp=' + m; }, ma); await cho(1500); await an(p);
  await p.evaluate(() => { const i = document.getElementById('dh-sl'); i.value = '10'; i.dispatchEvent(new Event('input', { bubbles: true })); i.closest('.box').scrollIntoView({ block: 'center' }); });
  await chup(p, 'a1');
  await p.evaluate(() => document.querySelector('[data-act=them-gio]').click()); await cho(300);
  await p.evaluate(() => { location.hash = 'n=tbvs&sp=VS003'; }); await cho(1200);
  await p.evaluate(() => { const i = document.getElementById('dh-sl'); if (i) { i.value = '2'; document.querySelector('[data-act=them-gio]').click(); } }); await cho(300);
  await p.evaluate(() => document.querySelector('.tb-gio').click()); await cho(800);
  await p.evaluate(() => { document.getElementById('toast').hidden = true; });
  await chup(p, 'a2');
  await p.evaluate(() => document.querySelector('[data-don-loai=chua]').click()); await cho(400);
  await p.evaluate(() => document.querySelector('[data-don-ngay="7"]').click()); await cho(400);
  await p.evaluate(() => { document.querySelector('.chua-box').scrollIntoView({ block: 'center' }); document.getElementById('toast').hidden = true; });
  await chup(p, 'a3');
  await p.evaluate(() => document.querySelector('[data-act=gui-don]').click()); await cho(1800);
  await p.evaluate(() => { document.getElementById('toast').hidden = true; });
  await chup(p, 'a4');
  await p.evaluate(() => { const b = document.querySelector('[data-xin-mo]'); b.closest('.don-the').scrollIntoView({ block: 'center' }); b.click(); }); await cho(400);
  await chup(p, 'a5');
  await p.close();

  // ===== Trang quản trị (máy tính) =====
  p = await trang(null);
  await p.goto(QT, { waitUntil: 'networkidle2' }); await cho(600);
  await chup(p, 'b1');
  await p.close();
  const AD = { token: 'demo', role: 'admin', username: 'admin', name: 'Lê Chí Linh', quyen: [] };
  p = await trang(AD);
  await p.goto(QT, { waitUntil: 'networkidle2' }); await cho(900);
  const chua = await p.evaluate(() => window.DEMO_API('taoDon', { loai: 'chua', soNgay: 15, tenKH: 'VLXD Hòa Bình', sdt: '0911222333', hinhThuc: 'nhan', items: [{ ma: 'VS001', sl: 2 }, { ma: 'VS004', sl: 3 }] }, { username: 'daily2' }));
  await p.evaluate(() => window.DEMO_API('xinGiaHan', { ma: 'HN261029-003', soNgay: 5 }, { username: 'daily' }));
  await p.evaluate(() => document.querySelector('[data-qt-act=lam-moi]').click()); await cho(1200);
  await p.evaluate(() => { document.getElementById('toast').hidden = true; });
  await chup(p, 'b2');
  await p.evaluate(() => document.querySelector('[data-qt=don]').click()); await cho(400);
  await chup(p, 'b3');
  await p.evaluate(() => document.querySelector('tr.dong[data-don="HN261104-007"]').click()); await cho(1500);
  await chup(p, 'k4', true);
  await p.evaluate(() => document.querySelector('[data-qt-act=dong]').click());
  await p.evaluate(m => document.querySelector('tr.dong[data-don="' + m + '"]').click(), chua.ma); await cho(1500);
  await chup(p, 'k5', true);
  await p.evaluate(() => document.querySelector('[data-qt-act=dong]').click());
  await p.evaluate(() => document.querySelector('tr.dong[data-don="HN261029-003"]').click()); await cho(1500);
  await chup(p, 'k6', true);
  await p.evaluate(() => document.querySelector('[data-qt-act=dong]').click());
  // duyệt 1 đơn -> Kho & giao
  await p.evaluate(() => document.querySelector('tr.dong[data-don="HN261104-007"]').click()); await cho(1000);
  await p.evaluate(() => document.querySelector('[data-qt-tt=xacnhan]').click()); await cho(1500);
  await p.evaluate(() => document.querySelector('[data-qt-act=dong]').click());
  await p.evaluate(() => document.querySelector('[data-qt=giao]').click()); await cho(500);
  await p.evaluate(() => { document.getElementById('toast').hidden = true; });
  await chup(p, 'b7');
  await p.evaluate(() => document.querySelector('#qt-main tr.dong[data-don="HN261104-007"]').click()); await cho(1000);
  await p.evaluate(() => document.querySelector('[data-qt-tt=danggiao]').click()); await cho(1600);
  await p.evaluate(() => { document.getElementById('toast').hidden = true; });
  await chup(p, 'k8', true);
  await p.evaluate(() => document.querySelector('[data-qt-act=dong]').click());
  await p.evaluate(() => document.querySelector('[data-qt=baocao]').click()); await cho(400);
  await p.evaluate(() => document.querySelector('[data-bc-ky=namnay]').click()); await cho(1500);
  await chup(p, 'b9');
  await p.evaluate(() => document.querySelector('[data-qt=nhatky]').click()); await cho(1200);
  await chup(p, 'b10');
  await p.evaluate(() => window.DEMO_API('luuQuyen', { username: 'nv', quyen: 'giao,nhapton', gmail: 'thukho.hiennga@gmail.com' }, { role: 'admin', username: 'admin' }));
  await p.evaluate(() => document.querySelector('[data-qt=nhanvien]').click()); await cho(1200);
  await chup(p, 'b11');
  await p.evaluate(() => document.querySelector('[data-qt=gia]').click()); await cho(1200);
  await p.type('#qt-gia-q', 'lavabo'); await cho(400);
  await chup(p, 'b12');
  await p.evaluate(() => document.querySelector('[data-qt=ton]').click()); await cho(1200);
  await chup(p, 'b13');
  await br.close();
})().catch(e => { console.error(e); process.exit(1); });
