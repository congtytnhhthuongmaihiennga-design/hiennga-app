// ============================================================
// NHẬP KHO (phiếu nhập) – lập ngay trên trang quản trị, không cần mở Google Sheet.
// Số lượng tồn vẫn lấy từ Sheet Tồn kho (phần mềm kho); phiếu nhập cho biết NGÀY NHẬP từng lô
// -> app tính "lô cũ nhất còn trong kho" (nhập trước bán trước) để tô màu tuổi tồn.
// Tab "Nhập kho": mỗi dòng = 1 mặt hàng của 1 phiếu. Tab "Ngày nhập ghi tay": ghi nhanh ngày cho mã tồn cũ.
// ============================================================
var TAB_NHAP = 'Nhập kho';
var TD_NHAP = ['Mã phiếu', 'Ngày nhập', 'Kho', 'Nhà cung cấp / chứng từ', 'Mã hàng', 'Tên hàng', 'Số lượng', 'Đơn vị', 'Ghi chú', 'Người nhập', 'Lúc lập'];
var TAB_NGAY_TAY = 'Ngày nhập ghi tay';
var TD_NGAY_TAY = ['Mã hàng', 'Ngày nhập', 'Người ghi', 'Lúc ghi'];

function isoNgay(v) { var d = docNgayNhap(v); return d ? Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd') : ''; }
function ngayTuIso(s) { var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null; }

function docPhieuNhap() {
  var sh = layTab(TAB_NHAP, false);
  if (!sh || sh.getLastRow() < 2) return [];
  var rows = sh.getDataRange().getValues(), c = timCot(rows[0], {
    so: ['Mã phiếu'], ngay: ['Ngày nhập'], kho: ['Kho'], ncc: ['Nhà cung cấp / chứng từ'], ma: ['Mã hàng'], ten: ['Tên hàng'],
    sl: ['Số lượng'], dv: ['Đơn vị'], gc: ['Ghi chú'], ng: ['Người nhập'], luc: ['Lúc lập']
  });
  var theoSo = {}, thuTu = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i], o = function (k) { return c[k] === undefined ? '' : r[c[k]]; }, so = chu(o('so'));
    if (!so || !chu(o('ma'))) continue;
    var p = theoSo[so];
    if (!p) {
      p = theoSo[so] = { ma: so, ngay: isoNgay(o('ngay')), kho: chu(o('kho')), ncc: chu(o('ncc')), ghiChu: chu(o('gc')), nguoi: chu(o('ng')),
        luc: o('luc') instanceof Date ? o('luc').toISOString() : chu(o('luc')), items: [] };
      thuTu.push(so);
    }
    p.items.push({ ma: chu(o('ma')), ten: chu(o('ten')), sl: Number(o('sl')) || 0, dv: chu(o('dv')) });
  }
  return thuTu.map(function (s) { return theoSo[s]; }).sort(function (a, b) { return a.ngay < b.ngay ? 1 : a.ngay > b.ngay ? -1 : (a.ma < b.ma ? 1 : -1); });
}
function docNgayTay() {
  var sh = layTab(TAB_NGAY_TAY, false), kq = {};
  if (!sh || sh.getLastRow() < 2) return kq;
  sh.getDataRange().getValues().slice(1).forEach(function (r) { var ma = chu(r[0]), n = isoNgay(r[1]); if (ma && n) kq[ma] = n; });
  return kq;
}
function dsPhieuNhap() {
  return { status: 'ok', data: docPhieuNhap().slice(0, 300), ngayTay: docNgayTay() };
}

// Mã + tên + đơn vị hợp lệ để nhập: có trong bảng giá hoặc có trong Sheet Tồn kho.
function hangChoNhap() {
  var kq = {};
  var gia = quaDem('gia', docGia, TAB.gia);
  if (gia.status === 'ok') gia.data.forEach(function (g) { kq[g.ma] = { ten: g.tenGoc || g.ten, dv: laM2(g.dvt) && m2MoiThung(g.dg) ? 'thùng' : (g.dvt || '') }; });
  try {
    var ton = quaDem('tonkho', docTonKho, function () { return layTabTon(false); }, CACHE_GIAY_TON);
    if (ton.status === 'ok') Object.keys(ton.data).forEach(function (ma) { var d = ton.data[ma]; if (!kq[ma]) kq[ma] = { ten: d.ten || '', dv: d.dvt || '' }; else if (d.dvt) kq[ma].dv = d.dvt; });
  } catch (e) { }
  return kq;
}

function luuPhieuNhap(p, ti) {
  var items = [];
  try { items = typeof p.items === 'string' ? JSON.parse(p.items) : (p.items || []); } catch (e) { }
  items = items.filter(function (x) { return x && chu(x.ma) && Number(x.sl) > 0; });
  if (!items.length) return { status: 'error', msg: 'Phiếu chưa có mặt hàng nào (số lượng > 0).' };
  if (items.length > 200) return { status: 'error', msg: 'Một phiếu tối đa 200 mặt hàng.' };
  var ngay = ngayTuIso(p.ngay);
  if (!ngay) return { status: 'error', msg: 'Chọn ngày nhập.' };
  if (ngay.getTime() > Date.now() + 86400000) return { status: 'error', msg: 'Ngày nhập không được sau hôm nay.' };
  var hang = hangChoNhap(), gop = {};
  for (var i = 0; i < items.length; i++) {
    var ma = chu(items[i].ma);
    if (!hang[ma]) return { status: 'error', msg: 'Mã ' + ma + ' không có trong bảng giá / tồn kho.' };
    gop[ma] = Math.round(((gop[ma] || 0) + Number(items[i].sl)) * 1000) / 1000; // trùng mã -> cộng dồn
  }
  var sh = tabDon(TAB_NHAP, TD_NHAP), cu = chu(p.ma), luc = new Date();
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  var so;
  try {
    var head = dauCot(sh), cSo = head.indexOf('Mã phiếu');
    var vals = sh.getLastRow() > 1 ? sh.getRange(2, cSo + 1, sh.getLastRow() - 1, 1).getValues().map(function (r) { return chu(r[0]); }) : [];
    if (cu) {
      if (vals.indexOf(cu) < 0) return { status: 'error', msg: 'Không thấy phiếu ' + cu + ' (có thể đã bị xóa).' };
      so = cu;
      for (var k = vals.length - 1; k >= 0; k--) if (vals[k] === cu) sh.deleteRow(k + 2);
    } else {
      var dau = 'NK' + Utilities.formatDate(luc, 'Asia/Ho_Chi_Minh', 'yyMMdd') + '-', n = 0;
      vals.forEach(function (v) { if (v.indexOf(dau) === 0) n = Math.max(n, Number(v.slice(dau.length)) || 0); });
      so = dau + ('00' + (n + 1)).slice(-3);
    }
    var o = { 'Mã phiếu': so, 'Ngày nhập': ngay, 'Kho': chu(p.kho).slice(0, 60), 'Nhà cung cấp / chứng từ': chu(p.ncc).slice(0, 120), 'Ghi chú': chu(p.ghiChu).slice(0, 300), 'Người nhập': "'" + ti.user, 'Lúc lập': luc };
    var dong = Object.keys(gop).map(function (ma) {
      o['Mã hàng'] = "'" + ma; o['Tên hàng'] = hang[ma].ten; o['Số lượng'] = gop[ma]; o['Đơn vị'] = hang[ma].dv;
      return head.map(function (h) { return o.hasOwnProperty(h) ? o[h] : ''; });
    });
    sh.getRange(sh.getLastRow() + 1, 1, dong.length, head.length).setValues(dong);
  } finally { lock.releaseLock(); }
  demXoa('nhapkho');
  ghiNhatKy(ti, cu ? 'Sửa phiếu nhập kho' : 'Lập phiếu nhập kho', so, Object.keys(gop).length + ' mã · ngày nhập ' + Utilities.formatDate(ngay, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy') + (p.kho ? ' · ' + chu(p.kho) : ''));
  return { status: 'ok', ma: so, msg: (cu ? 'Đã lưu phiếu ' : 'Đã lập phiếu ') + so };
}

function xoaPhieuNhap(p, ti) {
  var so = chu(p.ma), sh = layTab(TAB_NHAP, false);
  if (!so || !sh || sh.getLastRow() < 2) return { status: 'error', msg: 'Không thấy phiếu.' };
  var lock = LockService.getScriptLock(), n = 0; lock.waitLock(20000);
  try {
    var cSo = dauCot(sh).indexOf('Mã phiếu');
    var vals = sh.getRange(2, cSo + 1, sh.getLastRow() - 1, 1).getValues();
    for (var k = vals.length - 1; k >= 0; k--) if (chu(vals[k][0]) === so) { sh.deleteRow(k + 2); n++; }
  } finally { lock.releaseLock(); }
  if (!n) return { status: 'error', msg: 'Không thấy phiếu ' + so };
  demXoa('nhapkho');
  ghiNhatKy(ti, 'Xóa phiếu nhập kho', so, n + ' dòng');
  return { status: 'ok', msg: 'Đã xóa phiếu ' + so };
}

// Ghi nhanh ngày nhập cho 1 mã (hàng tồn cũ chưa có phiếu). ngay rỗng = xóa ngày ghi tay.
function ghiNgayNhap(p, ti) {
  var ma = chu(p.ma); if (!ma) return { status: 'error', msg: 'Thiếu mã hàng.' };
  var ngay = p.ngay ? ngayTuIso(p.ngay) : null;
  if (p.ngay && !ngay) return { status: 'error', msg: 'Ngày không hợp lệ.' };
  if (ngay && ngay.getTime() > Date.now() + 86400000) return { status: 'error', msg: 'Ngày nhập không được sau hôm nay.' };
  var sh = tabDon(TAB_NGAY_TAY, TD_NGAY_TAY);
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var vals = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues() : [], dong = -1;
    for (var k = 0; k < vals.length; k++) if (chu(vals[k][0]) === ma) { dong = k + 2; break; }
    if (!ngay) { if (dong > 0) sh.deleteRow(dong); }
    else if (dong > 0) sh.getRange(dong, 2, 1, 3).setValues([[ngay, "'" + ti.user, new Date()]]);
    else sh.appendRow(["'" + ma, ngay, "'" + ti.user, new Date()]);
  } finally { lock.releaseLock(); }
  demXoa('nhapkho');
  ghiNhatKy(ti, 'Ghi ngày nhập', ma, ngay ? Utilities.formatDate(ngay, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy') : 'xóa ngày ghi tay');
  return { status: 'ok', msg: ngay ? 'Đã ghi ngày nhập ' + ma : 'Đã xóa ngày ghi tay ' + ma };
}

// Lô nhập theo mã (đệm 10 phút, xóa khi lập/sửa/xóa phiếu).
function loNhapTheoMa() {
  var c = demLay('nhapkho'); if (c) return c;
  var lo = {};
  docPhieuNhap().forEach(function (p) { p.items.forEach(function (x) { (lo[x.ma] = lo[x.ma] || []).push({ ngay: p.ngay, sl: x.sl, so: p.ma, kho: p.kho }); }); });
  var kq = { lo: lo, tay: docNgayTay() };
  demLuu('nhapkho', kq, 600);
  return kq;
}
// Gắn ngày nhập vào tồn kho. Nhập trước bán trước: lấy các phiếu MỚI NHẤT cộng dồn tới đủ số tồn
// -> lô cũ nhất còn nằm trong kho là ngày nhập dùng để tính tuổi tồn.
// Phiếu chưa đủ số tồn (hàng cũ trước khi dùng app) -> phần còn lại lấy ngày ghi tay / cột "Ngày nhập" của Sheet.
function apDungNgayNhap(data) {
  var nk = loNhapTheoMa();
  Object.keys(data).forEach(function (ma) {
    var d = data[ma], ton = Number(d.tong) || 0, ds = (nk.lo[ma] || []).slice().sort(function (a, b) { return a.ngay < b.ngay ? 1 : -1; });
    var tay = nk.tay[ma];
    if (!ds.length) { if (tay) { d.nhap = tay; d.nguonNhap = 'tay'; } else if (d.nhap) d.nguonNhap = 'sheet'; return; }
    var con = [], cong = 0;
    for (var i = 0; i < ds.length && cong < ton; i++) {
      var sl = Math.min(ds[i].sl, ton - cong); cong += sl;
      con.push({ ngay: ds[i].ngay, sl: Math.round(sl * 1000) / 1000, so: ds[i].so });
    }
    d.nhapMoi = ds[0].ngay;
    if (cong >= ton - 1e-9 && con.length) { d.nhap = con[con.length - 1].ngay; d.nguonNhap = 'phieu'; }
    else { // còn hàng cũ chưa có phiếu
      var nguon = tay ? 'tay' : d.nhap ? 'sheet' : 'phieu';
      var cu = tay || d.nhap || (con.length ? con[con.length - 1].ngay : ds[ds.length - 1].ngay);
      if (ton - cong > 1e-9) con.push({ ngay: cu, sl: Math.round((ton - cong) * 1000) / 1000, so: '', cu: 1 });
      d.nhap = cu; d.nguonNhap = nguon; d.thieuPhieu = Math.round((ton - cong) * 1000) / 1000;
    }
    d.loNhap = con.slice(0, 8);
  });
}
