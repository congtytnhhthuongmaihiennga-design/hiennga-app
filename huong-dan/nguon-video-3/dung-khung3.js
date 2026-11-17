// Dựng khung hình 1920x1080 cho từng cảnh (canh3.js) bằng Chrome chạy ngầm (cdp.js, không cần thư viện).
const fs = require('fs'), path = require('path');
const { moChrome, cho } = require('./cdp.js');
const CANH = require('./canh3.js');
const OUT = path.join(__dirname, 'khung3');
const APP = 'D:/Dự Án Web App Hiền Nga/';
const url = p => 'file:///' + p.replace(/\\/g, '/');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{width:1280px;height:720px;overflow:hidden;font-family:'Segoe UI',Roboto,sans-serif;background:#F3F5F9;color:#141824;position:relative}
.top{height:64px;background:#0140FF;color:#fff;display:flex;align-items:center;gap:14px;padding:0 28px;border-bottom:4px solid #E00000}
.top img{height:42px;background:#fff;border-radius:9px;padding:2px}
.top b{font-size:21px}.top span{opacity:.85;font-size:15px}
.phan{margin-left:auto;background:#E00000;padding:6px 16px;border-radius:999px;font-weight:700;font-size:15px;opacity:1!important}
.wrap{display:flex;gap:28px;padding:26px 34px 0;height:546px}
.trai{width:470px;flex-shrink:0;display:flex;flex-direction:column;justify-content:center}
.trai h1{font-size:34px;line-height:1.2;margin-bottom:22px;color:#0B1A4A}
.y{display:flex;gap:12px;align-items:flex-start;font-size:20px;line-height:1.35;margin-bottom:14px}
.y i{font-style:normal;flex-shrink:0;width:30px;height:30px;border-radius:50%;background:#0140FF;color:#fff;font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;margin-top:1px}
.phai{flex:1;display:flex;align-items:center;justify-content:center;gap:22px;min-width:0}
.phone{height:520px;border-radius:30px;border:7px solid #1B1E28;box-shadow:0 14px 34px rgba(0,0,0,.25);background:#fff}
.desk{width:700px;border-radius:12px;border:6px solid #1B1E28;box-shadow:0 14px 34px rgba(0,0,0,.25);background:#fff;display:block}
.ngan{height:520px;border-radius:12px;border:5px solid #1B1E28;box-shadow:0 14px 34px rgba(0,0,0,.25);background:#fff}
.sub{position:absolute;left:0;right:0;bottom:0;height:110px;background:rgba(11,26,74,.92);color:#fff;font-size:20px;line-height:1.4;padding:14px 40px;display:flex;align-items:center}
.the{background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:18px 20px;font-size:17px}
.o{display:grid;grid-template-columns:1fr 1fr;gap:16px;width:100%;max-width:680px}
.o .the b{display:block;font-size:19px;color:#0140FF;margin-bottom:6px}
.o .the small{color:#5F6776;font-size:15px}
.buoc{display:flex;flex-direction:column;gap:10px;width:640px}
.buoc .the{display:flex;align-items:center;gap:16px;padding:14px 18px}
.buoc .the b{width:150px;color:#E00000;flex-shrink:0}
.mui{color:#E00000;text-align:center;font-size:22px;line-height:1}
.kho{width:640px;display:flex;flex-direction:column;gap:10px}
.kho .dau{font-size:18px;color:#0B1A4A;font-weight:700;text-align:center;margin-bottom:4px}
.lo{display:flex;align-items:center;gap:14px;border-radius:14px;padding:14px 18px;font-size:18px;box-shadow:0 6px 18px rgba(0,0,0,.10)}
.lo b{min-width:120px}.lo span{flex:1}.lo small{font-weight:700}
.lo.moi{background:#E7F6EC;color:#1F7A3A}.lo.tb{background:#EEF1F6;color:#4A5468}.lo.cu{background:#FFF1DC;color:#9A5B00;border:3px solid #E59A1E}
.chu{font-size:15px;color:#5F6776;text-align:center;margin-top:6px}
`;
function hinh(k) {
  const anh = n => url(path.join(__dirname, 'cap3', n + '.png'));
  return k.split('|').map(x => {
    if (/^a\d+$/.test(x)) return '<img class="phone" src="' + anh(x) + '">';
    if (/^b\d+$/.test(x)) return '<img class="desk" src="' + anh(x) + '">';
    if (/^k\d+$/.test(x)) return '<img class="ngan" src="' + anh(x) + '">';
    switch (x) {
      case 'tongquan': return '<div class="o">' + [['📥 Phiếu nhập kho', 'Hàng về: ghi mã, số lượng, ngày nhập'], ['🗓 Ghi ngày nhanh', 'Hàng tồn cũ: chọn ngày → Lưu'], ['🎨 Tuổi tồn có màu', 'Xanh · xám · cam · đỏ (nên sale)'], ['🛒 Bán hàng', 'Thấy hàng tồn lâu để ưu tiên đẩy']]
        .map(a => '<div class="the"><b>' + a[0] + '</b><small>' + a[1] + '</small></div>').join('') + '</div>';
      case 'fifo': return '<div class="kho"><div class="dau">Trong kho còn 212,75 thùng (theo Sheet Tồn kho)</div>' +
        '<div class="lo moi"><b>Lô 05/11</b><span>60 thùng · phiếu nhập mới nhất</span><small>bán sau</small></div>' +
        '<div class="lo tb"><b>Lô 25/10</b><span>50 thùng · phiếu nhập trước đó</span><small></small></div>' +
        '<div class="lo cu"><b>Hàng cũ 14/10</b><span>102,75 thùng · chưa có phiếu</span><small>bán trước</small></div>' +
        '<div class="chu">Lô cũ nhất còn trong kho (14/10) → tính số ngày tồn của mã này</div></div>';
      case 'quytrinh': return '<div class="buoc">' + [['Hàng về', '📥 Lập phiếu nhập (mã · số lượng · ngày)'], ['Hàng tồn cũ', '🗓 Ghi ngày nhập 1 lần'], ['Kế toán', '📄 Cập nhật số tồn từ phần mềm kho như cũ'], ['Bán hàng', '🔴🟠 Ưu tiên đẩy hàng tồn lâu']]
        .map((a, i) => '<div class="the"><b>' + (i + 1) + '. ' + a[0] + '</b><span>' + a[1] + '</span></div>').join('<div class="mui">⬇</div>') + '</div>';
    }
    return '';
  }).join('');
}
function trang(c, i) {
  return '<!doctype html><html><head><meta charset="utf-8"><style>' + CSS + '</style></head><body>' +
    '<div class="top"><img src="' + url(APP + 'img/logo-mark.png') + '"><b>Hướng dẫn nhập kho & tuổi tồn</b><span>App Hiển Nga</span><span class="phan">' + esc(c.phan) + '</span></div>' +
    '<div class="wrap"><div class="trai"><h1>' + esc(c.tieuDe) + '</h1>' + c.y.map((t, k) => '<div class="y"><i>' + (k + 1) + '</i><span>' + esc(t) + '</span></div>').join('') + '</div>' +
    '<div class="phai">' + hinh(c.hinh) + '</div></div>' +
    '<div class="sub">' + esc(c.loi) + '</div>' +
    '<div style="position:absolute;right:16px;bottom:116px;font-size:13px;color:#8A93A3">' + (i + 1) + ' / ' + CANH.length + '</div></body></html>';
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ch = await moChrome(9334), p = await ch.trang();
  await p.khung(1280, 720, 1.5);
  for (let i = 0; i < CANH.length; i++) {
    const f = path.join(OUT, 'c' + String(i).padStart(2, '0') + '.html');
    fs.writeFileSync(f, trang(CANH[i], i));
    await p.mo(url(f), 600);
    await p.chup(f.replace(/\.html$/, '.png'));
    console.log('khung', i);
  }
  fs.writeFileSync(path.join(__dirname, 'loi3.json'), JSON.stringify(CANH.map(c => c.loi), null, 1));
  await p.dong(); await ch.dong();
})().catch(e => { console.error(e); process.exit(1); });
