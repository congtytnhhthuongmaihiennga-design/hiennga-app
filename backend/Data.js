// ============================================================
// ĐỌC DỮ LIỆU: Giá, Ảnh, Tồn kho. Mọi cột đọc theo TÊN tiêu đề,
// chèn/đổi thứ tự cột trên Sheet vẫn chạy đúng.
// ============================================================

function docGia() {
  var rows = layTab(TAB.gia, true).getDataRange().getValues();
  var hi = timDongTieuDe(rows, COT_GIA.ma);
  if (hi < 0) return { status: 'error', msg: 'Tab "' + TAB.gia + '" không có cột "Mã hàng".' };
  var c = timCot(rows[hi], COT_GIA);
  var thieu = ['ma', 'ny'].filter(function (k) { return c[k] === undefined; });
  if (thieu.length) return { status: 'error', msg: 'Tab "' + TAB.gia + '" thiếu cột: ' + thieu.map(function (k) { return COT_GIA[k][0]; }).join(', ') };
  function o(r, k) { return c[k] === undefined ? '' : chu(r[c[k]]); }
  var an = ['khong', 'no', '0', 'an', 'false'];
  var data = [], daCo = {};
  for (var i = hi + 1; i < rows.length; i++) {
    var r = rows[i], ma = o(r, 'ma');
    if (!ma || daCo[ma]) continue;
    if (c.hien !== undefined && an.indexOf(norm(r[c.hien])) >= 0) continue;
    daCo[ma] = 1;
    data.push({
      ma: ma, hang: o(r, 'hang'), nhom: o(r, 'nhom'), ten: o(r, 'tenHien') || o(r, 'ten'), tenGoc: o(r, 'ten'), kc: o(r, 'kc'),
      loai: o(r, 'loai'), dvt: o(r, 'dvt'), dg: o(r, 'dg'),
      ny: soTien(r[c.ny]), dl: c.dl === undefined ? 0 : soTien(r[c.dl]), gc: o(r, 'gc'),
      mau: o(r, 'mau'), congNang: o(r, 'congNang'), tinhNang: o(r, 'tinhNang'),
      hoaVan: o(r, 'hoaVan'), men: o(r, 'men'), dungTich: o(r, 'dungTich')
    });
  }
  return { status: 'ok', count: data.length, coGiaDL: c.dl !== undefined, data: data, luc: new Date().toISOString() };
}

// Sheet ảnh: Mã sản phẩm | Tên sản phẩm | Link Drive hình ảnh | Link ảnh 2 | Link ảnh 3 | Ghi chú.
// Máy chủ tự điền Mã + Tên từ bảng Giá (thêm dòng cho mã mới); người lo ảnh chỉ dán link Drive.
var TIEU_DE_ANH = ['Mã sản phẩm', 'Tên sản phẩm', 'Link Drive hình ảnh', 'Link ảnh 2', 'Link ảnh 3', 'Ghi chú'];
function laCotAnh(h) { var k = norm(h); return k.indexOf('link') >= 0 || k.indexOf('hinhanh') >= 0 || /^anh\d*$/.test(k); }

function docAnh(giaData) {
  var sh = layTabAnh();
  if (sh && giaData) { try { dongBoMaAnh(sh, giaData); } catch (e) { } }
  if (!sh) return { status: 'ok', data: {} };
  var rows = sh.getDataRange().getValues();
  var hi = timDongTieuDe(rows, COT_GIA.ma);
  if (hi < 0) return { status: 'ok', data: {} };
  var iMa = timCot(rows[hi], { ma: COT_GIA.ma }).ma, cotAnh = [];
  rows[hi].forEach(function (h, i) { if (i !== iMa && laCotAnh(h)) cotAnh.push(i); });
  var data = {};
  for (var r = hi + 1; r < rows.length; r++) {
    var ma = chu(rows[r][iMa]);
    if (!ma) continue;
    // Một ô có thể dán nhiều link (xuống dòng / dấu phẩy).
    var ds = [];
    cotAnh.forEach(function (i) { String(rows[r][i] || '').split(/[\s,;]+/).forEach(function (u) { var l = linkAnh(u); if (l) ds.push(l); }); });
    if (ds.length) data[ma] = ds;
  }
  return { status: 'ok', data: data };
}

// Tab "Hướng dẫn" ngay kế bên tab Ảnh + cột "Xem trước ảnh" (dán link là thấy ảnh nhỏ, biết link đúng/sai).
var HUONG_DAN_ANH = [
  ['CÁCH ĐƯA HÌNH ẢNH SẢN PHẨM LÊN APP HIỂN NGA'],
  [''],
  ['Tab "Ảnh" đã có sẵn Mã sản phẩm + Tên sản phẩm (tự lấy từ bảng giá). Chỉ cần dán link ảnh vào cột C.'],
  [''],
  ['BƯỚC 1 – Tải ảnh lên Google Drive (tài khoản Hiển Nga)'],
  ['   • Điện thoại: mở app Google Drive → nút ＋ → Tải lên → chọn ảnh.'],
  ['   • Máy tính: vào drive.google.com → kéo thả ảnh vào.'],
  ['   • Nên để chung 1 thư mục, vd "Ảnh sản phẩm Hiển Nga". Ảnh rõ, nền sáng, dưới 2 MB là đẹp.'],
  [''],
  ['BƯỚC 2 – Lấy đường liên kết của ảnh'],
  ['   • Điện thoại: bấm ⋮ cạnh ảnh → Chia sẻ → Quyền truy cập chung: "Bất kỳ ai có đường liên kết" → Sao chép đường liên kết.'],
  ['   • Máy tính: chuột phải vào ảnh → Chia sẻ → Chia sẻ → Quyền truy cập chung: "Bất kỳ ai có đường liên kết" → Sao chép đường liên kết.'],
  ['   • Quên đổi quyền cũng được: bước 4 sẽ tự mở quyền.'],
  [''],
  ['BƯỚC 3 – Dán link vào tab "Ảnh"'],
  ['   • Bấm Ctrl+F (điện thoại: ⋮ → Tìm) gõ mã sản phẩm để tìm đúng dòng.'],
  ['   • Dán link vào cột C "Link Drive hình ảnh". Có thêm ảnh: dán vào cột D, E (Link ảnh 2, 3).'],
  ['   • Nhìn cột G "Xem trước ảnh": hiện ảnh nhỏ = link đúng. Hiện "Link sai" hoặc ô trắng mãi = kiểm tra lại link / quyền chia sẻ.'],
  [''],
  ['BƯỚC 4 – Bấm menu 📷 Ảnh SP → "Mở quyền xem cho các link ảnh"'],
  ['   • Lần đầu Google hỏi quyền: Tiếp tục → chọn tài khoản Hiển Nga → Nâng cao → Đi tới… → Cho phép, rồi bấm lại menu lần nữa.'],
  ['   • Bước này giúp iPhone / máy của đại lý xem được ảnh.'],
  [''],
  ['Khoảng 10 phút sau, ảnh tự hiện trên app (danh sách + màn chi tiết sản phẩm).'],
  [''],
  ['LƯU Ý'],
  ['   • KHÔNG sửa / xóa cột A (Mã), B (Tên) – máy chủ tự điền. Mã mới trong bảng giá sẽ tự có thêm dòng.'],
  ['   • KHÔNG đổi tên tab "Ảnh" và các tiêu đề cột ở dòng 1.'],
  ['   • Xóa link ở cột C = gỡ ảnh khỏi app.'],
  ['   • Dán link ảnh trên web (không phải Drive) cũng được, miễn link mở ra là ảnh.']
];
function damBaoHuongDanAnh(sh) {
  var ss = sh.getParent();
  if (!ss.getSheetByName('Hướng dẫn')) {
    var hd = ss.insertSheet('Hướng dẫn', sh.getIndex()); // ngay kế bên tab Ảnh
    hd.getRange(1, 1, HUONG_DAN_ANH.length, 1).setValues(HUONG_DAN_ANH);
    hd.setColumnWidth(1, 900);
    hd.getRange(1, 1).setFontWeight('bold').setFontSize(14).setFontColor('#0140FF');
    [5, 10, 15, 20, 26].forEach(function (r) { hd.getRange(r, 1).setFontWeight('bold').setFontColor('#E00000'); });
    hd.getRange(24, 1).setFontWeight('bold').setFontColor('#1F8A3B');
    hd.setTabColor('#E00000');
  }
}
var COT_XEM_TRUOC = 'Xem trước ảnh';
function damBaoXemTruoc(sh) {
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  if (head.some(function (h) { return chu(h) === COT_XEM_TRUOC; })) return;
  var iLink = -1;
  head.forEach(function (h, i) { if (iLink < 0 && laCotAnh(h)) iLink = i; });
  if (iLink < 0) return;
  var col = head.length + 1, chuCot = sh.getRange(1, iLink + 1).getA1Notation().replace(/\d+/g, '');
  sh.getRange(1, col).setValue(COT_XEM_TRUOC).setFontWeight('bold').setBackground('#E3F2FD');
  // Ảnh nhỏ lấy từ link Drive ở cột link đầu tiên; link sai thì báo "Link sai".
  // setFormula nhận cú pháp tiếng Anh (dấu phẩy) bất kể ngôn ngữ của Sheet.
  sh.getRange(2, col).setFormula('=ARRAYFORMULA(IF(' + chuCot + '2:' + chuCot + '="","",IFERROR(IMAGE("https://drive.google.com/thumbnail?sz=w200&id="&REGEXEXTRACT(' +
    chuCot + '2:' + chuCot + ',"[-\\w]{25,}")),"Link sai")))');
  sh.setColumnWidth(col, 110);
}

// Tab ảnh trống thì tạo tiêu đề; mã có trong Giá mà chưa có dòng thì thêm (Mã + Tên). Không xóa / sửa link đã dán.
function dongBoMaAnh(sh, giaData) {
  try { damBaoHuongDanAnh(sh); } catch (e) { }
  var rows = sh.getLastRow() ? sh.getDataRange().getValues() : [];
  var hi = rows.length ? timDongTieuDe(rows, COT_GIA.ma) : -1;
  if (hi < 0) {
    if (sh.getLastRow() > 0) return; // tab có dữ liệu lạ – không đụng vào
    sh.getRange(1, 1, 1, TIEU_DE_ANH.length).setValues([TIEU_DE_ANH]).setFontWeight('bold').setBackground('#E3F2FD');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 160); sh.setColumnWidth(2, 380); sh.setColumnWidth(3, 360);
    sh.getRange(1, 3).setNote('Dán link ảnh trên Google Drive (Chia sẻ → "Bất kỳ ai có đường liên kết – Người xem"). Nhiều ảnh: dán thêm vào cột Link ảnh 2, 3 hoặc nhiều link trong 1 ô, mỗi link 1 dòng.');
    rows = [TIEU_DE_ANH]; hi = 0;
  }
  var c = timCot(rows[hi], { ma: COT_GIA.ma, ten: COT_GIA.ten.concat(['Tên sản phẩm']) });
  var co = {};
  for (var i = hi + 1; i < rows.length; i++) { var m = chu(rows[i][c.ma]); if (m) co[m.toUpperCase()] = 1; }
  // Dòng cuối có mã (không dùng getLastRow: cột "Xem trước ảnh" là công thức kéo hết cột nên getLastRow luôn = cuối sheet).
  var cuoi = hi;
  for (var k = hi + 1; k < rows.length; k++) if (chu(rows[k][c.ma])) cuoi = k;
  var moiMa = [], moiTen = [];
  giaData.forEach(function (p) {
    if (co[p.ma.toUpperCase()]) return;
    moiMa.push([p.ma]); moiTen.push([p.tenGoc || p.ten]);
  });
  // Chỉ ghi cột Mã + Tên, không đụng các cột link / cột công thức xem trước.
  if (moiMa.length) {
    sh.getRange(cuoi + 2, c.ma + 1, moiMa.length, 1).setNumberFormat('@').setValues(moiMa);
    if (c.ten !== undefined) sh.getRange(cuoi + 2, c.ten + 1, moiTen.length, 1).setValues(moiTen);
  }
  try { damBaoXemTruoc(sh); } catch (e) { }
}

// Nhóm giao theo kho (tab "Kho"): nhanh = có hàng ngay, mai = mai có hàng, cho = chờ đặt.
function nhomGiao(s) {
  var k = norm(s);
  if (!k || k.indexOf('ngay') >= 0 || k.indexOf('nhanh') >= 0) return 'nhanh';
  if (k.indexOf('mai') >= 0) return 'mai';
  return 'cho';
}

// ---------- Đơn vị tồn kho ----------
function lam3(n) { return Math.round(n * 1000) / 1000; } // bỏ đuôi 32.049999999999997
var TEN_DVT = { bo: 'bộ', cai: 'cái', soi: 'sợi', cay: 'cây', hop: 'hộp', vien: 'viên', lon: 'lon', thung: 'thùng', bao: 'bao', chai: 'chai', cuon: 'cuộn', tam: 'tấm', combo: 'combo' };
function khongDau(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/\s+/g, '');
}
function tenDonVi(dvt) {
  var d = khongDau(dvt), m = d.match(/^bao(\d+)$/);
  if (m) return 'bao ' + m[1] + 'kg';
  return TEN_DVT[d.replace(/\d+$/, '')] || chu(dvt);
}
// Gạch: phần mềm kho ghi ĐVT kiểu "vien1.44" (= thùng 1,44 m²), tồn tính theo thùng, phần lẻ là viên
// (102.8 thùng loại 5 viên/thùng = 102 thùng 4 viên). Đôi khi số sau "vien" lại là số viên/thùng ("vien11", gạch 30x30 11v/th).
// Trả {vt: viên/thùng (0 = không rõ), m2: m²/thùng} hoặc null nếu không phải hàng tính theo thùng.
function quyCachThung(dvt, ten) {
  var m = khongDau(dvt).match(/^vien(\d+(?:[.,]\d+)?)$/);
  if (!m) return null;
  var x = parseFloat(m[1].replace(',', '.'));
  var kt = String(ten || '').match(/(\d{2,3})\s*[x×]\s*(\d{2,3})/i);
  var dt = kt ? Number(kt[1]) * Number(kt[2]) / 1e4 : 0;  // m² một viên (kích cỡ theo cm)
  var v = Number((String(ten || '').match(/\((\d+)\s*v\s*\/\s*th/i) || [])[1] || 0);
  var gan = function (a, b) { return b > 0 && Math.abs(a - b) / b < 0.06; };
  if (v && dt && gan(v * dt, x)) return { vt: v, m2: x };
  if (v && x === v) return { vt: v, m2: dt ? Math.round(v * dt * 1000) / 1000 : 0 };
  if (!v && dt && x < 5 && gan(Math.round(x / dt) * dt, x)) return { vt: Math.round(x / dt), m2: x };
  if (!v && dt && x >= 3 && x === Math.round(x)) return { vt: x, m2: Math.round(x * dt * 1000) / 1000 };
  return { vt: v, m2: x < 5 ? x : 0 };
}

function docTonKho() {
  var sh = layTabTon(true);
  var rows = sh.getDataRange().getValues();
  var hi = timDongTieuDe(rows, COT_TON.ma);
  if (hi < 0) return { status: 'error', msg: 'Tab "' + sh.getName() + '" (Sheet Tồn kho) không có cột "Mã vật tư" – kiểm tra đã dán / nhập đúng bản xuất từ phần mềm kho chưa.' };
  var c = timCot(rows[hi], COT_TON);
  if (c.sl === undefined) return { status: 'error', msg: 'Tab "' + sh.getName() + '" (Sheet Tồn kho) thiếu cột "Tồn" / "Số lượng".' };

  // Nối mã tồn kho -> mã hàng (chỉ khi 2 file dùng mã khác nhau).
  var noi = {}, shN = layTab(TAB.noima, false);
  if (shN) shN.getDataRange().getValues().slice(1).forEach(function (r) { if (chu(r[0]) && chu(r[1])) noi[chu(r[0])] = chu(r[1]); });
  // Kho -> nhóm giao.
  var kho = {}, shK = layTab(TAB.kho, false);
  if (shK) shK.getDataRange().getValues().slice(1).forEach(function (r) { if (chu(r[0])) kho[norm(r[0])] = nhomGiao(r[1]); });

  var data = {};
  for (var i = hi + 1; i < rows.length; i++) {
    var r = rows[i], maGoc = chu(r[c.ma]);
    if (!maGoc) continue;
    var sl = soLuong(r[c.sl]);
    if (sl <= 0) continue;
    var ma = noi[maGoc] || maGoc;
    var tenKho = c.kho === undefined ? 'Kho' : (chu(r[c.kho]) || 'Kho');
    var nhom = kho[norm(tenKho)] || 'nhanh';
    var d = data[ma];
    if (!d) {
      var dvtGoc = c.dvt === undefined ? '' : chu(r[c.dvt]);
      var qc = quyCachThung(dvtGoc, c.ten === undefined ? '' : r[c.ten]);
      d = data[ma] = { tong: 0, dvt: qc ? 'thùng' : tenDonVi(dvtGoc), tier: { nhanh: 0, mai: 0, cho: 0 }, kho: {} };
      if (qc) { d.vt = qc.vt; d.m2 = qc.m2; }
    }
    d.tong = lam3(d.tong + sl); d.tier[nhom] = lam3(d.tier[nhom] + sl);
    var k = d.kho[tenKho] || (d.kho[tenKho] = { ten: tenKho, nhom: nhom, tong: 0, lo: [] });
    k.tong = lam3(k.tong + sl);
    var so = c.lo === undefined ? '' : chu(r[c.lo]);
    if (so) k.lo.push({ so: so, sl: sl });
  }
  Object.keys(data).forEach(function (ma) {
    var d = data[ma];
    d.kho = Object.keys(d.kho).map(function (t) { return d.kho[t]; }).sort(function (a, b) { return b.tong - a.tong; });
  });
  baoDaNhan(sh, Object.keys(data).length, rows.length - hi - 1);
  return { status: 'ok', data: data, luc: new Date().toISOString() };
}

// Ghi "App đã nhận …" vào tab Hướng dẫn của Sheet Tồn kho để người nhập kho biết dán đúng chưa.
function baoDaNhan(sh, soMaCon, soDong) {
  try {
    var hd = sh.getParent().getSheetByName(TAB_HUONG_DAN_TON);
    if (!hd) return;
    var luc = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'HH:mm dd/MM/yyyy');
    hd.getRange(2, 2).setValue('✅ App đã đọc tab "' + sh.getName() + '": ' + soDong + ' dòng, ' + soMaCon + ' mã còn hàng – lúc ' + luc);
  } catch (e) { }
}

// ---------- Thương hiệu: tên đầy đủ + logo (tab "Thương hiệu" của Sheet chính) ----------
// Chưa có tab thì tự tạo, điền sẵn mọi hãng đang có trong bảng giá (+ tên đầy đủ đã ghi ở tab "Hãng viết tắt").
function docThuongHieu(giaData) {
  var sh = layTab(TAB.thuongHieu, false);
  if (!sh) sh = taoTabThuongHieu(giaData);
  if (!sh) return { status: 'ok', data: {} };
  var rows = sh.getDataRange().getValues();
  var hi = timDongTieuDe(rows, COT_TH.hang);
  if (hi < 0) return { status: 'ok', data: {} };
  var c = timCot(rows[hi], COT_TH), data = {};
  for (var i = hi + 1; i < rows.length; i++) {
    var h = chu(rows[i][c.hang]);
    if (!h) continue;
    var ten = c.ten === undefined ? '' : chu(rows[i][c.ten]);
    var logo = c.logo === undefined ? '' : chu(rows[i][c.logo]);
    // Link Drive -> link ảnh hiển thị được; đường dẫn trong app (img/…) giữ nguyên.
    if (/^https?:\/\//i.test(logo)) logo = linkAnh(logo);
    if (ten || logo) data[h] = { ten: ten, logo: logo };
  }
  return { status: 'ok', data: data };
}
function taoTabThuongHieu(giaData) {
  if (!giaData || !giaData.length) return null;
  var dem = {};
  giaData.forEach(function (p) { if (p.hang) dem[p.hang] = (dem[p.hang] || 0) + 1; });
  var tenDu = {}, vt = layTab('Hãng viết tắt', false);
  if (vt) vt.getDataRange().getValues().slice(1).forEach(function (r) { if (chu(r[0]) && chu(r[2])) tenDu[chu(r[0])] = chu(r[2]); });
  var ds = Object.keys(dem).sort(function (a, b) { return dem[b] - dem[a]; });
  var rows = [['Hãng (như bảng giá)', 'Tên đầy đủ', 'Logo', 'Số mã', 'Ghi chú']].concat(ds.map(function (h) {
    var vietTat = /^[A-Z0-9]{2,5}$/.test(h) && h !== 'CMC';
    return [h, tenDu[h] || '', '', dem[h], vietTat && !tenDu[h] ? 'Chữ viết tắt – điền tên hãng đầy đủ' : ''];
  }));
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.insertSheet(TAB.thuongHieu);
  sh.getRange(1, 1, rows.length, 5).setValues(rows);
  sh.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#E3F2FD');
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 170); sh.setColumnWidth(2, 220); sh.setColumnWidth(3, 320); sh.setColumnWidth(5, 300);
  sh.getRange(1, 3).setNote('Để trống = dùng logo có sẵn trong app (nếu có). Muốn đổi: dán link ảnh logo (Google Drive chia sẻ "Bất kỳ ai có liên kết", hoặc link ảnh trên web).');
  sh.getRange(1, 2).setNote('Tên hiện trên app thay cho chữ ở cột A (vd HT → tên hãng đầy đủ). Để trống = giữ như cột A.');
  return sh;
}

// ---------- Trả cho app (đã lọc theo quyền) ----------
function getAll(ti) {
  var gia = quaDem('gia', docGia, TAB.gia);
  if (gia.status !== 'ok') return gia;
  // Chưa đăng nhập: máy chủ KHÔNG gửi giá đại lý xuống trình duyệt.
  if (!ti) gia.data.forEach(function (p) { p.dl = 0; });
  var anh = {};
  try {
    // Ghép ảnh theo mã không phân biệt hoa/thường (tên file ảnh hay gõ chữ thường).
    var goc = quaDem('anh2', function () { return docAnh(gia.data); }, layTabAnh, CACHE_GIAY_TON).data || {}, theoHoa = {};
    Object.keys(goc).forEach(function (m) { theoHoa[m.toUpperCase()] = goc[m]; });
    gia.data.forEach(function (p) { var a = theoHoa[p.ma.toUpperCase()]; if (a) anh[p.ma] = a; });
  } catch (e) { } // lỗi ảnh không được làm hỏng bảng giá
  var th = {};
  try { th = quaDem('th', function () { return docThuongHieu(gia.data); }, TAB.thuongHieu).data || {}; } catch (e) { }
  var capNhat = PropertiesService.getScriptProperties().getProperty('CAP_NHAT_GIA') || '';
  var chuaCfg = [];
  if (ti) try { chuaCfg = docCaiChua(); } catch (e) { }
  return { status: 'ok', data: gia.data, anh: anh, thuongHieu: th, luc: gia.luc, capNhat: capNhat, daDangNhap: !!ti, chuaCfg: chuaCfg };
}

function getTonKho(ti) {
  var res = quaDem('tonkho', docTonKho, function () { return layTabTon(false); }, CACHE_GIAY_TON);
  if (res.status === 'ok') truHangGiu(res.data); // Được bán = Tồn − hàng đang giữ cho đơn / chừa hàng
  if (res.status !== 'ok' || ti.role !== 'khachhang') return res;
  // Đại lý: không gửi tên kho, số lô, số thật – mọi số chặn trần (app hiện "50+").
  var cap = function (n) { return Math.min(Number(n) || 0, TRAN_TON_KHACH); };
  Object.keys(res.data).forEach(function (ma) {
    var d = res.data[ma];
    res.data[ma] = { tong: cap(d.tong), dvt: d.dvt, vt: d.vt, m2: d.m2, tier: { nhanh: cap(d.tier.nhanh), mai: cap(d.tier.mai), cho: cap(d.tier.cho) } };
  });
  return res;
}
