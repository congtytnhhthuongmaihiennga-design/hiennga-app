// ============================================================
// ĐƠN HÀNG (GĐ1) + CHỪA HÀNG (GĐ2)
// Đại lý gửi đơn / yêu cầu chừa hàng từ app -> lưu Sheet -> báo Email + Telegram -> QUẢN TRỊ duyệt.
// Tab "Đơn hàng": mỗi đơn 1 dòng. Tab "Chi tiết đơn": mỗi mặt hàng 1 dòng (để lọc / báo cáo).
// Giá trong đơn do MÁY CHỦ tính lại từ bảng Giá (giá đại lý), không tin giá trình duyệt gửi lên.
//
// Chừa hàng: đại lý chọn số ngày (theo tab "Cài đặt chừa hàng") -> quản trị duyệt -> hàng được giữ tới hạn.
// Hết hạn KHÔNG tự nhả: app báo quản trị (mỗi sáng) để quyết: gia hạn / chuyển thành đơn giao / nhả hàng.
// Được bán = Tồn − hàng đang giữ (chừa + đơn đã xác nhận chưa giao).
// ============================================================
var TAB_DON = 'Đơn hàng', TAB_CT = 'Chi tiết đơn', TAB_CAI_CHUA = 'Cài đặt chừa hàng';
var TD_DON = ['Mã đơn', 'Ngày đặt', 'Trạng thái', 'Tài khoản', 'Đại lý / cửa hàng', 'SĐT', 'Hình thức', 'Địa chỉ giao', 'Ngày cần hàng',
  'Ghi chú khách', 'Số mặt hàng', 'Tổng tiền', 'Người xử lý', 'Cập nhật lúc', 'Ghi chú nội bộ', 'Chi tiết (máy)',
  'Loại', 'Số ngày chừa', 'Hạn chừa', 'Cọc yêu cầu', 'Đã nhận cọc', 'Xin gia hạn (ngày)', 'Người giao', 'Ngày giao'];
var TD_CT = ['Mã đơn', 'Ngày đặt', 'Tài khoản', 'Mã hàng', 'Tên hàng', 'Số lượng', 'Đơn vị', 'Quy đổi', 'Đơn giá', 'Thành tiền'];
var TRANG_THAI = { moi: 'Mới – chờ duyệt', giu: 'Đang chừa hàng', xacnhan: 'Đã xác nhận', danggiao: 'Đang giao', dagiao: 'Đã giao', huy: 'Đã hủy', tuchoi: 'Từ chối' };
var LOAI_CHUA = 'Chừa hàng';
// Các trạng thái làm giảm "Được bán": trừ NGAY khi đại lý lên đơn / chừa hàng; hủy / từ chối thì trả lại; đã giao thì kho tự trừ.
var TT_GIU_HANG = ['moi', 'giu', 'xacnhan', 'danggiao'];
// Mặc định khi tab "Cài đặt chừa hàng" chưa có: [số ngày, % cọc trên tổng tiền]
var CHUA_MAC_DINH = [[3, 0], [5, 0], [7, 10], [10, 10], [15, 20], [30, 30]];

function tabDon(ten, td) {
  var sh = layTab(ten, false);
  if (!sh) {
    sh = SpreadsheetApp.getActiveSpreadsheet().insertSheet(ten);
    sh.getRange(1, 1, 1, td.length).setValues([td]).setFontWeight('bold').setBackground('#E3F2FD');
    sh.setFrozenRows(1);
    return sh;
  }
  // Tab cũ (GĐ1) thiếu cột mới -> thêm vào cuối, không đụng dữ liệu cũ.
  var head = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(chu);
  var thieu = td.filter(function (t) { return head.indexOf(t) < 0; });
  if (thieu.length) {
    var cot = head.filter(String).length + 1;
    sh.getRange(1, cot, 1, thieu.length).setValues([thieu]).setFontWeight('bold').setBackground('#E3F2FD');
  }
  return sh;
}
function dauCot(sh) { return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(chu); }
// Ghi 1 dòng theo TÊN cột (không phụ thuộc thứ tự cột).
function themDongTheoTen(sh, obj) {
  var head = dauCot(sh);
  sh.appendRow(head.map(function (h) { return obj.hasOwnProperty(h) ? obj[h] : ''; }));
}

// Đơn vị mét vuông: "m²" (ký tự ²), "m2", "M2"…
function laM2(dvt) { return /^m\s*(2|²)$/i.test(String(dvt || '').trim()); }
// "4 viên/thùng · 1,44 m²/thùng" -> 1.44
function m2MoiThung(dg) {
  var m = String(dg || '').toLowerCase().match(/([\d.,]+)\s*m(?:²|2)\s*\/\s*th(?:ù|u)ng/);
  var v = m ? parseFloat(m[1].replace(',', '.')) : 0;
  return v > 0 ? v : 0;
}

function maDonMoi() {
  var ngay = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyMMdd'), p = PropertiesService.getScriptProperties();
  var k = 'SO_DON_' + ngay, n = Number(p.getProperty(k) || 0) + 1;
  p.setProperty(k, String(n));
  return 'HN' + ngay + '-' + ('00' + n).slice(-3);
}

// ---------- Cài đặt chừa hàng (tab trong Sheet chính, chủ DN tự sửa) ----------
function docCaiChua() {
  var c = CacheService.getScriptCache(), s = c.get('cai_chua');
  if (s) return JSON.parse(s);
  var sh = layTab(TAB_CAI_CHUA, false), ds = [];
  if (!sh) {
    sh = SpreadsheetApp.getActiveSpreadsheet().insertSheet(TAB_CAI_CHUA);
    sh.getRange(1, 1, 1, 3).setValues([['Số ngày chừa', '% đặt cọc (trên tổng tiền)', 'Ghi chú']]).setFontWeight('bold').setBackground('#E3F2FD');
    sh.getRange(2, 1, CHUA_MAC_DINH.length, 2).setValues(CHUA_MAC_DINH);
    sh.getRange(2, 3).setValue('Mỗi dòng = 1 lựa chọn đại lý thấy trong app. Sửa số ngày / % cọc tùy ý (từ 3 ngày trở lên).');
    sh.setFrozenRows(1); sh.setColumnWidth(2, 200); sh.setColumnWidth(3, 420);
  }
  sh.getDataRange().getValues().slice(1).forEach(function (r) {
    var n = Math.round(Number(r[0])), pc = Number(String(r[1]).replace('%', '').replace(',', '.')) || 0;
    if (n >= 3 && n <= 365) ds.push({ ngay: n, coc: Math.max(0, Math.min(100, pc)) });
  });
  if (!ds.length) ds = CHUA_MAC_DINH.map(function (x) { return { ngay: x[0], coc: x[1] }; });
  ds.sort(function (a, b) { return a.ngay - b.ngay; });
  c.put('cai_chua', JSON.stringify(ds), 21600);
  return ds;
}
function tienCoc(tong, soNgay) {
  var dong = docCaiChua().filter(function (x) { return x.ngay === soNgay; })[0];
  return dong && dong.coc ? Math.round(tong * dong.coc / 100 / 1000) * 1000 : 0;
}
// Hạn = cuối ngày (giờ VN) của hôm nay/hạn cũ + n ngày.
function congNgay(tu, n) {
  var d = new Date(tu.getTime() + n * 86400000);
  return new Date(Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd') + 'T23:59:00+07:00');
}

// p.items = [{ma, sl}] ; sl = số thùng (hàng tính m² có quy cách thùng) hoặc số đơn vị.
// p.loai = 'chua' + p.soNgay -> yêu cầu chừa hàng.
function taoDon(p, ti) {
  var items = [];
  try { items = typeof p.items === 'string' ? JSON.parse(p.items) : (p.items || []); } catch (e) { }
  items = items.filter(function (x) { return x && x.ma && Number(x.sl) > 0; });
  if (!items.length) return { status: 'error', msg: 'Đơn chưa có mặt hàng nào.' };
  if (items.length > 200) return { status: 'error', msg: 'Đơn tối đa 200 mặt hàng.' };
  var chua = p.loai === 'chua', soNgay = Math.round(Number(p.soNgay) || 0);
  if (chua && !docCaiChua().some(function (x) { return x.ngay === soNgay; })) return { status: 'error', msg: 'Số ngày chừa không hợp lệ.' };
  var gia = quaDem('gia', docGia, TAB.gia);
  if (gia.status !== 'ok') return gia;
  var theoMa = {}; gia.data.forEach(function (g) { theoMa[g.ma] = g; });

  var dong = [], tong = 0;
  for (var i = 0; i < items.length; i++) {
    var g = theoMa[items[i].ma];
    if (!g) return { status: 'error', msg: 'Mã ' + items[i].ma + ' không còn trong bảng giá.' };
    var sl = Math.round(Number(items[i].sl) * 100) / 100, m2 = laM2(g.dvt) ? m2MoiThung(g.dg) : 0;
    var dongia = g.dl > 0 ? g.dl : g.ny; // giá đại lý, chưa có thì giá niêm yết
    var luong = m2 ? Math.round(sl * m2 * 100) / 100 : sl;
    var tien = Math.round(luong * dongia);
    tong += tien;
    dong.push({ ma: g.ma, ten: g.tenGoc || g.ten, sl: sl, dv: m2 ? 'thùng' : (g.dvt || ''), qd: m2 ? luong + ' m²' : '', dongia: dongia, tien: tien, dvGia: g.dvt || '' });
  }
  var u = thongTinUser(ti.user);
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var ma = maDonMoi(), luc = new Date();
    var don = {
      ma: ma, ngay: luc.toISOString(), tt: 'moi', user: ti.user, ten: chu(p.tenKH) || u.cty || u.ten || ti.user, sdt: chu(p.sdt) || u.sdt,
      hinhThuc: p.hinhThuc === 'nhan' ? 'Nhận tại kho' : 'Giao tận nơi', diaChi: chu(p.diaChi) || u.diaChi, ngayCan: chu(p.ngayCan), ghiChu: chu(p.ghiChu).slice(0, 500),
      tong: tong, items: dong, loai: chua ? 'chua' : '', soNgay: chua ? soNgay : 0, coc: chua ? tienCoc(tong, soNgay) : 0
    };
    themDongTheoTen(tabDon(TAB_DON, TD_DON), {
      'Mã đơn': ma, 'Ngày đặt': luc, 'Trạng thái': TRANG_THAI.moi, 'Tài khoản': ti.user, 'Đại lý / cửa hàng': don.ten, 'SĐT': "'" + don.sdt,
      'Hình thức': don.hinhThuc, 'Địa chỉ giao': don.diaChi, 'Ngày cần hàng': don.ngayCan, 'Ghi chú khách': don.ghiChu, 'Số mặt hàng': dong.length,
      'Tổng tiền': tong, 'Cập nhật lúc': luc, 'Chi tiết (máy)': JSON.stringify(dong),
      'Loại': chua ? LOAI_CHUA : 'Đặt hàng', 'Số ngày chừa': chua ? soNgay : '', 'Cọc yêu cầu': chua ? don.coc : ''
    });
    var ct = tabDon(TAB_CT, TD_CT), rows = dong.map(function (d) { return [ma, luc, ti.user, d.ma, d.ten, d.sl, d.dv, d.qd, d.dongia, d.tien]; });
    ct.getRange(ct.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  } finally { lock.releaseLock(); }
  demXoa('giu');
  ghiNhatKy(ti, chua ? 'Gửi yêu cầu chừa hàng' : 'Gửi đơn', ma, dong.length + ' mã · ' + tienVN(tong) + (chua ? ' · chừa ' + soNgay + ' ngày' : ''));
  try { baoDonMoi(don); } catch (e) { Logger.log('Báo đơn lỗi: ' + e); }
  return { status: 'ok', ma: don.ma, tong: tong, coc: don.coc, msg: (chua ? 'Đã gửi yêu cầu chừa hàng ' : 'Đã gửi đơn ') + don.ma };
}

function thongTinUser(user) {
  try {
    var u = tabUsers(), c = u.c;
    for (var i = 1; i < u.rows.length; i++) {
      var r = u.rows[i];
      if (chu(r[c.user]).toLowerCase() !== user) continue;
      var o = function (k) { return c[k] === undefined ? '' : chu(r[c[k]]); };
      return { ten: o('ten'), cty: o('cty'), sdt: o('sdt'), diaChi: o('dc') };
    }
  } catch (e) { }
  return { ten: '', cty: '', sdt: '', diaChi: '' };
}

// Đọc đơn. loc: {user, tt, noiBo}. Mới nhất trước.
function docDon(loc, gioiHan) {
  var sh = layTab(TAB_DON, false);
  if (!sh || sh.getLastRow() < 2) return [];
  var rows = sh.getDataRange().getValues(), c = timCot(rows[0], {
    ma: ['Mã đơn'], ngay: ['Ngày đặt'], tt: ['Trạng thái'], user: ['Tài khoản'], ten: ['Đại lý / cửa hàng'], sdt: ['SĐT'], ht: ['Hình thức'],
    dc: ['Địa chỉ giao'], can: ['Ngày cần hàng'], gc: ['Ghi chú khách'], so: ['Số mặt hàng'], tong: ['Tổng tiền'], xl: ['Người xử lý'],
    cn: ['Cập nhật lúc'], nb: ['Ghi chú nội bộ'], ct: ['Chi tiết (máy)'],
    loai: ['Loại'], sn: ['Số ngày chừa'], han: ['Hạn chừa'], coc: ['Cọc yêu cầu'], dacoc: ['Đã nhận cọc'], xin: ['Xin gia hạn (ngày)'], ng: ['Người giao'], ngg: ['Ngày giao']
  });
  var maTT = {}; Object.keys(TRANG_THAI).forEach(function (k) { maTT[TRANG_THAI[k]] = k; });
  var iso = function (v) { return v instanceof Date ? v.toISOString() : chu(v); };
  var ds = [];
  for (var i = rows.length - 1; i >= 1 && ds.length < (gioiHan || 500); i--) {
    var r = rows[i], o = function (k) { return c[k] === undefined ? '' : r[c[k]]; };
    if (!chu(o('ma'))) continue;
    var tt = maTT[chu(o('tt'))] || 'moi';
    if (loc.user && chu(o('user')).toLowerCase() !== loc.user) continue;
    if (loc.tt && loc.tt !== tt) continue;
    if (loc.cacTT && loc.cacTT.indexOf(tt) < 0) continue;
    var items = []; try { items = JSON.parse(o('ct') || '[]'); } catch (e) { }
    ds.push({ ma: chu(o('ma')), ngay: iso(o('ngay')), tt: tt, user: chu(o('user')), ten: chu(o('ten')), sdt: chu(o('sdt')),
      hinhThuc: chu(o('ht')), diaChi: chu(o('dc')), ngayCan: o('can') instanceof Date ? Utilities.formatDate(o('can'), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd') : chu(o('can')),
      ghiChu: chu(o('gc')), tong: Number(o('tong')) || 0, xuLy: chu(o('xl')), capNhat: iso(o('cn')),
      ghiChuNB: loc.noiBo ? chu(o('nb')) : '', items: items,
      loai: chu(o('loai')) === LOAI_CHUA ? 'chua' : '', soNgay: Number(o('sn')) || 0, han: iso(o('han')),
      coc: Number(o('coc')) || 0, daCoc: Number(o('dacoc')) || 0, xinGH: Number(o('xin')) || 0, nguoiGiao: chu(o('ng')), ngayGiao: iso(o('ngg')), _dong: i + 1 });
  }
  return ds;
}
function boDong(d) { delete d._dong; return d; }

function donCuaToi(ti) {
  return { status: 'ok', data: docDon({ user: ti.user }, 100).map(boDong), chuaCfg: docCaiChua() };
}

// Quản trị / nhân viên xem tất cả.
function dsDon(p, ti) {
  var ds = docDon({ tt: p.tt || '', noiBo: true }, Number(p.gioiHan) || 500);
  var dem = { moi: 0, giu: 0, xacnhan: 0, danggiao: 0, dagiao: 0, huy: 0, tuchoi: 0, hetHan: 0, xinGH: 0 }, bay = Date.now();
  docDon({}, 5000).forEach(function (d) {
    dem[d.tt] = (dem[d.tt] || 0) + 1;
    if (d.tt === 'giu' && d.han && new Date(d.han).getTime() < bay) dem.hetHan++;
    if (d.tt === 'giu' && d.xinGH) dem.xinGH++;
  });
  return { status: 'ok', data: ds.map(boDong), dem: dem, chuaCfg: docCaiChua(), quyen: ti ? quyenCua(ti.role, ti.user) : [], tenQuyen: QUYEN };
}

// Cập nhật đơn.
//  Đại lý: chỉ tự hủy đơn của mình khi còn "Mới".
//  Quản trị: mọi việc. Nhân viên: theo quyền (QUYEN trong Quyen.js):
//    don    – duyệt đơn thường (xác nhận / từ chối / hủy / mở lại)
//    giao   – kho & giao hàng: Đã xác nhận → Đang giao → Đã giao (ghi người giao)
//    chua   – duyệt chừa ('giu'), gia hạn, từ chối xin gia hạn, nhả / chuyển đơn đang chừa
//    coc    – sửa "Cọc yêu cầu" / "Đã nhận cọc"
//    ghichu – sửa ghi chú nội bộ
//  Trường gửi lên mà KHÔNG đổi giá trị thì bỏ qua (không cần quyền).
// Việc đổi trạng thái cần quyền nào (trang quản trị dùng đúng quy tắc này để ẩn / hiện nút).
function quyenDoiTT(d, tt) {
  if (tt === 'giu' || d.tt === 'giu' || (d.loai === 'chua' && ['moi', 'huy', 'tuchoi'].indexOf(d.tt) >= 0)) return 'chua';
  if ((tt === 'danggiao' || tt === 'dagiao') && (d.tt === 'xacnhan' || d.tt === 'danggiao')) return 'giao';
  return 'don';
}
function capNhatDon(p, ti) {
  var tt = String(p.tt || '');
  if (tt && !TRANG_THAI[tt]) return { status: 'error', msg: 'Trạng thái không hợp lệ.' };
  var lock = LockService.getScriptLock(), msg = [], nk = []; lock.waitLock(20000);
  try {
    var d = docDon({ noiBo: true }, 5000).filter(function (x) { return x.ma === chu(p.ma); })[0];
    if (!d) return { status: 'error', msg: 'Không thấy đơn ' + p.ma };
    var noiBo = ti.role === 'admin' || ti.role === 'nv';
    if (!noiBo && (d.user !== ti.user || tt !== 'huy' || d.tt !== 'moi')) return { status: 'error', msg: 'forbidden' };
    var co = function (q) { return !noiBo || coQuyen(ti, q); }; // đại lý tự hủy đơn của mình: đã kiểm ở trên
    var cam = function (q) { return { status: 'error', msg: 'Tài khoản chưa có quyền: ' + QUYEN[q] + '. Nhờ quản trị bật trong "Nhân viên & quyền".' }; };
    var doiTT = tt && tt !== d.tt;
    var n = Math.round(Number(p.giaHan) || 0);
    var soTien = function (v) { return v === undefined || v === '' || v === null ? null : Math.max(0, Number(v) || 0); };
    var cocMoi = soTien(p.coc), daCocMoi = soTien(p.daCoc);
    var doiCoc = (cocMoi !== null && cocMoi !== d.coc) || (daCocMoi !== null && daCocMoi !== d.daCoc);
    var doiNB = p.ghiChuNB !== undefined && chu(p.ghiChuNB).slice(0, 500) !== d.ghiChuNB;
    // Kiểm quyền trước khi ghi bất cứ gì.
    // Duyệt / từ chối / mở lại / nhả đơn chừa hàng cần quyền 'chua'; giao hàng cần quyền 'don'.
    var qTT = quyenDoiTT(d, tt);
    if (doiTT && !co(qTT)) return cam(qTT);
    if ((n > 0 || p.boXin) && !co('chua')) return cam('chua');
    if (doiCoc && !co('coc')) return cam('coc');
    if (doiNB && !co('ghichu')) return cam('ghichu');
    if (tt === 'giu' && d.loai !== 'chua') return { status: 'error', msg: 'Đơn này không phải yêu cầu chừa hàng.' };
    if (n > 0 && (tt || d.tt) !== 'giu') return { status: 'error', msg: 'Chỉ gia hạn được đơn đang chừa hàng.' };

    var sh = tabDon(TAB_DON, TD_DON), head = dauCot(sh);
    var ghi = function (ten, v) { var c = head.indexOf(ten) + 1; if (c > 0) sh.getRange(d._dong, c).setValue(v); };
    if (doiTT) {
      ghi('Trạng thái', TRANG_THAI[tt]); msg.push(TRANG_THAI[tt]); nk.push(TRANG_THAI[d.tt] + ' → ' + TRANG_THAI[tt]);
      if (tt === 'giu') {
        var soNgay = Math.round(Number(p.soNgay) || d.soNgay || 3);
        var han = congNgay(new Date(), soNgay);
        ghi('Hạn chừa', han); ghi('Số ngày chừa', soNgay);
        msg.push('giữ tới ' + Utilities.formatDate(han, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy')); nk.push('giữ ' + soNgay + ' ngày tới ' + Utilities.formatDate(han, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy'));
        try { damBaoNhacChua(); } catch (e) { }
      }
      if (tt === 'danggiao' && chu(p.nguoiGiao)) { ghi('Người giao', chu(p.nguoiGiao).slice(0, 100)); nk.push('người giao: ' + chu(p.nguoiGiao).slice(0, 100)); }
      if (tt === 'dagiao') ghi('Ngày giao', new Date());
    }
    if (n > 0) {
      var tu = d.han && new Date(d.han).getTime() > Date.now() ? new Date(d.han) : new Date();
      var han2 = congNgay(tu, n), sHan = Utilities.formatDate(han2, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
      ghi('Hạn chừa', han2); ghi('Số ngày chừa', (d.soNgay || 0) + n); ghi('Xin gia hạn (ngày)', '');
      msg.push('gia hạn tới ' + sHan); nk.push('gia hạn +' + n + ' ngày → ' + sHan);
    }
    if (p.boXin) { ghi('Xin gia hạn (ngày)', ''); msg.push('không đồng ý gia hạn'); nk.push('không đồng ý xin gia hạn ' + d.xinGH + ' ngày'); }
    if (cocMoi !== null && cocMoi !== d.coc) { ghi('Cọc yêu cầu', cocMoi); nk.push('cọc yêu cầu ' + tienVN(d.coc) + ' → ' + tienVN(cocMoi)); }
    if (daCocMoi !== null && daCocMoi !== d.daCoc) { ghi('Đã nhận cọc', daCocMoi); nk.push('đã nhận cọc ' + tienVN(d.daCoc) + ' → ' + tienVN(daCocMoi)); }
    if (doiNB) { ghi('Ghi chú nội bộ', chu(p.ghiChuNB).slice(0, 500)); nk.push('ghi chú nội bộ: ' + chu(p.ghiChuNB).slice(0, 200)); }
    if (!nk.length) return { status: 'ok', msg: 'Không có gì thay đổi' };
    ghi('Người xử lý', ti.user); ghi('Cập nhật lúc', new Date());
  } finally { lock.releaseLock(); }
  demXoa('giu');
  ghiNhatKy(ti, noiBo ? 'Cập nhật đơn' : 'Đại lý tự hủy đơn', d.ma, nk.join(' · '));
  if (doiTT && tt === 'xacnhan') try { baoKho(d); } catch (e) { Logger.log('Báo kho lỗi: ' + e); }
  return { status: 'ok', msg: 'Đơn ' + p.ma + (msg.length ? ': ' + msg.join(', ') : ': đã lưu') };
}

// Đại lý xin gia hạn đơn chừa hàng của mình -> báo quản trị duyệt.
function xinGiaHan(p, ti) {
  var n = Math.round(Number(p.soNgay) || 0);
  if (!docCaiChua().some(function (x) { return x.ngay === n; })) return { status: 'error', msg: 'Số ngày không hợp lệ.' };
  var d = docDon({ user: ti.user }, 500).filter(function (x) { return x.ma === chu(p.ma); })[0];
  if (!d || d.tt !== 'giu') return { status: 'error', msg: 'Chỉ xin gia hạn được đơn đang chừa hàng.' };
  var sh = tabDon(TAB_DON, TD_DON), head = dauCot(sh);
  sh.getRange(d._dong, head.indexOf('Xin gia hạn (ngày)') + 1).setValue(n);
  sh.getRange(d._dong, head.indexOf('Cập nhật lúc') + 1).setValue(new Date());
  ghiNhatKy(ti, 'Xin gia hạn chừa hàng', d.ma, 'thêm ' + n + ' ngày');
  try {
    var t = '⏳ ' + d.ten + ' xin gia hạn chừa hàng ' + d.ma + ' thêm ' + n + ' ngày' + (d.han ? ' (hạn hiện tại ' + ngayVN(d.han) + ')' : '');
    baoQuanTri(t, t + '\n\nDuyệt: ' + WEB_APP_PAGE + 'quan-tri.html#don=' + encodeURIComponent(d.ma));
  } catch (e) { }
  return { status: 'ok', msg: 'Đã gửi xin gia hạn ' + n + ' ngày – chờ công ty duyệt' };
}

// ---------- Hàng đang giữ theo mã (để tính "Được bán") ----------
// { ma: { sl: số theo đơn vị đặt, m2: m² tương ứng (nếu đặt theo thùng), don: số đơn } }
function giuTheoMa() {
  var c = demLay('giu');
  if (c) return c;
  var giu = {};
  docDon({ cacTT: TT_GIU_HANG }, 5000).forEach(function (d) {
    d.items.forEach(function (x) {
      var g = giu[x.ma] || (giu[x.ma] = { sl: 0, m2: 0, don: 0 });
      g.sl = lam3(g.sl + (Number(x.sl) || 0));
      g.m2 = lam3(g.m2 + (parseFloat(String(x.qd || '').replace(',', '.')) || 0));
      g.don++;
    });
  });
  demLuu('giu', giu, 600);
  return giu;
}
// Trừ hàng đang giữ vào tồn: ưu tiên trừ "có ngay" -> "mai có" -> "chờ hàng".
function truHangGiu(data) {
  var giu = {};
  try { giu = giuTheoMa(); } catch (e) { return; }
  Object.keys(giu).forEach(function (ma) {
    var d = data[ma]; if (!d) return;
    var g = giu[ma], sl = d.dvt === 'thùng' || !g.m2 ? g.sl : g.m2; // tồn không theo thùng mà đơn theo thùng -> trừ m²
    d.tonGoc = d.tong; d.giu = lam3(sl);
    d.tong = lam3(Math.max(0, d.tong - sl));
    var con = sl;
    ['nhanh', 'mai', 'cho'].forEach(function (t) { var b = Math.min(d.tier[t], con); d.tier[t] = lam3(d.tier[t] - b); con -= b; });
  });
}

// ---------- Nhắc chừa hàng hết hạn (chạy mỗi sáng) ----------
function damBaoNhacChua() {
  var co = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'nhacChuaHang'; });
  if (!co) ScriptApp.newTrigger('nhacChuaHang').timeBased().everyDays(1).atHour(7).inTimezone('Asia/Ho_Chi_Minh').create();
}
function caiNhacChua() {
  damBaoNhacChua();
  SpreadsheetApp.getActiveSpreadsheet().toast('Đã bật nhắc chừa hàng hết hạn lúc 7h sáng mỗi ngày.', 'App', 6);
}
function ngayVN(iso) { return Utilities.formatDate(new Date(iso), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy'); }
function nhacChuaHang() {
  var bay = Date.now(), mai = bay + 86400000;
  var ds = docDon({ tt: 'giu' }, 5000).filter(function (d) { return d.han && (new Date(d.han).getTime() < mai || d.xinGH); });
  if (!ds.length) return;
  var dong = ds.map(function (d) {
    var h = new Date(d.han).getTime();
    return (h < bay ? '❗ ĐÃ HẾT HẠN ' : '⏰ Hết hạn ') + ngayVN(d.han) + ' – ' + d.ma + ' – ' + d.ten + ' – ' + tienVN(d.tong) +
      (d.coc ? ' – cọc ' + tienVN(d.daCoc) + '/' + tienVN(d.coc) : '') + (d.xinGH ? ' – xin thêm ' + d.xinGH + ' ngày' : '');
  });
  var tieuDe = '🔒 ' + ds.length + ' đơn chừa hàng cần quyết (gia hạn / chuyển giao / nhả hàng)';
  baoQuanTri(tieuDe, tieuDe + '\n\n' + dong.join('\n') + '\n\nMở trang quản trị: ' + WEB_APP_PAGE + 'quan-tri.html');
}

// ---------- Báo đơn: Email + Telegram (nhóm chat) ----------
// 2 nơi nhận:  "chinh" – đơn mới, chừa hàng, xin gia hạn, nhắc hạn (chủ DN / bán hàng)
//              "kho"   – đơn ĐÃ DUYỆT cần xuất kho đi giao (nhóm kho & giao hàng)
// Cài trên Sheet: menu 📱 App → "Cài email nhận báo đơn" / "Cài Telegram (nhóm chat)".
function tienVN(n) { return Number(n || 0).toLocaleString('vi-VN') + 'đ'; }
function emailNhan(noi) {
  var pr = PropertiesService.getScriptProperties();
  var v = pr.getProperty(noi === 'kho' ? 'EMAIL_KHO' : 'EMAIL_BAO_DON');
  if (v === null && noi !== 'kho') v = typeof EMAIL_BAO_DON === 'string' ? EMAIL_BAO_DON : '';
  return String(v || '').split(/[\s,;]+/).filter(function (x) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x); }).join(',');
}
function baoQuanTri(tieuDe, noiDung, html, noi) {
  var email = emailNhan(noi);
  if (email) MailApp.sendEmail({ to: email, subject: tieuDe, body: noiDung, htmlBody: html || noiDung.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>'), name: 'App Hiển Nga' });
  guiTelegram(noiDung, noi);
}
function htmlBangHang(don) {
  var e = function (x) { return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  return '<table border="1" cellpadding="6" style="border-collapse:collapse"><tr style="background:#E3F2FD"><th>Mã</th><th>Tên</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>' +
    don.items.map(function (d) { return '<tr><td>' + e(d.ma) + '</td><td>' + e(d.ten) + '</td><td>' + d.sl + ' ' + e(d.dv) + (d.qd ? '<br><small>' + e(d.qd) + '</small>' : '') + '</td><td align="right">' + tienVN(d.dongia) + '</td><td align="right">' + tienVN(d.tien) + '</td></tr>'; }).join('') +
    '<tr><td colspan="4" align="right"><b>Tổng</b></td><td align="right"><b>' + tienVN(don.tong) + '</b></td></tr></table>';
}
function baoDonMoi(don) {
  var link = WEB_APP_PAGE + 'quan-tri.html#don=' + encodeURIComponent(don.ma);
  var chua = don.loai === 'chua';
  var dongCT = don.items.map(function (d) { return '• ' + d.ma + ' – ' + d.sl + ' ' + d.dv + (d.qd ? ' (' + d.qd + ')' : '') + ' × ' + tienVN(d.dongia) + ' = ' + tienVN(d.tien); });
  var tieuDe = (chua ? '🔒 Yêu cầu CHỪA HÀNG ' + don.soNgay + ' ngày ' : '🛒 Đơn mới ') + don.ma + ' – ' + don.ten + ' – ' + tienVN(don.tong);
  var dau = [tieuDe, 'Hình thức: ' + don.hinhThuc + (don.ngayCan ? ' · cần ngày ' + don.ngayCan : '')];
  if (chua) dau.push('Chừa ' + don.soNgay + ' ngày' + (don.coc ? ' · cọc yêu cầu ' + tienVN(don.coc) : ' · không cần cọc'));
  if (don.diaChi) dau.push('Địa chỉ: ' + don.diaChi);
  if (don.sdt) dau.push('SĐT: ' + don.sdt);
  if (don.ghiChu) dau.push('Ghi chú: ' + don.ghiChu);
  var noiDung = dau.join('\n') + '\n\n' + dongCT.join('\n') + '\n\nDuyệt đơn: ' + link;
  var e = function (x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var html = '<div style="font:14px Arial"><h2 style="color:' + (chua ? '#B45309' : '#0140FF') + '">' + e(tieuDe) + '</h2><p>' + dau.slice(1).map(e).join('<br>') + '</p>' + htmlBangHang(don) +
    '<p><a href="' + link + '" style="background:#0140FF;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Mở trang quản trị để duyệt</a></p></div>';
  baoQuanTri(tieuDe, noiDung, html, 'chinh');
}
// Đơn vừa được duyệt (Đã xác nhận) -> báo nhóm kho chuẩn bị xuất hàng.
function baoKho(d) {
  if (!emailNhan('kho') && !PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_KHO')) return;
  var link = WEB_APP_PAGE + 'quan-tri.html#don=' + encodeURIComponent(d.ma);
  var tieuDe = '🚚 Cần xuất kho ' + d.ma + ' – ' + d.ten + (d.ngayCan ? ' – cần ngày ' + d.ngayCan : '');
  var dau = [tieuDe, d.hinhThuc + (d.diaChi ? ' · ' + d.diaChi : '') + (d.sdt ? ' · SĐT ' + d.sdt : '')];
  if (d.ghiChu) dau.push('Ghi chú khách: ' + d.ghiChu);
  var noiDung = dau.join('\n') + '\n\n' + d.items.map(function (x) { return '• ' + x.ma + ' – ' + x.sl + ' ' + x.dv + (x.qd ? ' (' + x.qd + ')' : ''); }).join('\n') + '\n\nMở đơn / báo đã giao: ' + link;
  baoQuanTri(tieuDe, noiDung, null, 'kho');
}
function guiTelegram(text, noi) {
  var pr = PropertiesService.getScriptProperties(), tk = pr.getProperty('TELEGRAM_TOKEN');
  var khoa = noi === 'kho' ? 'TELEGRAM_CHAT_KHO' : 'TELEGRAM_CHAT', chat = pr.getProperty(khoa);
  if (!tk || !chat) return false;
  var gui = function (id) {
    return UrlFetchApp.fetch('https://api.telegram.org/bot' + tk + '/sendMessage', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ chat_id: id, text: String(text).slice(0, 3900), disable_web_page_preview: true })
    });
  };
  var r = gui(chat);
  if (r.getResponseCode() === 200) return true;
  // Nhóm thường được Telegram nâng lên "siêu nhóm" -> đổi Chat ID: tự cập nhật rồi gửi lại.
  try {
    var moi = ((JSON.parse(r.getContentText() || '{}').parameters) || {}).migrate_to_chat_id;
    if (moi) { pr.setProperty(khoa, String(moi)); return gui(String(moi)).getResponseCode() === 200; }
  } catch (e) { }
  return false;
}

// ---------- Cài đặt báo đơn (menu trên Sheet) ----------
function caiEmail() {
  var ui = SpreadsheetApp.getUi(), pr = PropertiesService.getScriptProperties();
  var a = ui.prompt('Email nhận báo đơn (1/2)', 'Email nhận ĐƠN MỚI / chừa hàng / nhắc hạn. Nhiều email cách nhau dấu phẩy.\nHiện tại: ' + (emailNhan('chinh') || '(chưa có)') + '\nĐể trống = giữ nguyên.', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  if (a.getResponseText().trim()) pr.setProperty('EMAIL_BAO_DON', a.getResponseText().trim());
  var b = ui.prompt('Email nhóm kho (2/2)', 'Email kho & giao hàng – nhận ĐƠN ĐÃ DUYỆT cần xuất giao. Nhiều email cách nhau dấu phẩy.\nHiện tại: ' + (emailNhan('kho') || '(chưa có)') + '\nĐể trống = giữ nguyên, gõ "xoa" = bỏ.', ui.ButtonSet.OK_CANCEL);
  if (b.getSelectedButton() === ui.Button.OK && b.getResponseText().trim()) {
    var v = b.getResponseText().trim();
    if (norm(v) === 'xoa') pr.deleteProperty('EMAIL_KHO'); else pr.setProperty('EMAIL_KHO', v);
  }
  ui.alert('Đã lưu.\nĐơn mới → ' + (emailNhan('chinh') || '(không)') + '\nKho → ' + (emailNhan('kho') || '(không)'));
}
// Nối Telegram vào NHÓM CHAT: thêm bot vào nhóm, gõ /start trong nhóm, rồi chạy mục này.
function caiTelegram() {
  var ui = SpreadsheetApp.getUi(), pr = PropertiesService.getScriptProperties();
  if (ScriptApp.requireAllScopes) ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL); // hỏi lại quyền còn thiếu
  var cu = pr.getProperty('TELEGRAM_TOKEN');
  var a = ui.prompt('Telegram – bước 1/3: mã bot', 'Dán mã bot (token) do @BotFather cấp, dạng 123456:ABC…' + (cu ? '\nĐã có mã bot – để trống = dùng mã cũ.' : ''), ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  // Lấy đúng mã dạng 123456789:AAx… dù dán cả đoạn tin của BotFather / thừa dấu cách.
  var dan = a.getResponseText().replace(/\s+/g, ''), tim = dan.match(/\d{6,}:[A-Za-z0-9_-]{30,}/);
  var tk = tim ? tim[0] : (dan || cu);
  if (!tk) { ui.alert('Chưa có mã bot.'); return; }
  // Kiểm tra mã bot NGAY (trước khi hỏi nhóm).
  var me = {}, loiMang = '';
  try { me = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + tk + '/getMe', { muteHttpExceptions: true }).getContentText() || '{}'); }
  catch (e) { loiMang = e.message; }
  if (loiMang) { ui.alert('Không gọi được Telegram: ' + loiMang); return; }
  if (!me.ok) {
    ui.alert('Telegram không nhận mã bot này' + (me.description ? ' (' + me.description + ')' : '') + '.\n\n' +
      'Thường do: dán mã CŨ sau khi đã /revoke, hoặc chép thiếu ký tự.\nVào @BotFather gõ /token → chọn bot → chép mã mới nhất rồi chạy lại.\n\n' +
      'Mã vừa nhận: ' + tk.slice(0, 6) + '…' + tk.slice(-4) + ' (' + tk.length + ' ký tự)');
    return;
  }
  var b = ui.prompt('Telegram – bước 2/3: nhóm nào?', 'Gõ 1 = NHÓM CHÍNH (đơn mới, chừa hàng, nhắc hạn)\nGõ 2 = NHÓM KHO (đơn đã duyệt cần xuất giao)', ui.ButtonSet.OK_CANCEL);
  if (b.getSelectedButton() !== ui.Button.OK) return;
  var kho = b.getResponseText().trim() === '2';
  var c = ui.alert('Telegram – bước 3/3', 'Trên Telegram:\n1. Thêm bot vào nhóm chat ' + (kho ? 'KHO' : 'CHÍNH') + '.\n2. Trong nhóm gõ: /start\n3. Quay lại đây bấm OK.', ui.ButtonSet.OK_CANCEL);
  if (c !== ui.Button.OK) return;
  var res = {};
  try { res = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + tk + '/getUpdates', { muteHttpExceptions: true }).getContentText() || '{}'); }
  catch (e) { ui.alert('Không gọi được Telegram: ' + e.message); return; }
  if (!res.ok) { ui.alert('Telegram báo lỗi: ' + (res.description || 'không rõ') + '. Chạy lại mục này sau ít phút.'); return; }
  // Tìm nhóm gần nhất bot thấy (tin nhắn /start hoặc lúc được thêm vào nhóm).
  var nhom = null, rieng = null;
  (res.result || []).forEach(function (u) {
    var m = u.message || u.channel_post || u.my_chat_member || u.edited_message, ch = m && m.chat;
    if (!ch) return;
    if (ch.type === 'group' || ch.type === 'supergroup') nhom = ch; else if (ch.type === 'private') rieng = ch;
  });
  var chon = nhom || rieng;
  if (!chon) { ui.alert('Chưa thấy nhóm nào. Kiểm tra: bot đã ở trong nhóm chưa, đã gõ /start trong nhóm chưa, rồi chạy lại.'); return; }
  var ten = chon.title || [chon.first_name, chon.last_name].filter(String).join(' ');
  if (ui.alert('Xác nhận', 'Gửi báo ' + (kho ? 'KHO' : 'ĐƠN MỚI') + ' vào: "' + ten + '"' + (nhom ? ' (nhóm)' : ' (chat riêng – chưa thấy nhóm)') + '?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  pr.setProperty('TELEGRAM_TOKEN', tk);
  pr.setProperty(kho ? 'TELEGRAM_CHAT_KHO' : 'TELEGRAM_CHAT', String(chon.id));
  var ok = guiTelegram('✅ App Hiển Nga đã nối nhóm này – ' + (kho ? 'đơn ĐÃ DUYỆT cần xuất kho đi giao' : 'đơn mới, chừa hàng, nhắc hạn') + ' sẽ báo vào đây.', kho ? 'kho' : 'chinh');
  ui.alert(ok ? 'Đã nối "' + ten + '". Kiểm tra tin nhắn thử trong nhóm.' : 'Không gửi được – bot có bị chặn gửi tin trong nhóm không?');
}
function thuBaoDon() {
  var mau = { ma: 'THU-000', ten: 'Đơn thử', sdt: '0900000000', hinhThuc: 'Giao tận nơi', diaChi: 'Địa chỉ thử', ngayCan: '', ghiChu: 'Đây là tin thử', tong: 1000000,
    items: [{ ma: 'GHT.BC6600T', ten: 'Gạch thử', sl: 2, dv: 'thùng', qd: '2.88 m²', dongia: 347222, tien: 1000000 }] };
  baoDonMoi(mau); baoKho(mau);
  SpreadsheetApp.getUi().alert('Đã gửi thử.\nĐơn mới → ' + (emailNhan('chinh') || '(chưa có email)') + ' + Telegram nhóm chính (nếu đã nối)\nKho → ' + (emailNhan('kho') || '(chưa có email)') + ' + Telegram nhóm kho (nếu đã nối)');
}
