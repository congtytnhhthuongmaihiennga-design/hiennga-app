// ============================================================
// BÁO GIÁ (nháp): nhân viên / quản trị soạn báo giá cho khách → lưu nháp, sửa, xóa, in.
// Tab "Báo giá" trong Sheet chính: mỗi báo giá 1 dòng, chi tiết mặt hàng để dạng JSON ở cột cuối.
// Quyền "baogia". Đơn giá do người soạn nhập (có thể thương lượng) – máy chủ chỉ tính lại thành tiền / tổng.
// ============================================================
var TAB_BG = 'Báo giá';
var TD_BG = ['Mã báo giá', 'Ngày tạo', 'Cập nhật', 'Người tạo', 'Trạng thái', 'Khách hàng', 'SĐT', 'Địa chỉ', 'Loại giá', 'Số mặt hàng',
  'Tạm tính', 'Chiết khấu %', 'Tổng tiền', 'Hiệu lực đến', 'Ghi chú', 'Chi tiết (máy)'];
var TT_BG = { nhap: 'Nháp', dagui: 'Đã gửi khách' };

function maBaoGiaMoi() {
  var ngay = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyMMdd'), p = PropertiesService.getScriptProperties();
  var k = 'SO_BG_' + ngay, n = Number(p.getProperty(k) || 0) + 1;
  p.setProperty(k, String(n));
  return 'BG' + ngay + '-' + ('00' + n).slice(-3);
}
function docBaoGia() {
  var sh = layTab(TAB_BG, false);
  if (!sh || sh.getLastRow() < 2) return { sh: sh, ds: [] };
  var rows = sh.getDataRange().getValues(), head = rows[0].map(chu), c = {};
  head.forEach(function (h, i) { c[h] = i; });
  var o = function (r, ten) { return c[ten] === undefined ? '' : r[c[ten]]; };
  var iso = function (v) { return v instanceof Date ? v.toISOString() : chu(v); };
  var maTT = {}; Object.keys(TT_BG).forEach(function (k) { maTT[TT_BG[k]] = k; });
  var ds = [];
  for (var i = rows.length - 1; i >= 1; i--) {
    var r = rows[i], ma = chu(o(r, 'Mã báo giá')); if (!ma) continue;
    var items = []; try { items = JSON.parse(o(r, 'Chi tiết (máy)') || '[]'); } catch (e) { }
    var hl = o(r, 'Hiệu lực đến');
    ds.push({ ma: ma, ngay: iso(o(r, 'Ngày tạo')), capNhat: iso(o(r, 'Cập nhật')), nguoiTao: chu(o(r, 'Người tạo')), tt: maTT[chu(o(r, 'Trạng thái'))] || 'nhap',
      khach: chu(o(r, 'Khách hàng')), sdt: chu(o(r, 'SĐT')).replace(/^'/, ''), diaChi: chu(o(r, 'Địa chỉ')), loaiGia: chu(o(r, 'Loại giá')) === 'Giá niêm yết' ? 'ny' : 'dl',
      tamTinh: Number(o(r, 'Tạm tính')) || 0, ck: Number(o(r, 'Chiết khấu %')) || 0, tong: Number(o(r, 'Tổng tiền')) || 0,
      hieuLuc: hl instanceof Date ? Utilities.formatDate(hl, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd') : chu(hl), ghiChu: chu(o(r, 'Ghi chú')), items: items, _dong: i + 1 });
  }
  return { sh: sh, ds: ds };
}
function dsBaoGia() {
  return { status: 'ok', data: docBaoGia().ds.slice(0, 500).map(function (b) { delete b._dong; return b; }) };
}

// p: { ma? (trống = tạo mới), khach, sdt, diaChi, loaiGia, ck, hieuLuc, ghiChu, tt, items: [{ma, ten, dvt, sl, donGia, gc}] }
function luuBaoGia(p, ti) {
  var items = p.items; if (typeof items === 'string') { try { items = JSON.parse(items); } catch (e) { items = []; } }
  items = (items || []).filter(function (x) { return x && chu(x.ma || x.ten); }).slice(0, 300).map(function (x) {
    var sl = Math.max(0, Math.round((Number(x.sl) || 0) * 1000) / 1000), dg = Math.max(0, Math.round(Number(x.donGia) || 0));
    return { ma: chu(x.ma).slice(0, 40), ten: chu(x.ten).slice(0, 300), dvt: chu(x.dvt).slice(0, 20), sl: sl, donGia: dg, tien: Math.round(sl * dg), gc: chu(x.gc).slice(0, 200), qd: chu(x.qd).slice(0, 60) };
  });
  if (!chu(p.khach)) return { status: 'error', msg: 'Nhập tên khách hàng.' };
  if (!items.length) return { status: 'error', msg: 'Báo giá chưa có mặt hàng nào.' };
  var ck = Math.max(0, Math.min(100, Number(p.ck) || 0));
  var tamTinh = items.reduce(function (s, x) { return s + x.tien; }, 0), tong = Math.round(tamTinh * (1 - ck / 100));
  var tt = TT_BG[p.tt] ? p.tt : 'nhap';
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  var ma, moi;
  try {
    var sh = layTab(TAB_BG, false);
    if (!sh) {
      sh = SpreadsheetApp.getActiveSpreadsheet().insertSheet(TAB_BG);
      sh.getRange(1, 1, 1, TD_BG.length).setValues([TD_BG]).setFontWeight('bold').setBackground('#E3F2FD'); sh.setFrozenRows(1);
    }
    var luc = new Date(), b = docBaoGia(), cu = chu(p.ma) ? b.ds.filter(function (x) { return x.ma === chu(p.ma); })[0] : null;
    if (chu(p.ma) && !cu) return { status: 'error', msg: 'Không thấy báo giá ' + p.ma + ' (có thể đã bị xóa).' };
    moi = !cu; ma = cu ? cu.ma : maBaoGiaMoi();
    var gt = { 'Mã báo giá': ma, 'Ngày tạo': cu ? new Date(cu.ngay) : luc, 'Cập nhật': luc, 'Người tạo': cu ? cu.nguoiTao : ti.user, 'Trạng thái': TT_BG[tt],
      'Khách hàng': chu(p.khach).slice(0, 200), 'SĐT': "'" + chu(p.sdt).slice(0, 30), 'Địa chỉ': chu(p.diaChi).slice(0, 300), 'Loại giá': p.loaiGia === 'ny' ? 'Giá niêm yết' : 'Giá đại lý',
      'Số mặt hàng': items.length, 'Tạm tính': tamTinh, 'Chiết khấu %': ck, 'Tổng tiền': tong, 'Hiệu lực đến': chu(p.hieuLuc), 'Ghi chú': chu(p.ghiChu).slice(0, 1000), 'Chi tiết (máy)': JSON.stringify(items) };
    var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(chu);
    var dong = head.map(function (h) { return gt.hasOwnProperty(h) ? gt[h] : ''; });
    if (cu) sh.getRange(cu._dong, 1, 1, dong.length).setValues([dong]); else sh.appendRow(dong);
  } finally { lock.releaseLock(); }
  ghiNhatKy(ti, moi ? 'Tạo báo giá' : 'Sửa báo giá', ma, chu(p.khach) + ' · ' + items.length + ' mã · ' + tienVN(tong) + (ck ? ' (CK ' + ck + '%)' : '') + ' · ' + TT_BG[tt]);
  return { status: 'ok', ma: ma, tong: tong, msg: (moi ? 'Đã tạo báo giá ' : 'Đã lưu báo giá ') + ma };
}

function xoaBaoGia(p, ti) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var b = docBaoGia(), cu = b.ds.filter(function (x) { return x.ma === chu(p.ma); })[0];
    if (!cu) return { status: 'error', msg: 'Không thấy báo giá ' + p.ma };
    b.sh.deleteRow(cu._dong);
    ghiNhatKy(ti, 'Xóa báo giá', cu.ma, cu.khach + ' · ' + cu.items.length + ' mã · ' + tienVN(cu.tong));
  } finally { lock.releaseLock(); }
  return { status: 'ok', msg: 'Đã xóa báo giá ' + p.ma };
}
