// Dựng khung hình 1920x1080 cho từng cảnh (kịch bản trong canh.js) bằng Chrome chạy ngầm.
const puppeteer = require('puppeteer-core');
const fs = require('fs'), path = require('path');
const CANH = require('./canh2.js');
const OUT = path.join(__dirname, 'khung2');
const APP = 'D:/Dự Án Web App Hiền Nga/';
const url = p => 'file:///' + p.replace(/\\/g, '/');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{width:1280px;height:720px;overflow:hidden;font-family:'Segoe UI',Roboto,sans-serif;background:#F3F5F9;color:#141824;position:relative}
.top{height:64px;background:#0140FF;color:#fff;display:flex;align-items:center;gap:14px;padding:0 28px;border-bottom:4px solid #E00000}
.top img{height:42px;background:#fff;border-radius:9px;padding:2px}
.top b{font-size:21px}.top span{opacity:.85;font-size:15px}
.phan{margin-left:auto;background:#E00000;padding:6px 16px;border-radius:999px;font-weight:700;font-size:15px}
.wrap{display:flex;gap:28px;padding:26px 34px 0;height:546px}
.trai{width:500px;flex-shrink:0;display:flex;flex-direction:column;justify-content:center}
.trai h1{font-size:34px;line-height:1.2;margin-bottom:22px;color:#0B1A4A}
.y{display:flex;gap:12px;align-items:flex-start;font-size:20px;line-height:1.35;margin-bottom:14px}
.y i{font-style:normal;flex-shrink:0;width:30px;height:30px;border-radius:50%;background:#0140FF;color:#fff;font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;margin-top:1px}
.phai{flex:1;display:flex;align-items:center;justify-content:center;gap:22px;min-width:0}
.phone{height:520px;border-radius:30px;border:7px solid #1B1E28;box-shadow:0 14px 34px rgba(0,0,0,.25);background:#fff}
.sub{position:absolute;left:0;right:0;bottom:0;height:110px;background:rgba(11,26,74,.92);color:#fff;font-size:21px;line-height:1.4;padding:16px 40px;display:flex;align-items:center}
/* bảng tính mô phỏng */
.gs{width:100%;max-width:700px;background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.15);overflow:hidden;font-size:12.5px}
.gs-ten{display:flex;align-items:center;gap:10px;padding:10px 14px 4px;font-size:15px}
.gs-ten .ic{width:22px;height:28px;background:#1F8A3B;border-radius:3px}
.gs-menu{padding:2px 46px 8px;color:#444;font-size:12.5px;display:flex;gap:14px}
.gs-menu b{color:#0140FF}
.gs table{border-collapse:collapse;width:100%;table-layout:fixed}
.gs td,.gs th{border:1px solid #E1E3E6;padding:5px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;height:26px}
.gs th{background:#F8F9FA;color:#666;font-weight:500;font-size:11.5px}
.gs td.h{background:#E3F2FD;font-weight:700}
.gs td.v{background:#FFF3B0}.gs td.vh{background:#FFD84D;font-weight:700}
.gs td.do{color:#C62828;font-weight:700}
.gs td.n{width:34px;background:#F8F9FA;color:#888;text-align:center}
.gs-tab{display:flex;gap:2px;background:#F1F3F4;padding:6px 10px 0;border-top:1px solid #DDD}
.gs-tab span{padding:6px 14px;font-size:12.5px;color:#555;border-radius:6px 6px 0 0}
.gs-tab span.on{background:#fff;color:#0140FF;font-weight:700;border-bottom:3px solid #0140FF}
.the{background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:18px 20px;font-size:17px}
.o{display:grid;grid-template-columns:1fr 1fr;gap:16px;width:100%;max-width:680px}
.o .the b{display:block;font-size:19px;color:#0140FF;margin-bottom:6px}
.o .the small{color:#5F6776;font-size:15px}
.mui{font-size:34px;color:#E00000;text-align:center}
.menu-mo{position:absolute;background:#fff;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.25);padding:6px 0;font-size:13px;min-width:270px}
.menu-mo div{padding:8px 16px}.menu-mo .on{background:#E8F0FE;color:#0140FF;font-weight:700}
.canh-bao{background:#FDECEA;border:3px solid #E00000;border-radius:16px;padding:22px 26px;font-size:20px;color:#8E1B14;max-width:620px}
.canh-bao b{display:block;font-size:24px;margin-bottom:10px}
`;

function bang(ten, cot, dong, tabs, tabOn, opt) {
  opt = opt || {};
  const chu = 'ABCDEFGHIJ'.split('');
  let h = '<div class="gs" style="position:relative"><div class="gs-ten"><span class="ic"></span>' + esc(ten) + '</div><div class="gs-menu">' +
    ['Tệp', 'Chỉnh sửa', 'Xem', 'Chèn', 'Định dạng', 'Dữ liệu'].map(x => '<span>' + x + '</span>').join('') + (opt.menu ? '<b>' + opt.menu + '</b>' : '') + '</div>';
  h += '<table><colgroup><col style="width:34px">' + (opt.rong || cot.map(() => '')).map(w => '<col style="width:' + (w || 'auto') + '">').join('') + '</colgroup>';
  h += '<tr><th></th>' + cot.map((_, i) => '<th>' + (opt.chu || chu)[i] + '</th>').join('') + '</tr>';
  h += '<tr><td class="n">1</td>' + cot.map((c, i) => '<td class="' + ((opt.vang || []).includes(i) ? 'vh' : 'h') + '">' + esc(c) + '</td>').join('') + '</tr>';
  dong.forEach((r, k) => {
    h += '<tr><td class="n">' + (k + 2) + '</td>' + r.map((c, i) => {
      const cls = (opt.vang || []).includes(i) ? 'v' : ((opt.do || []).includes(i) ? 'do' : '');
      return '<td class="' + cls + '">' + (String(c).startsWith('<') ? c : esc(c)) + '</td>';
    }).join('') + '</tr>';
  });
  h += '</table><div class="gs-tab">' + tabs.map(t => '<span class="' + (t === tabOn ? 'on' : '') + '">' + esc(t) + '</span>').join('') + '</div>';
  if (opt.menuMo) h += '<div class="menu-mo" style="' + opt.menuMo.vt + '">' + opt.menuMo.ds.map((x, i) => '<div class="' + (i === opt.menuMo.on ? 'on' : '') + '">' + esc(x) + '</div>').join('') + '</div>';
  return h + '</div>';
}


// ===== Video 2: hình cho từng cảnh =====
const CSS2 = `
.desk{width:700px;border-radius:12px;border:6px solid #1B1E28;box-shadow:0 14px 34px rgba(0,0,0,.25);background:#fff;display:block}
.ngan{height:520px;border-radius:12px;border:5px solid #1B1E28;box-shadow:0 14px 34px rgba(0,0,0,.25);background:#fff}
.tg{width:600px;background:#8FB98A;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);overflow:hidden;font-size:14px}
.tg-dau{background:#fff;padding:12px 16px;display:flex;gap:12px;align-items:center}
.tg-dau i{width:38px;height:38px;border-radius:50%;background:#E06B4E;color:#fff;font-style:normal;font-weight:700;display:flex;align-items:center;justify-content:center}
.tg-dau small{display:block;color:#7A8290}
.tg-tin{background:#fff;margin:10px 14px;border-radius:12px;padding:10px 14px;line-height:1.45;max-width:520px;box-shadow:0 1px 2px rgba(0,0,0,.12)}
.tg-tin b.bot{color:#2F7FC1;display:block;font-size:13px}
.tg-tin a{color:#2F7FC1}
.qbang{width:640px;background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.12);overflow:hidden;font-size:16px;border-collapse:collapse}
.qbang td,.qbang th{padding:12px 16px;border-bottom:1px solid #E6E9EF;text-align:left}
.qbang th{background:#0140FF;color:#fff}
.qbang td b{color:#0B1A4A}
.buoc{display:flex;flex-direction:column;gap:10px;width:640px}
.buoc .the{display:flex;align-items:center;gap:16px;padding:14px 18px}
.buoc .the b{width:120px;color:#E00000;flex-shrink:0}
`;
const TAB_CHINH2 = ['Giá', 'Users', 'Cài đặt chừa hàng', 'Đơn hàng', 'Chi tiết đơn', 'Nhật ký'];
function hinh(k) {
  const anh = n => url(path.join(__dirname, 'cap2', n + '.png'));
  return k.split('|').map(x => {
    if (/^a\d+$/.test(x)) return '<img class="phone" src="' + anh(x) + '">';
    if (/^b\d+$/.test(x)) return '<img class="desk" src="' + anh(x) + '">';
    if (/^k\d+$/.test(x)) return '<img class="ngan" src="' + anh(x) + '">';
    switch (x) {
      case 'tongquan': return '<div class="o">' + [['📱 Đại lý', 'Giỏ hàng · Gửi đơn · Chừa hàng'], ['🔔 Báo đơn', 'Email + Telegram nhóm chat'], ['🖥 Trang quản trị', 'Duyệt đơn · Kho & giao · Cọc'], ['👥 Phân quyền', 'Nhân viên · Nhật ký · Báo cáo']]
        .map(a => '<div class="the"><b>' + a[0] + '</b><small>' + a[1] + '</small></div>').join('') + '</div>';
      case 'caichua': return bang('Bảng giá & tồn kho Hiển Nga', ['Số ngày chừa', '% đặt cọc (trên tổng tiền)', 'Ghi chú'],
        [['3', '0', 'Mỗi dòng = 1 lựa chọn đại lý thấy'], ['5', '0', ''], ['7', '10', ''], ['10', '10', ''], ['15', '20', ''], ['30', '30', '']],
        TAB_CHINH2, 'Cài đặt chừa hàng', { vang: [0, 1], rong: ['110px', '190px', ''] });
      case 'tele': return '<div class="tg"><div class="tg-dau"><i>CT</i><div><b>Công ty TNHH Thương mại Hiển Nga</b><small>3 thành viên</small></div></div>' +
        '<div class="tg-tin"><b class="bot">Hiển Nga Báo Đơn</b>🛒 Đơn mới HN261105-004 – VLXD Minh Phát – 7.423.200đ<br>Hình thức: Giao tận nơi · cần ngày 08/11<br>SĐT: 0909123456<br>• GM6001200001 – 10 thùng (14,4 m²)<br>• VS003 – 2 bộ<br>Duyệt đơn: <a>…/quan-tri.html#don=HN261105-004</a></div>' +
        '<div class="tg-tin"><b class="bot">Hiển Nga Báo Đơn</b>🔒 Yêu cầu CHỪA HÀNG 15 ngày HN261105-005 – VLXD Hòa Bình<br>Chừa 15 ngày · cọc yêu cầu 2.440.000đ</div>' +
        '<div class="tg-tin" style="margin-bottom:14px"><b class="bot">Hiển Nga Báo Đơn</b>🔒 1 đơn chừa hàng cần quyết (gia hạn / chuyển giao / nhả hàng)<br>❗ ĐÃ HẾT HẠN 04/11 – HN261029-003 – Cửa hàng VLXD Mẫu</div></div>';
      case 'menuapp': return bang('Bảng giá & tồn kho Hiển Nga', ['Mã đơn', 'Ngày đặt', 'Trạng thái', 'Đại lý / cửa hàng', 'Tổng tiền'],
        [['HN261105-004', '05/11/2026', 'Mới – chờ duyệt', 'VLXD Minh Phát', '7423200'], ['HN261104-007', '04/11/2026', 'Đã xác nhận', 'Cửa hàng VLXD Minh Phát', '9216000'], ['HN261029-003', '29/10/2026', 'Đang chừa hàng', 'Cửa hàng VLXD Mẫu', '7000000'], ['', '', '', '', ''], ['', '', '', '', '']],
        TAB_CHINH2, 'Đơn hàng', { menu: '📱 App', rong: ['110px', '90px', '120px', '', '80px'],
          menuMo: { vt: 'top:56px;right:10px', ds: ['0. Cấp quyền cho app (Email, Telegram, nhắc hạn)', '1. Khởi tạo các tab', 'Xóa bộ nhớ đệm', 'Gửi thử báo đơn (Email + Telegram)', 'Cài email nhận báo đơn (chính + kho)', 'Cài Telegram báo đơn (nhóm chat chính / kho)', 'Bật nhắc chừa hàng hết hạn (7h sáng)'], on: 5 } });
      case 'quyen': return '<table class="qbang"><tr><th>Ai</th><th>Tick các quyền</th></tr>' +
        [['Thủ kho', 'Kho & giao hàng · Nhập tồn kho (+ Gmail)'], ['Kế toán', 'Nhập / sửa giá · Ghi tiền cọc · Xem báo cáo'], ['Bán hàng', 'Duyệt đơn · Duyệt chừa hàng · Ghi chú nội bộ'], ['Quản trị (admin)', 'Toàn quyền + Nhân viên & quyền']]
          .map(r => '<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td></tr>').join('') + '</table>';
      case 'quytrinh': return '<div class="buoc">' + [['Đại lý', '🛒 Giỏ hàng → Gửi đơn / Chừa hàng'], ['Công ty', '🔔 Nhận Telegram → Duyệt đơn / Duyệt chừa'], ['Kho', '🚚 Đang giao → Đã giao'], ['Quản trị', '📊 Báo cáo · 📜 Nhật ký · 👥 Phân quyền']]
        .map((a, i) => '<div class="the"><b>' + (i + 1) + '. ' + a[0] + '</b><span>' + a[1] + '</span></div>').join('<div class="mui" style="font-size:22px;line-height:1">⬇</div>') + '</div>';
    }
    return '';
  }).join('');
}

function trang(c, i) {
  return '<!doctype html><html><head><meta charset="utf-8"><style>' + CSS + CSS2 + '</style></head><body>' +
    '<div class="top"><img src="' + url(APP + 'img/logo-mark.png') + '"><b>Hướng dẫn đơn hàng & quản trị</b><span>App Hiển Nga</span><span class="phan">' + esc(c.phan) + '</span></div>' +
    '<div class="wrap"><div class="trai"><h1>' + esc(c.tieuDe) + '</h1>' + c.y.map((t, k) => '<div class="y"><i>' + (k + 1) + '</i><span>' + esc(t) + '</span></div>').join('') + '</div>' +
    '<div class="phai">' + hinh(c.hinh) + '</div></div>' +
    '<div class="sub">' + esc(c.loi) + '</div>' +
    '<div style="position:absolute;right:16px;bottom:116px;font-size:13px;color:#8A93A3">' + (i + 1) + ' / ' + CANH.length + '</div></body></html>';
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const br = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
  const p = await br.newPage();
  await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1.5 });
  const chiCanh = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
  for (let i = 0; i < CANH.length; i++) {
    if (chiCanh && !chiCanh.includes(i)) continue;
    const f = path.join(OUT, 'c' + String(i).padStart(2, '0') + '.html');
    fs.writeFileSync(f, trang(CANH[i], i));
    await p.goto(url(f), { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 300));
    await p.screenshot({ path: f.replace('.html', '.png') });
  }
  fs.writeFileSync(path.join(__dirname, 'loi2.json'), JSON.stringify(CANH.map(c => c.loi)), 'utf8');
  await br.close();
  console.log('xong', CANH.length, 'khung');
})().catch(e => { console.error(e); process.exit(1); });
