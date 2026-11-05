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
  'Loại', 'Số ngày chừa', 'Hạn chừa', 'Cọc yêu cầu', 'Đã nhận cọc', 'Xin gia hạn (ngày)'];
var TD_CT = ['Mã đơn', 'Ngày đặt', 'Tài khoản', 'Mã hàng', 'Tên hàng', 'Số lượng', 'Đơn vị', 'Quy đổi', 'Đơn giá', 'Thành tiền'];
var TRANG_THAI = { moi: 'Mới – chờ duyệt', giu: 'Đang chừa hàng', xacnhan: 'Đã xác nhận', danggiao: 'Đang giao', dagiao: 'Đã giao', huy: 'Đã hủy', tuchoi: 'Từ chối' };
var LOAI_CHUA = 'Chừa hàng';
var TT_GIU_HANG = ['giu', 'xacnhan', 'danggiao']; // các trạng thái làm giảm "Được bán"
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
    loai: ['Loại'], sn: ['Số ngày chừa'], han: ['Hạn chừa'], coc: ['Cọc yêu cầu'], dacoc: ['Đã nhận cọc'], xin: ['Xin gia hạn (ngày)']
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
      coc: Number(o('coc')) || 0, daCoc: Number(o('dacoc')) || 0, xinGH: Number(o('xin')) || 0, _dong: i + 1 });
  }
  return ds;
}
function boDong(d) { delete d._dong; return d; }

function donCuaToi(ti) {
  return { status: 'ok', data: docDon({ user: ti.user }, 100).map(boDong), chuaCfg: docCaiChua() };
}

// Quản trị / nhân viên xem tất cả.
function dsDon(p) {
  var ds = docDon({ tt: p.tt || '', noiBo: true }, Number(p.gioiHan) || 500);
  var dem = { moi: 0, giu: 0, xacnhan: 0, danggiao: 0, dagiao: 0, huy: 0, tuchoi: 0, hetHan: 0, xinGH: 0 }, bay = Date.now();
  docDon({}, 5000).forEach(function (d) {
    dem[d.tt] = (dem[d.tt] || 0) + 1;
    if (d.tt === 'giu' && d.han && new Date(d.han).getTime() < bay) dem.hetHan++;
    if (d.tt === 'giu' && d.xinGH) dem.xinGH++;
  });
  return { status: 'ok', data: ds.map(boDong), dem: dem, chuaCfg: docCaiChua() };
}

// Cập nhật đơn.
//  Đại lý: chỉ tự hủy đơn của mình khi còn "Mới".
//  Quản trị: p.tt (đổi trạng thái; 'giu' = duyệt chừa, tính hạn từ hôm nay), p.giaHan (thêm n ngày),
//            p.boXin (từ chối xin gia hạn), p.coc / p.daCoc (tiền cọc), p.ghiChuNB.
function capNhatDon(p, ti) {
  var tt = String(p.tt || '');
  if (tt && !TRANG_THAI[tt]) return { status: 'error', msg: 'Trạng thái không hợp lệ.' };
  var lock = LockService.getScriptLock(), msg = []; lock.waitLock(20000);
  try {
    var d = docDon({ noiBo: true }, 5000).filter(function (x) { return x.ma === chu(p.ma); })[0];
    if (!d) return { status: 'error', msg: 'Không thấy đơn ' + p.ma };
    var laAdmin = ti.role === 'admin';
    if (!laAdmin && (d.user !== ti.user || tt !== 'huy' || d.tt !== 'moi')) return { status: 'error', msg: 'forbidden' };
    var sh = tabDon(TAB_DON, TD_DON), head = dauCot(sh);
    var ghi = function (ten, v) { var c = head.indexOf(ten) + 1; if (c > 0) sh.getRange(d._dong, c).setValue(v); };
    if (tt === 'giu' && d.loai !== 'chua') return { status: 'error', msg: 'Đơn này không phải yêu cầu chừa hàng.' };
    if (tt && tt !== d.tt) {
      ghi('Trạng thái', TRANG_THAI[tt]); msg.push(TRANG_THAI[tt]);
      if (tt === 'giu') {
        var soNgay = Math.round(Number(p.soNgay) || d.soNgay || 3);
        var han = congNgay(new Date(), soNgay);
        ghi('Hạn chừa', han); ghi('Số ngày chừa', soNgay);
        msg.push('giữ tới ' + Utilities.formatDate(han, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy'));
        try { damBaoNhacChua(); } catch (e) { }
      }
    }
    if (laAdmin) {
      var n = Math.round(Number(p.giaHan) || 0);
      if (n > 0) {
        if ((tt || d.tt) !== 'giu') return { status: 'error', msg: 'Chỉ gia hạn được đơn đang chừa hàng.' };
        var tu = d.han && new Date(d.han).getTime() > Date.now() ? new Date(d.han) : new Date();
        var han2 = congNgay(tu, n);
        ghi('Hạn chừa', han2); ghi('Số ngày chừa', (d.soNgay || 0) + n); ghi('Xin gia hạn (ngày)', '');
        msg.push('gia hạn tới ' + Utilities.formatDate(han2, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy'));
      }
      if (p.boXin) { ghi('Xin gia hạn (ngày)', ''); msg.push('không đồng ý gia hạn'); }
      if (p.coc !== undefined && p.coc !== '') ghi('Cọc yêu cầu', Math.max(0, Number(p.coc) || 0));
      if (p.daCoc !== undefined && p.daCoc !== '') ghi('Đã nhận cọc', Math.max(0, Number(p.daCoc) || 0));
      if (p.ghiChuNB !== undefined) ghi('Ghi chú nội bộ', chu(p.ghiChuNB).slice(0, 500));
    }
    ghi('Người xử lý', ti.user); ghi('Cập nhật lúc', new Date());
  } finally { lock.releaseLock(); }
  demXoa('giu');
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

// ---------- Báo đơn: Email + Telegram ----------
function tienVN(n) { return Number(n || 0).toLocaleString('vi-VN') + 'đ'; }
function baoQuanTri(tieuDe, noiDung, html) {
  var email = typeof EMAIL_BAO_DON === 'string' ? EMAIL_BAO_DON : '';
  if (email) MailApp.sendEmail({ to: email, subject: tieuDe, body: noiDung, htmlBody: html || noiDung.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>'), name: 'App Hiển Nga' });
  guiTelegram(noiDung);
}
function baoDonMoi(don) {
  var link = WEB_APP_PAGE + 'quan-tri.html#don=' + encodeURIComponent(don.ma);
  var chua = don.loai === 'chua';
  var dongCT = don.items.map(function (d) { return d.ma + ' – ' + d.sl + ' ' + d.dv + (d.qd ? ' (' + d.qd + ')' : '') + ' × ' + tienVN(d.dongia) + ' = ' + tienVN(d.tien); });
  var tieuDe = (chua ? '🔒 Yêu cầu CHỪA HÀNG ' + don.soNgay + ' ngày ' : '🛒 Đơn mới ') + don.ma + ' – ' + don.ten + ' – ' + tienVN(don.tong);
  var dau = [tieuDe, 'Hình thức: ' + don.hinhThuc + (don.ngayCan ? ' · cần ngày ' + don.ngayCan : '')];
  if (chua) dau.push('Chừa ' + don.soNgay + ' ngày' + (don.coc ? ' · cọc yêu cầu ' + tienVN(don.coc) : ' · không cần cọc'));
  if (don.diaChi) dau.push('Địa chỉ: ' + don.diaChi);
  if (don.sdt) dau.push('SĐT: ' + don.sdt);
  if (don.ghiChu) dau.push('Ghi chú: ' + don.ghiChu);
  var noiDung = dau.join('\n') + '\n\n' + dongCT.join('\n') + '\n\nDuyệt đơn: ' + link;
  var e = function (x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var html = '<div style="font:14px Arial"><h2 style="color:' + (chua ? '#B45309' : '#0140FF') + '">' + e(tieuDe) + '</h2><p>' + dau.slice(1).map(e).join('<br>') +
    '</p><table border="1" cellpadding="6" style="border-collapse:collapse"><tr style="background:#E3F2FD"><th>Mã</th><th>Tên</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>' +
    don.items.map(function (d) { return '<tr><td>' + e(d.ma) + '</td><td>' + e(d.ten) + '</td><td>' + d.sl + ' ' + e(d.dv) + (d.qd ? '<br><small>' + e(d.qd) + '</small>' : '') + '</td><td align="right">' + tienVN(d.dongia) + '</td><td align="right">' + tienVN(d.tien) + '</td></tr>'; }).join('') +
    '<tr><td colspan="4" align="right"><b>Tổng</b></td><td align="right"><b>' + tienVN(don.tong) + '</b></td></tr></table>' +
    '<p><a href="' + link + '" style="background:#0140FF;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Mở trang quản trị để duyệt</a></p></div>';
  baoQuanTri(tieuDe, noiDung, html);
}
function guiTelegram(text) {
  var pr = PropertiesService.getScriptProperties(), tk = pr.getProperty('TELEGRAM_TOKEN'), chat = pr.getProperty('TELEGRAM_CHAT');
  if (!tk || !chat) return false;
  var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + tk + '/sendMessage', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ chat_id: chat, text: String(text).slice(0, 3900), disable_web_page_preview: true })
  });
  return r.getResponseCode() === 200;
}

// ---------- Cài đặt báo đơn (menu trên Sheet) ----------
function caiTelegram() {
  var ui = SpreadsheetApp.getUi();
  var a = ui.prompt('Telegram – bước 1/2', 'Dán mã bot (token) do @BotFather cấp, dạng 123456:ABC…', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  var tk = a.getResponseText().trim();
  var b = ui.prompt('Telegram – bước 2/2', 'Nhắn 1 tin bất kỳ cho bot trên Telegram trước, rồi bấm OK (để trống ô này).\nHoặc dán sẵn Chat ID nếu đã biết.', ui.ButtonSet.OK_CANCEL);
  if (b.getSelectedButton() !== ui.Button.OK) return;
  var chat = b.getResponseText().trim();
  if (!chat) {
    var res = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + tk + '/getUpdates', { muteHttpExceptions: true }).getContentText() || '{}');
    var u = (res.result || []).slice(-1)[0];
    chat = u && (u.message || u.channel_post || {}).chat ? String((u.message || u.channel_post).chat.id) : '';
  }
  if (!chat) { ui.alert('Chưa lấy được Chat ID – hãy nhắn 1 tin cho bot rồi chạy lại.'); return; }
  var pr = PropertiesService.getScriptProperties();
  pr.setProperty('TELEGRAM_TOKEN', tk); pr.setProperty('TELEGRAM_CHAT', chat);
  ui.alert(guiTelegram('✅ App Hiển Nga đã nối Telegram – đơn mới sẽ báo vào đây.') ? 'Đã nối Telegram, kiểm tra tin nhắn thử.' : 'Không gửi được – kiểm tra lại mã bot.');
}
function thuBaoDon() {
  baoDonMoi({ ma: 'THU-000', ten: 'Đơn thử', sdt: '0900000000', hinhThuc: 'Giao tận nơi', diaChi: 'Địa chỉ thử', ngayCan: '', ghiChu: 'Đây là tin thử', tong: 1000000,
    items: [{ ma: 'GHT.BC6600T', ten: 'Gạch thử', sl: 2, dv: 'thùng', qd: '2.88 m²', dongia: 347222, tien: 1000000 }] });
  SpreadsheetApp.getUi().alert('Đã gửi báo đơn thử tới ' + (typeof EMAIL_BAO_DON === 'string' ? EMAIL_BAO_DON : '(chưa cài email)') + ' và Telegram (nếu đã nối).');
}
