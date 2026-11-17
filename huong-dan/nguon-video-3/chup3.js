// Chụp màn hình (dữ liệu thử) cho video 3: Nhập kho & tuổi tồn kho.
// Máy tính: cap3/bN.png (1280x760 @1.5) · ngăn bên phải: cap3/kN.png · điện thoại: cap3/aN.png (390x844 @2)
const path = require('path'), fs = require('fs');
const { moChrome, cho } = require('./cdp.js');
const OUT = path.join(__dirname, 'cap3'); fs.mkdirSync(OUT, { recursive: true });
const APP = 'http://localhost:3460/?demo=1', QT = 'http://localhost:3460/quan-tri.html?demo=1';
const AD = { token: 'demo', role: 'admin', username: 'ketoan', name: 'Kế toán Cúc' };
const NV = { token: 'demo', role: 'nv', username: 'bhtram', name: 'Trâm' };
const phien = s => 'try { localStorage.clear(); localStorage.setItem("hn_sess", ' + JSON.stringify(JSON.stringify(s)) + '); } catch (e) { }';
const anDemo = 'var b = document.getElementById("demo-bar"); if (b) b.hidden = true;';
const go = (sel, v) => `var o = document.querySelector(${JSON.stringify(sel)}); o.value = ${JSON.stringify(v)}; o.dispatchEvent(new Event('input', { bubbles: true }));`;

(async () => {
  const ch = await moChrome();
  const chup = async (p, ten, ngan) => { await cho(500); await p.chup(path.join(OUT, ten + '.png'), ngan ? { x: 1280 - 620, width: 620 } : null); console.log('chụp', ten); };

  // ===== Trang quản trị (máy tính) =====
  let p = await ch.trang();
  await p.khung(1280, 760, 1.5);
  await p.truocKhiMo(phien(AD));
  await p.mo(QT, 1500); await p.chay(anDemo);
  await p.chay(`await window.DEMO_API('luuPhieuNhap', { ngay: '2026-10-05', kho: 'Kho chính', ncc: 'Viglacera – HĐ 0009876', items: [{ ma: 'GM600600003', sl: 50 }, { ma: 'GM6001200001', sl: 30 }] }, ${JSON.stringify(AD)});`);
  await p.chay('document.querySelector("[data-qt=ton]").click();'); await cho(2200);
  await p.chay('document.querySelector(".qt-h1").scrollIntoView({ block: "start" });');
  await chup(p, 'b1');
  // Lập phiếu: tìm mã
  await p.chay('document.querySelector("[data-qt-act=pn-moi]").click();'); await cho(800);
  await p.chay(go('#pn-kho', 'Kho chính') + go('#pn-ncc', 'Đồng Tâm – HĐ 0001234') + go('#pn-tim', 'GM6006'));
  await chup(p, 'k1', true);
  // Thêm mã + số lượng
  await p.chay(`document.querySelector('#pn-kq [data-pn-them]').click(); await new Promise(r => setTimeout(r, 200));
    ${go('[data-pn-sl="0"]', '40')}
    ${go('#pn-tim', 'keo')} await new Promise(r => setTimeout(r, 200)); document.querySelector('#pn-kq [data-pn-them]').click(); await new Promise(r => setTimeout(r, 200));
    ${go('[data-pn-sl="1"]', '120')}
    ${go('#pn-tim', 'GM3006')} await new Promise(r => setTimeout(r, 200)); document.querySelector('#pn-kq [data-pn-them]').click(); await new Promise(r => setTimeout(r, 200));
    ${go('[data-pn-sl="2"]', '25')}
    document.activeElement.blur(); document.getElementById('qt-ngan').scrollTop = 0;`);
  await chup(p, 'k2', true);
  await p.chay('document.querySelector("[data-qt-act=pn-luu]").click();'); await cho(1800);
  await p.chay('document.querySelector(".qt-h1").scrollIntoView({ block: "start" });');
  await chup(p, 'b2');
  // Bảng tuổi tồn
  await p.chay('var h = document.querySelector(".qt-tuoi-loc").closest(".qt-khung"); h.scrollIntoView({ block: "start" }); window.scrollBy(0, -10);');
  await chup(p, 'b3');
  await p.chay('document.querySelector("[data-tuoi-loc=chua]").click(); await new Promise(r => setTimeout(r, 400)); var h = document.querySelector(".qt-tuoi-loc").closest(".qt-khung"); h.scrollIntoView({ block: "start" }); window.scrollBy(0, -10); var o = document.querySelector(".qt-tuoi-o input"); o.value = "2026-03-10";');
  await chup(p, 'b4');
  await p.dong();

  // ===== App bán hàng: nhân viên (điện thoại) =====
  p = await ch.trang();
  await p.khung(390, 844, 2, true);
  await p.truocKhiMo(phien(NV));
  await p.mo(APP + '#n=gach', 1600); await p.chay(anDemo);
  await p.chay('document.querySelector("[data-act=loc]").click(); await new Promise(r => setTimeout(r, 400)); document.querySelector("[data-sort=ton-lau]").click(); await new Promise(r => setTimeout(r, 400)); var x = document.querySelector(".sh-x"); if (x) x.click();');
  await cho(500);
  await chup(p, 'a1');
  // Lô nhập trong chi tiết sản phẩm
  await p.chay(`await window.DEMO_API('luuPhieuNhap', { ngay: '2026-11-05', items: [{ ma: 'GM600600003', sl: 60 }] }, ${JSON.stringify(AD)});
    await window.DEMO_API('luuPhieuNhap', { ngay: '2026-10-25', items: [{ ma: 'GM600600003', sl: 50 }] }, ${JSON.stringify(AD)});
    var b = document.createElement('button'); b.setAttribute('data-act', 'thu-lai'); b.hidden = true; document.body.appendChild(b); b.click();`);
  await cho(1800);
  await p.chay('location.hash = "n=gach&sp=GM600600003"; await new Promise(r => setTimeout(r, 900)); var t = document.querySelector(".tuoi-dong"); t.scrollIntoView({ block: "center" });');
  await chup(p, 'a2');
  await p.dong();
  await ch.dong();
  console.log('xong');
})().catch(e => { console.error(e); process.exit(1); });
