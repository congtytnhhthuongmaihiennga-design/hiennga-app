// Dựng khung hình 1920x1080 cho từng cảnh (kịch bản trong canh.js) bằng Chrome chạy ngầm.
const puppeteer = require('puppeteer-core');
const fs = require('fs'), path = require('path');
const CANH = require('./canh.js');
const OUT = path.join(__dirname, 'khung');
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

const TAB_CHINH = ['Giá', 'Thương hiệu', 'Users', 'Hãng viết tắt', 'Hướng dẫn'];
const GIA_COT = ['Hãng', 'Nhóm hàng', 'Mã hàng', 'Tên hàng', 'Kích cỡ', 'Đơn vị', 'Giá niêm yết', 'Giá đại lý', 'Hiện trên app'];
const GIA_DONG = [
  ['HT', 'Gạch ốp lát', 'GHT.BC6600T', 'Gạch HT 60x60 BC6600 Trắng Loại 1', '60x60', 'm²', '258000', '215000', ''],
  ['CMC', 'Gạch ốp lát', 'GCMCDG103315', 'Gạch CMC 10x33 DG103315 loại 1', '10x33', 'm²', '185000', '160000', ''],
  ['Inax', 'Thiết bị vệ sinh', 'L284', 'Chân Lavabo dài Inax L284 màu trắng', '', 'cái', '650000', '560000', ''],
  ['American Standard', 'Thiết bị vệ sinh', 'TBVF1862', 'Cầu American Loven VF1862 (1 khối)', '', 'bộ', '9100000', '6370000', ''],
  ['', 'Nội bộ', 'DPHN', 'Đồng phục Hiển Nga nữ', '', 'cái', '', '', 'Không']
];

function hinh(k) {
  const phone = n => '<img class="phone" src="' + url(path.join(__dirname, 'cap', n + '.png')) + '">';
  return k.split('|').map(x => {
    if (x[0] === 'p' && /^p\d/.test(x)) return phone(x.slice(1));
    switch (x) {
      case 'tongquan': return '<div class="o">' + [['📊 Sheet chính', 'Giá · Users · Thương hiệu'], ['📦 Sheet Tồn kho', 'Nhập file thẻ kho'], ['📷 Sheet Hình ảnh', 'Dán link ảnh Drive'], ['📱 Web app', 'Đại lý xem trên điện thoại']]
        .map(a => '<div class="the"><b>' + a[0] + '</b><small>' + a[1] + '</small></div>').join('') + '</div>';
      case 'sodo': return '<div style="display:flex;flex-direction:column;gap:14px;width:100%;max-width:660px">' +
        [['Quản lý', 'Sheet chính – Giá, Users, Thương hiệu'], ['Người nhập kho', 'Sheet Tồn kho'], ['Người lo ảnh', 'Sheet Hình ảnh sản phẩm']]
          .map(a => '<div class="the" style="display:flex;align-items:center;gap:14px"><b style="color:#E00000;width:170px">' + a[0] + '</b><span>→ ' + a[1] + '</span></div>').join('') +
        '<div class="mui">⬇</div><div class="the" style="text-align:center;background:#0140FF;color:#fff;font-weight:700">📱 App Hiển Nga tự đọc cả 3 Sheet</div></div>';
      case 'gia': return bang('Bảng giá & tồn kho Hiển Nga', GIA_COT, GIA_DONG.slice(0, 4), TAB_CHINH, 'Giá', { vang: [6, 7], rong: ['62px', '84px', '96px', '', '50px', '40px', '78px', '78px', '74px'] });
      case 'giaan': return bang('Bảng giá & tồn kho Hiển Nga', GIA_COT, GIA_DONG, TAB_CHINH, 'Giá', { do: [8], menu: '📱 App', rong: ['62px', '84px', '96px', '', '50px', '40px', '78px', '78px', '74px'],
        menuMo: { vt: 'top:56px;right:14px', ds: ['1. Khởi tạo các tab', '2. Bật tự làm mới mỗi 15 phút', 'Xóa bộ nhớ đệm (app lấy dữ liệu mới ngay)', 'Kiểm tra dữ liệu'], on: 2 } });
      case 'users': return bang('Bảng giá & tồn kho Hiển Nga', ['Username', 'Họ tên', 'Vai trò', 'Mật khẩu mới', 'PasswordHash', 'Tên công ty', 'Khóa'],
        [['admin', 'Lê Chí Linh', 'admin', '', '9f2c…a71e', '', ''], ['nv01', 'Nhân viên kho', 'nv', '', '4b1d…0c9a', '', ''], ['dl_minhphat', 'Đại lý Minh Phát', 'khachhang', 'mk123456', '', 'VLXD Minh Phát', ''], ['dl_cu', 'Đại lý cũ', 'khachhang', '', '77aa…31f0', 'VLXD ABC', 'Có']],
        TAB_CHINH, 'Users', { vang: [3], do: [6], rong: ['90px', '120px', '84px', '96px', '96px', '', '50px'] });
      case 'thuonghieu': return '<div style="width:420px">' + bang('Bảng giá & tồn kho Hiển Nga', ['Hãng', 'Tên đầy đủ', 'Logo', 'Số mã'],
        [['HT', '(điền tên hãng)', '', '328'], ['CMC', '', '', '66'], ['Đồng Tâm', '', '', '50'], ['D&K', '', '(dán link logo)', '47'], ['Inax', '', '', '20']], ['Giá', 'Thương hiệu', 'Users'], 'Thương hiệu', { vang: [1, 2], rong: ['70px', '', '', '46px'] }) + '</div>';
      case 'anh': case 'anhxem': {
        const xem = '<span style="display:inline-block;width:40px;height:20px;background:linear-gradient(135deg,#C9B79C,#EEE6D8);border-radius:3px;vertical-align:middle"></span>';
        return bang('Hình ảnh sản phẩm', ['Mã sản phẩm', 'Tên sản phẩm', 'Link Drive hình ảnh', 'Link ảnh 2', 'Xem trước ảnh'],
          [['GHT.BC6600T', 'Gạch HT 60x60 BC6600 Trắng Loại 1', 'https://drive.google.com/file/d/1aB…/view', '', x === 'anhxem' ? xem : ''], ['TBVF1862', 'Cầu American Loven VF1862', 'https://drive.google.com/file/d/1xY…/view', 'https://drive.google.com/file/d/1zQ…', x === 'anhxem' ? xem : ''],
            ['L284', 'Chân Lavabo dài Inax L284', '', '', ''], ['GCMCDG103315', 'Gạch CMC 10x33 DG103315', 'https://abc.com/sai-link', '', x === 'anhxem' ? '<b style="color:#C62828">Link sai</b>' : '']],
          ['Ảnh', 'Hướng dẫn'], 'Ảnh', { vang: [2], chu: ['A', 'B', 'C', 'D', 'G'], rong: ['104px', '', '170px', '84px', '86px'], menu: x === 'anhxem' ? '📷 Ảnh SP' : '',
            menuMo: x === 'anhxem' ? { vt: 'top:56px;right:14px', ds: ['Mở quyền xem cho các link ảnh', 'Tạo thư mục ảnh + hướng dẫn', 'Quét thư mục ảnh → điền link theo mã'], on: 0 } : null });
      }
      case 'drive': return '<div class="the" style="width:560px;font-size:16px"><div style="font-size:20px;font-weight:700;margin-bottom:14px">Chia sẻ "GHT.BC6600T.jpg"</div>' +
        '<div style="color:#5F6776;margin-bottom:6px">Quyền truy cập chung</div><div style="border:2px solid #0140FF;border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between"><b>🌐 Bất kỳ ai có đường liên kết</b><span>Người xem ▾</span></div>' +
        '<div style="display:flex;justify-content:space-between;margin-top:22px"><span style="border:2px solid #0140FF;color:#0140FF;border-radius:999px;padding:9px 18px;font-weight:700">🔗 Sao chép đường liên kết</span><span style="background:#0140FF;color:#fff;border-radius:999px;padding:9px 22px;font-weight:700">Xong</span></div></div>';
      case 'nhap': return '<div class="the" style="width:560px;font-size:16px"><div style="font-size:20px;font-weight:700;margin-bottom:12px">Nhập tệp – THẺ KHO 05.11.xlsx</div><div style="color:#5F6776;margin-bottom:8px">Vị trí nhập</div>' +
        ['Tạo bảng tính mới', '<b style="color:#C62828">✕ Thay thế bảng tính</b>', 'Chèn (các) trang tính mới', '<b style="color:#1F8A3B">✓ Thay thế trang tính hiện tại</b>'].map((t, i) => '<div style="padding:9px 12px;border-radius:8px;margin-bottom:4px;' + (i === 3 ? 'background:#E7F5EC' : i === 1 ? 'background:#FDECEA' : '') + '">◯ ' + t + '</div>').join('') +
        '<div style="text-align:right;margin-top:12px"><span style="background:#0140FF;color:#fff;border-radius:8px;padding:9px 22px;font-weight:700">Nhập dữ liệu</span></div></div>';
      case 'canhbao': return '<div class="canh-bao"><b>⚠️ Không làm 2 việc này</b>✕ Chọn "Thay thế bảng tính" khi nhập file<br>✕ Nhập file tồn kho vào Sheet chính (bảng giá)<br><br>→ Sheet bị thay toàn bộ, mất tab Giá và Users.<br><br><span style="color:#1F8A3B;font-weight:700">Lỡ tay: Tệp → Lịch sử phiên bản → Khôi phục.</span></div>';
      case 'tonkho': return bang('Tồn kho Hiển Nga', ['A', 'B'], [['Lần đọc gần nhất của app →', '<b style="color:#1F8A3B">✅ App đã đọc tab "TỒN TỔNG HỢP": 2573 dòng, 781 mã còn hàng – lúc 13:40 05/11/2026</b>'], ['CÁCH 1 – Nhập file Excel xuất từ phần mềm kho', ''], ['CÁCH 2 – Dán sheet TỒN TỔNG HỢP vào tab Tồn kho', ''], ['CÁCH 3 – Tự gõ: Kho | Mã vật tư | Tên vật tư | ĐVT | Tồn', '']],
        ['Hướng dẫn', 'TỒN TỔNG HỢP', 'Lọc'], 'Hướng dẫn', { rong: ['260px', ''] });
    }
    return '';
  }).join('');
}

function trang(c, i) {
  return '<!doctype html><html><head><meta charset="utf-8"><style>' + CSS + '</style></head><body>' +
    '<div class="top"><img src="' + url(APP + 'img/logo-mark.png') + '"><b>Hướng dẫn quản trị</b><span>App Bảng giá Hiển Nga</span><span class="phan">' + esc(c.phan) + '</span></div>' +
    '<div class="wrap"><div class="trai"><h1>' + esc(c.tieuDe) + '</h1>' + c.y.map((t, k) => '<div class="y"><i>' + (k + 1) + '</i><span>' + esc(t) + '</span></div>').join('') + '</div>' +
    '<div class="phai">' + hinh(c.hinh) + '</div></div>' +
    '<div class="sub">' + esc(c.loi) + '</div>' +
    '<div style="position:absolute;right:16px;bottom:116px;font-size:13px;color:#8A93A3">' + (i + 1) + ' / ' + CANH.length + '</div></body></html>';
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const br = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
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
  fs.writeFileSync(path.join(__dirname, 'loi.json'), JSON.stringify(CANH.map(c => c.loi)), 'utf8');
  await br.close();
  console.log('xong', CANH.length, 'khung');
})().catch(e => { console.error(e); process.exit(1); });
