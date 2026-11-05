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
      ma: ma, hang: o(r, 'hang'), nhom: o(r, 'nhom'), ten: o(r, 'ten'), kc: o(r, 'kc'),
      loai: o(r, 'loai'), dvt: o(r, 'dvt'), dg: o(r, 'dg'),
      ny: soTien(r[c.ny]), dl: c.dl === undefined ? 0 : soTien(r[c.dl]), gc: o(r, 'gc'),
      mau: o(r, 'mau'), congNang: o(r, 'congNang'), tinhNang: o(r, 'tinhNang'),
      hoaVan: o(r, 'hoaVan'), men: o(r, 'men'), dungTich: o(r, 'dungTich')
    });
  }
  return { status: 'ok', count: data.length, coGiaDL: c.dl !== undefined, data: data, luc: new Date().toISOString() };
}

function docAnh() {
  var sh = layTab(TAB.anh, false);
  if (!sh) return { status: 'ok', data: {} };
  var rows = sh.getDataRange().getValues();
  var hi = timDongTieuDe(rows, COT_GIA.ma);
  if (hi < 0) return { status: 'ok', data: {} };
  var iMa = timCot(rows[hi], { ma: COT_GIA.ma }).ma, cotAnh = [];
  rows[hi].forEach(function (h, i) { if (i !== iMa && norm(h).indexOf('anh') === 0) cotAnh.push(i); });
  var data = {};
  for (var r = hi + 1; r < rows.length; r++) {
    var ma = chu(rows[r][iMa]);
    if (!ma) continue;
    var ds = cotAnh.map(function (i) { return linkAnh(rows[r][i]); }).filter(String);
    if (ds.length) data[ma] = ds;
  }
  return { status: 'ok', data: data };
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

// ---------- Trả cho app (đã lọc theo quyền) ----------
function getAll(ti) {
  var gia = quaDem('gia', docGia, TAB.gia);
  if (gia.status !== 'ok') return gia;
  // Chưa đăng nhập: máy chủ KHÔNG gửi giá đại lý xuống trình duyệt.
  if (!ti) gia.data.forEach(function (p) { p.dl = 0; });
  var anh = quaDem('anh', docAnh, TAB.anh);
  var capNhat = PropertiesService.getScriptProperties().getProperty('CAP_NHAT_GIA') || '';
  return { status: 'ok', data: gia.data, anh: anh.data || {}, luc: gia.luc, capNhat: capNhat, daDangNhap: !!ti };
}

function getTonKho(ti) {
  var res = quaDem('tonkho', docTonKho, function () { return layTabTon(false); }, CACHE_GIAY_TON);
  if (res.status !== 'ok' || ti.role !== 'khachhang') return res;
  // Đại lý: không gửi tên kho, số lô, số thật – mọi số chặn trần (app hiện "50+").
  var cap = function (n) { return Math.min(Number(n) || 0, TRAN_TON_KHACH); };
  Object.keys(res.data).forEach(function (ma) {
    var d = res.data[ma];
    res.data[ma] = { tong: cap(d.tong), dvt: d.dvt, vt: d.vt, m2: d.m2, tier: { nhanh: cap(d.tier.nhanh), mai: cap(d.tier.mai), cho: cap(d.tier.cho) } };
  });
  return res;
}
