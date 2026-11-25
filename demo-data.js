// ============================================================
// DỮ LIỆU DÙNG THỬ – HOÀN TOÀN GIẢ (tên hãng, mã, giá, tồn kho đều bịa).
// Chỉ nạp khi config.js chưa có APPS_URL hoặc địa chỉ có ?demo=1.
// Mô phỏng đúng cách máy chủ che dữ liệu theo quyền.
// ============================================================
(function () {
  var HANG = ['Hãng Mẫu A', 'Hãng Mẫu B', 'Hãng Mẫu C'];
  var KHO = [['Kho Trung tâm', 'nhanh'], ['Kho Chi nhánh', 'mai'], ['Kho Hãng', 'cho']];
  var data = [], ton = {}, seed = 7, NGAY_TAY0 = {};
  function rnd(n) { seed = (seed * 9301 + 49297) % 233280; return Math.floor(seed / 233280 * n); }
  function chon(a) { return a[rnd(a.length)]; }

  var gachKc = ['600x600', '800x800', '600x1200', '300x600', '400x800'];
  for (var i = 1; i <= 36; i++) {
    var kc = chon(gachKc), m2 = { '600x600': 1.44, '800x800': 1.92, '600x1200': 1.44, '300x600': 1.44, '400x800': 1.28 }[kc];
    var vien = Math.round(m2 / (kc.split('x')[0] * kc.split('x')[1] / 1e6));
    var ny = (180 + rnd(40) * 10) * 1000;
    data.push({ ma: 'GM' + kc.replace('x', '') + ('00' + i).slice(-3), hang: chon(HANG), nhom: 'Gạch', ten: 'Gạch mẫu ' + chon(['vân đá', 'vân gỗ', 'xi măng', 'trơn']) + ' ' + i,
      kc: kc, loai: chon(['Porcelain', 'Ceramic']), dvt: 'm²', dg: vien + ' viên/thùng · ' + m2 + ' m²/thùng', ny: ny, dl: Math.round(ny * 0.82 / 1000) * 1000, gc: '',
      mau: chon(['Trắng', 'Xám nhạt', 'Kem', 'Nâu']), congNang: chon(['Lát nền', 'Ốp tường', 'Lát nền, Ốp tường', 'Ngoài trời']),
      tinhNang: chon(['Chống trơn', '', 'Chống thấm']), hoaVan: chon(['Vân đá', 'Vân gỗ', 'Trơn']), men: chon(['Bóng', 'Mờ', 'Sần']), dungTich: '' });
  }
  for (i = 1; i <= 8; i++) data.push({ ma: 'NM' + ('00' + i).slice(-3), hang: chon(HANG), nhom: 'Ngói', ten: 'Ngói mẫu màu ' + chon(['đỏ', 'xám', 'nâu', 'xanh']),
    kc: '424x335', loai: chon(['Ngói chính', 'Ngói nóc']), dvt: 'viên', dg: '6 viên/thùng', ny: (25 + rnd(15)) * 1000, dl: (20 + rnd(10)) * 1000, gc: '', mau: chon(['Đỏ', 'Xám', 'Nâu']), congNang: '', tinhNang: '', hoaVan: '', men: '', dungTich: '' });
  for (i = 1; i <= 8; i++) data.push({ ma: 'KM' + ('00' + i).slice(-3), hang: chon(HANG), nhom: 'Keo', ten: chon(['Keo dán gạch mẫu', 'Keo chà ron mẫu']) + ' ' + i,
    kc: '', loai: chon(['Gốc xi măng', 'Epoxy']), dvt: 'bao', dg: '25 kg/bao', ny: (120 + rnd(20) * 10) * 1000, dl: (100 + rnd(15) * 10) * 1000, gc: '', mau: chon(['Trắng', 'Xám']), congNang: '', tinhNang: '', hoaVan: '', men: '', dungTich: '' });
  for (i = 1; i <= 10; i++) data.push({ ma: 'VS' + ('00' + i).slice(-3), hang: chon(HANG), nhom: 'Thiết bị vệ sinh', ten: chon(['Bồn cầu một khối mẫu', 'Lavabo đặt bàn mẫu', 'Vòi sen mẫu', 'Sen tắm mẫu']) + ' ' + i,
    kc: '', loai: chon(['Bồn cầu', 'Lavabo', 'Vòi', 'Sen']), dvt: 'bộ', dg: '', ny: (900 + rnd(60) * 50) * 1000, dl: (750 + rnd(50) * 50) * 1000, gc: chon(['', 'Bảo hành 5 năm']), mau: 'Trắng', congNang: '', tinhNang: '', hoaVan: '', men: '', dungTich: '' });
  for (i = 1; i <= 8; i++) data.push({ ma: 'BM' + ('00' + i).slice(-3), hang: chon(HANG), nhom: 'Thiết bị nhà bếp', ten: chon(['Bếp từ đôi mẫu', 'Máy hút mùi mẫu', 'Chậu rửa inox mẫu', 'Vòi rửa chén mẫu']) + ' ' + i,
    kc: '', loai: chon(['Bếp từ', 'Hút mùi', 'Chậu rửa', 'Vòi']), dvt: 'cái', dg: '', ny: (2500 + rnd(80) * 100) * 1000, dl: (2100 + rnd(60) * 100) * 1000, gc: chon(['', 'Bảo hành 3 năm']), mau: chon(['Đen', 'Inox']), congNang: '', tinhNang: '', hoaVan: '', men: '', dungTich: '' });
  for (i = 1; i <= 10; i++) data.push({ ma: 'SM' +('00' + i).slice(-3), hang: chon(HANG), nhom: 'Sơn', ten: chon(['Sơn nội thất mẫu', 'Sơn ngoại thất mẫu', 'Sơn lót mẫu']) + ' ' + i,
    kc: '', loai: chon(['Nội thất', 'Ngoại thất', 'Sơn lót']), dvt: 'thùng', dg: '', ny: (800 + rnd(80) * 25) * 1000, dl: (650 + rnd(60) * 25) * 1000, gc: '', mau: chon(['Trắng', 'Kem', 'Xanh nhạt']), congNang: '', tinhNang: '', hoaVan: '', men: chon(['Bóng', 'Mờ']), dungTich: chon(['5 lít', '18 lít']) });

  data.forEach(function (p, i) { // trọng lượng thử: gạch ≈ 20 kg / m² mỗi thùng; hàng khác vài kg
    var qcK = String(p.dg).match(/([\d.]+) m²/);
    if (p.dvt === 'm²' && qcK) p.kg = Math.round(Number(qcK[1]) * 20 * 10) / 10; else if (i % 3 === 0) p.kg = 2 + (i % 7) * 3;
    if (i === 0) p.video = 'https://www.youtube.com/watch?v=VIDEOTHU001\nhttps://youtube.com/shorts/VIDEOTHU002';
  });
  data.forEach(function (p) {
    if (rnd(5) === 0) return; // ~20% hết hàng
    var d = { tong: 0, dvt: p.dvt === 'm²' ? 'thùng' : p.dvt, tier: { nhanh: 0, mai: 0, cho: 0 }, kho: [] };
    // Gạch: tồn theo thùng, phần lẻ là viên (giống file thẻ kho thật).
    var qc = String(p.dg).match(/(\d+) viên\/thùng · ([\d.]+) m²/);
    if (p.dvt === 'm²' && qc) { d.vt = Number(qc[1]); d.m2 = Number(qc[2]); }
    KHO.forEach(function (k) {
      if (rnd(2)) return;
      var sl = 5 + rnd(120) + (d.vt ? rnd(d.vt) / d.vt : 0), lo = [{ so: 'L' + (2400 + rnd(99)), sl: Math.ceil(sl / 2) }, { so: 'L' + (2500 + rnd(99)), sl: Math.floor(sl / 2) }];
      d.kho.push({ ten: k[0], nhom: k[1], tong: sl, lo: lo }); d.tong += sl; d.tier[k[1]] += sl;
    });
    var nhap = new Date(Date.now() - (3 + rnd(560)) * 86400000), iso = function (x) { return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); };
    if (rnd(4) !== 0) NGAY_TAY0[p.ma] = iso(nhap); // ngày ghi tay (Sheet chính), ~1/4 mã chưa có ngày
    if (d.tong) ton[p.ma] = d;
  });

  var users = [
    { username: 'admin', ten: 'Quản trị (thử)', role: 'admin', tenCty: '', sdt: '', diaChi: '', khoa: false, coMatKhau: true },
    { username: 'nv', ten: 'Nhân viên (thử)', role: 'nv', tenCty: '', sdt: '', diaChi: '', khoa: false, coMatKhau: true },
    { username: 'daily', ten: 'Đại lý (thử)', role: 'khachhang', tenCty: 'Cửa hàng VLXD Mẫu', sdt: '', diaChi: '', khoa: false, coMatKhau: true }
  ];
  function sao(o) { return JSON.parse(JSON.stringify(o)); }
  function tre(v) { return new Promise(function (ok) { setTimeout(function () { ok(v); }, 350); }); }

  var TEN_QUYEN = { don: 'Duyệt đơn (xác nhận / từ chối / hủy)', giao: 'Kho & giao hàng (xuất kho, đang giao, đã giao)', chua: 'Duyệt chừa hàng / gia hạn / nhả hàng', coc: 'Ghi tiền cọc', ghichu: 'Ghi chú nội bộ', baogia: 'Soạn báo giá (tạo, sửa, xóa, in)', nhapgia: 'Nhập / sửa giá', sanpham: 'Thêm / sửa sản phẩm (mã mới, thông tin, ảnh)', nhapton: 'Nhập tồn kho (mở quyền sửa Sheet Tồn kho)', baocao: 'Xem báo cáo doanh số', nhatky: 'Xem nhật ký thao tác' };
  var gmailNV = {};
  var TT_TEN = { moi: 'Mới – chờ duyệt', giu: 'Đang chừa hàng', xacnhan: 'Đã xác nhận', danggiao: 'Đang giao', dagiao: 'Đã giao', huy: 'Đã hủy', tuchoi: 'Từ chối' };
  var quyenNV = { nv: [] };
  function quyenCua(s) { return !s ? [] : s.role === 'admin' ? Object.keys(TEN_QUYEN) : s.role === 'nv' ? (quyenNV[s.username] || []) : []; }
  function coQ(s, q) { return quyenCua(s).indexOf(q) >= 0; }
  var nhatKy = [
    { luc: '2026-11-03T16:02:00+07:00', user: 'admin', role: 'admin', hd: 'Cập nhật đơn', ma: 'HN261103-004', ct: 'Đã xác nhận → Đã giao' },
    { luc: '2026-11-04T09:12:00+07:00', user: 'daily', role: 'khachhang', hd: 'Gửi đơn', ma: 'HN261104-007', ct: '1 mã · 9.216.000đ' },
    { luc: '2026-11-05T07:40:00+07:00', user: 'admin', role: 'admin', hd: 'Đăng nhập', ma: '', ct: '' }
  ];
  function ghiNK(s, hd, ma, ct) { nhatKy.push({ luc: new Date().toISOString(), user: s ? s.username : '', role: s ? s.role : '', hd: hd, ma: ma || '', ct: ct || '' }); }
  // Ảnh thử: mượn vài ảnh gạch thật của Hiển Nga (Drive công khai) cho 8 mã gạch đầu
  var ANH_THU = ["https://drive.google.com/thumbnail?id=1dXrB9N7749ZEY7FeuDiO298vNCrVYREg&sz=w1000","https://drive.google.com/thumbnail?id=11JAdy2GwRvYBW3Q__J7NIROVY7HOuhP1&sz=w1000","https://drive.google.com/thumbnail?id=11JAdy2GwRvYBW3Q__J7NIROVY7HOuhP1&sz=w1000","https://drive.google.com/thumbnail?id=1dXrB9N7749ZEY7FeuDiO298vNCrVYREg&sz=w1000","https://drive.google.com/thumbnail?id=11JAdy2GwRvYBW3Q__J7NIROVY7HOuhP1&sz=w1000","https://drive.google.com/thumbnail?id=1NhbgHHZukm4-3pDO_68evcm0sGsD5PgH&sz=w1000","https://drive.google.com/thumbnail?id=1NhbgHHZukm4-3pDO_68evcm0sGsD5PgH&sz=w1000","https://drive.google.com/thumbnail?id=1NhbgHHZukm4-3pDO_68evcm0sGsD5PgH&sz=w1000"];
  window.DEMO_API = function (action, p, sess) {
    if (action === 'getAll') {
      var ds = sao(data);
      ds.forEach(function (x) { var m = String(x.dg).match(/(\d+) viên\/thùng · ([\d.]+) m²/); if (x.dvt === 'm²' && m) { var mv = Number(m[2]) / Number(m[1]); x.m2Vien = Math.round(mv * 10000) / 10000; if (x.ny) { x.nyV = Math.round(x.ny * mv / 100) * 100; x.nyVTu = 1; } if (x.dl) { x.dlV = Math.round(x.dl * mv / 100) * 100; x.dlVTu = 1; } } });
      if (!sess) ds.forEach(function (x) { x.dl = 0; x.dlV = 0; });
      return tre({ status: 'ok', data: ds, luc: new Date().toISOString(), capNhat: '2026-11-05T08:00:00+07:00', daDangNhap: !!sess, chuaCfg: sess ? sao(chuaCfg) : [], anh: (function () { var o = {}; ds.filter(function (x) { return x.nhom === 'Gạch'; }).forEach(function (x, i) { o[x.ma] = [ANH_THU[i % ANH_THU.length]]; }); return o; })() });
    }
    if (action === 'getTonKho') {
      if (!sess) return tre({ status: 'error', msg: 'need_login' });
      var t = sao(ton), giu = {};
      dcDemo.filter(function (x) { return x.tt === 'dang'; }).forEach(function (x) { var d = t[x.ma]; if (!d) { if (x.lech <= 0) return; d = t[x.ma] = { tong: 0, dvt: x.dv, tier: { nhanh: 0, mai: 0, cho: 0 }, kho: [] }; } var tr = d.tong; d.tong = Math.max(0, tr + x.lech); var dl = d.tong - tr; if (dl >= 0) d.tier.nhanh += dl; else { var cn = -dl; ['nhanh', 'mai', 'cho'].forEach(function (k) { var b = Math.min(d.tier[k], cn); d.tier[k] -= b; cn -= b; }); } d.dc = { id: x.id, pm: tr, lech: x.lech, lyDo: x.lyDo, ghiChu: x.ghiChu, nguoi: x.nguoi, luc: x.luc }; });
      var giuDs = {};
      donDemo.forEach(function (d) { if (['moi', 'giu', 'xacnhan', 'danggiao'].indexOf(d.tt) >= 0) d.items.forEach(function (x) { giu[x.ma] = (giu[x.ma] || 0) + x.sl; (giuDs[x.ma] = giuDs[x.ma] || []).push({ don: d.ma, ten: d.nguoiTao || d.user, kh: d.chuaCho, ch: d.ten, loai: d.loai, tt: d.tt, han: d.han, sl: x.sl, dv: x.dv }); }); });
      Object.keys(giu).forEach(function (m) {
        var d = t[m]; if (!d) return;
        d.tonGoc = d.tong; d.giu = giu[m]; d.giuDs = giuDs[m]; d.tong = Math.max(0, d.tong - giu[m]);
        var con = giu[m]; ['nhanh', 'mai', 'cho'].forEach(function (k) { var b = Math.min(d.tier[k], con); d.tier[k] -= b; con -= b; });
        if (sess.role === 'khachhang') { delete d.giu; delete d.tonGoc; }
      });
      if (sess.role === 'khachhang') Object.keys(t).forEach(function (m) {
        var d = t[m], c = function (n) { return Math.min(n, 51); };
        t[m] = { tong: c(d.tong), dvt: d.dvt, tier: { nhanh: c(d.tier.nhanh), mai: c(d.tier.mai), cho: c(d.tier.cho) } };
      });
      if (sess.role !== 'khachhang') Object.keys(t).forEach(function (m) { apNgayDemo(t[m], m); });
      return tre({ status: 'ok', data: t, luc: new Date().toISOString() });
    }
    // Sửa tồn / kiểm kho (giả, trong bộ nhớ)
    if (action === 'dsDieuChinh') { if (!coQ(sess, 'nhapton')) return tre({ status: 'error', msg: 'forbidden' }); var dd0 = sao(dcDemo).reverse(); dd0.forEach(function (x) { x.pmNay = ton[x.ma] ? Math.round(ton[x.ma].tong * 1000) / 1000 : 0; }); return tre({ status: 'ok', dang: dd0.filter(function (x) { return x.tt === 'dang'; }), lichSu: dd0.filter(function (x) { return x.tt !== 'dang'; }) }); }
    if (action === 'luuDieuChinh') {
      if (!coQ(sess, 'nhapton')) return tre({ status: 'error', msg: 'forbidden' });
      var pmD = ton[p.ma] ? Math.round(ton[p.ma].tong * 1000) / 1000 : 0, thD = Number(p.thuc), lD = Math.round((thD - pmD) * 1000) / 1000;
      if (!p.lyDo) return tre({ status: 'error', msg: 'Chọn lý do lệch.' }); if (!lD) return tre({ status: 'error', msg: 'Số thực tế bằng số trên phần mềm – không lệch.' });
      dcDemo.forEach(function (x) { if (x.ma === p.ma && x.tt === 'dang') { x.tt = 'thay'; x.nguoiXL = sess.username; x.lucXL = new Date().toISOString(); } });
      var gD = data.filter(function (x) { return x.ma === p.ma; })[0], idD = 'DC261125-' + ('00' + (dcDemo.length + 1)).slice(-3);
      dcDemo.push({ id: idD, ma: p.ma, ten: gD ? gD.ten : '', pm: pmD, thuc: thD, lech: lD, dv: ton[p.ma] ? ton[p.ma].dvt : (gD ? gD.dvt : ''), lyDo: p.lyDo, ghiChu: p.ghiChu || '', nguoi: sess.username, luc: new Date().toISOString(), tt: 'dang' });
      ghiNK(sess, 'Sửa tồn (kiểm kho)', idD, p.ma); return tre({ status: 'ok', ma: idD, lech: lD, msg: 'Đã sửa tồn ' + p.ma + ': ' + pmD + ' → ' + thD + ' (' + (lD > 0 ? '+' : '') + lD + ')' });
    }
    if (action === 'xongDieuChinh') { if (!coQ(sess, 'nhapton')) return tre({ status: 'error', msg: 'forbidden' }); var xD = dcDemo.filter(function (x) { return x.id === p.id; })[0]; if (!xD || xD.tt !== 'dang') return tre({ status: 'error', msg: 'Lần sửa này đã kết thúc.' }); xD.tt = p.kieu === 'huy' ? 'huy' : 'pm'; xD.nguoiXL = sess.username; xD.lucXL = new Date().toISOString(); return tre({ status: 'ok', msg: xD.tt === 'pm' ? 'Đã kết thúc – app theo số phần mềm cho ' + xD.ma : 'Đã hủy lần sửa tồn ' + xD.ma }); }
    // Phiếu nhập kho (giả, trong bộ nhớ)
    if (action === 'dsPhieuNhap') return tre(coQ(sess, 'nhapton') ? { status: 'ok', data: sao(phieuDemo).sort(function (a, b) { return a.ngay < b.ngay ? 1 : -1; }), ngayTay: sao(ngayTayDemo) } : { status: 'error', msg: 'forbidden' });
    if (action === 'luuPhieuNhap') {
      if (!coQ(sess, 'nhapton')) return tre({ status: 'error', msg: 'forbidden' });
      if (!p.ngay) return tre({ status: 'error', msg: 'Chọn ngày nhập.' });
      var gop = {}; (p.items || []).forEach(function (x) { if (Number(x.sl) > 0) gop[x.ma] = (gop[x.ma] || 0) + Number(x.sl); });
      if (!Object.keys(gop).length) return tre({ status: 'error', msg: 'Phiếu chưa có mặt hàng nào (số lượng > 0).' });
      var hangPN = function (ma) { var g = data.filter(function (x) { return x.ma === ma; })[0], d = ton[ma]; return { ten: g ? g.ten : '', dv: d ? d.dvt : g && g.dvt === 'm²' ? 'thùng' : g ? g.dvt : '' }; };
      var soPN = p.ma || 'NK261117-' + ('00' + (phieuDemo.length + 1)).slice(-3), pn = { ma: soPN, ngay: p.ngay, kho: p.kho || '', ncc: p.ncc || '', ghiChu: p.ghiChu || '', nguoi: sess.username, luc: new Date().toISOString(),
        items: Object.keys(gop).map(function (ma) { var h = hangPN(ma); return { ma: ma, ten: h.ten, sl: gop[ma], dv: h.dv }; }) };
      phieuDemo = phieuDemo.filter(function (x) { return x.ma !== soPN; }); phieuDemo.push(pn); ghiNK(sess, p.ma ? 'Sửa phiếu nhập kho' : 'Lập phiếu nhập kho', soPN, pn.items.length + ' mã');
      return tre({ status: 'ok', ma: soPN, msg: (p.ma ? 'Đã lưu phiếu ' : 'Đã lập phiếu ') + soPN });
    }
    if (action === 'xoaPhieuNhap') { if (!coQ(sess, 'nhapton')) return tre({ status: 'error', msg: 'forbidden' }); phieuDemo = phieuDemo.filter(function (x) { return x.ma !== p.ma; }); return tre({ status: 'ok', msg: 'Đã xóa phiếu ' + p.ma }); }
    if (action === 'ghiNgayNhap') { if (!coQ(sess, 'nhapton')) return tre({ status: 'error', msg: 'forbidden' }); if (p.ngay) ngayTayDemo[p.ma] = p.ngay; else delete ngayTayDemo[p.ma]; return tre({ status: 'ok', msg: p.ngay ? 'Đã ghi ngày nhập ' + p.ma : 'Đã xóa ngày ghi tay ' + p.ma }); }
    if (action === 'login') {
      var u = String(p.username || '').toLowerCase();
      var role = u.indexOf('admin') === 0 ? 'admin' : (u.indexOf('nv') === 0 ? 'nv' : 'khachhang');
      return tre({ status: 'ok', token: 'demo', role: role, username: u, name: u + ' (thử)', tenCty: role === 'khachhang' ? 'Cửa hàng VLXD Mẫu' : '', quyen: quyenCua({ role: role, username: u }) });
    }
    if (action === 'listUsers') return tre(sess && sess.role === 'admin' ? { status: 'ok', data: sao(users) } : { status: 'error', msg: 'forbidden' });
    if (action === 'luuUser') {
      if (!sess || sess.role !== 'admin') return tre({ status: 'error', msg: 'forbidden' });
      var cu = users.filter(function (x) { return x.username === p.username; })[0];
      var moi = { username: p.username, ten: p.ten, role: p.role, tenCty: p.tenCty, sdt: p.sdt, diaChi: p.diaChi, khoa: !!p.khoa, coMatKhau: true };
      if (cu) users[users.indexOf(cu)] = moi; else users.push(moi);
      return tre({ status: 'ok', msg: (cu ? 'Đã cập nhật ' : 'Đã tạo ') + p.username + ' (thử, không lưu thật)' });
    }
    // Đơn hàng (giả, chỉ trong bộ nhớ)
    if (action === 'taoDon') {
      if (!sess) return tre({ status: 'error', msg: 'need_login' });
      var tong = 0, its = (p.items || []).map(function (x) {
        var g = data.filter(function (d) { return d.ma === x.ma; })[0], qd = String(g.dg).match(/([\d.]+) m²/), m2 = g.dvt === 'm²' && qd ? Number(qd[1]) : 0;
        var dg = g.dl || g.ny, luong = m2 ? x.sl * m2 : x.sl, t = Math.round(luong * dg); tong += t;
        return { ma: g.ma, ten: g.ten, sl: x.sl, dv: m2 ? 'thùng' : g.dvt, qd: m2 ? (Math.round(luong * 100) / 100) + ' m²' : '', dongia: dg, tien: t };
      });
      var ma = 'HN261105-' + ('00' + (donDemo.length + 1)).slice(-3), chua = p.loai === 'chua', cfg = chuaCfg.filter(function (c) { return c.ngay === Number(p.soNgay); })[0];
      if (chua && !cfg) return tre({ status: 'error', msg: 'Số ngày chừa không hợp lệ.' });
      donDemo.unshift({ ma: ma, ngay: new Date().toISOString(), tt: 'moi', user: sess.username, ten: p.tenKH, sdt: p.sdt, hinhThuc: p.hinhThuc === 'nhan' ? 'Nhận tại kho' : 'Giao tận nơi',
        diaChi: p.diaChi, ngayCan: p.ngayCan, ghiChu: p.ghiChu, tong: tong, items: its, xuLy: '', ghiChuNB: '',
        loai: chua ? 'chua' : '', chuaCho: chua ? String(p.chuaCho || '').trim() : '', nguoiTao: (sess.name || sess.username).replace(' (thử)', ''), soNgay: chua ? cfg.ngay : 0, coc: chua && cfg.coc ? Math.round(tong * cfg.coc / 100000) * 1000 : 0, daCoc: 0, han: '', xinGH: 0 });
      ghiNK(sess, chua ? 'Gửi yêu cầu chừa hàng' : 'Gửi đơn', ma, its.length + ' mã');
      return tre({ status: 'ok', ma: ma, tong: tong });
    }
    if (action === 'donCuaToi') return tre({ status: 'ok', data: sao(donDemo.filter(function (d) { return d.user === (sess && sess.username); })) });
    if (action === 'dsDon') {
      if (!sess || (sess.role !== 'admin' && sess.role !== 'nv')) return tre({ status: 'error', msg: 'forbidden' });
      var dem = { moi: 0, giu: 0, xacnhan: 0, danggiao: 0, dagiao: 0, huy: 0, tuchoi: 0, hetHan: 0, xinGH: 0 };
      donDemo.forEach(function (d) { dem[d.tt]++; if (d.tt === 'giu' && d.han && new Date(d.han) < new Date()) dem.hetHan++; if (d.tt === 'giu' && d.xinGH) dem.xinGH++; });
      return tre({ status: 'ok', data: sao(donDemo.filter(function (d) { return !p.tt || d.tt === p.tt; })), dem: dem, chuaCfg: sao(chuaCfg), quyen: quyenCua(sess), tenQuyen: TEN_QUYEN });
    }
    if (action === 'capNhatDon') {
      var dd = donDemo.filter(function (d) { return d.ma === p.ma; })[0];
      if (!dd) return tre({ status: 'error', msg: 'Không thấy đơn' });
      var noiBo = sess.role === 'admin' || sess.role === 'nv';
      if (!noiBo && !(dd.user === sess.username && p.tt === 'huy' && dd.tt === 'moi')) return tre({ status: 'error', msg: 'forbidden' });
      var qTT = p.tt === 'giu' || dd.tt === 'giu' || (dd.loai === 'chua' && ['moi', 'huy', 'tuchoi'].indexOf(dd.tt) >= 0) ? 'chua' : ((p.tt === 'danggiao' || p.tt === 'dagiao') && (dd.tt === 'xacnhan' || dd.tt === 'danggiao')) ? 'giao' : 'don';
      if (p.tt === 'danggiao' && p.nguoiGiao) dd.nguoiGiao = p.nguoiGiao;
      if (p.tt === 'dagiao') dd.ngayGiao = new Date().toISOString();
      var can = function (q) { return tre({ status: 'error', msg: 'Tài khoản chưa có quyền: ' + TEN_QUYEN[q] }); };
      if (noiBo && p.tt && p.tt !== dd.tt && !coQ(sess, qTT)) return can(qTT);
      if (noiBo && (p.giaHan || p.boXin) && !coQ(sess, 'chua')) return can('chua');
      if (noiBo && p.ghiChuNB !== undefined && p.ghiChuNB !== dd.ghiChuNB && !coQ(sess, 'ghichu')) return can('ghichu');
      ghiNK(sess, noiBo ? 'Cập nhật đơn' : 'Đại lý tự hủy đơn', dd.ma, (p.tt && p.tt !== dd.tt ? TT_TEN[dd.tt] + ' → ' + TT_TEN[p.tt] : '') + (p.giaHan ? ' gia hạn +' + p.giaHan + ' ngày' : ''));
      if (p.tt === 'giu' && dd.loai !== 'chua') return tre({ status: 'error', msg: 'Đơn này không phải yêu cầu chừa hàng.' });
      var hanMoi = function (tu, n) { var x = new Date(tu.getTime() + n * 86400000); x.setHours(23, 59, 0, 0); return x.toISOString(); };
      if (p.tt && p.tt !== dd.tt) { dd.tt = p.tt; if (p.tt === 'giu') dd.han = hanMoi(new Date(), dd.soNgay || 3); }
      if (p.giaHan) { var tu = dd.han && new Date(dd.han) > new Date() ? new Date(dd.han) : new Date(); dd.han = hanMoi(tu, Number(p.giaHan)); dd.soNgay += Number(p.giaHan); dd.xinGH = 0; }
      if (p.boXin) dd.xinGH = 0;
      if (p.coc !== undefined && p.coc !== '') dd.coc = Number(p.coc) || 0;
      if (p.daCoc !== undefined && p.daCoc !== '') dd.daCoc = Number(p.daCoc) || 0;
      if (p.chuaCho !== undefined && dd.loai === 'chua') { if (noiBo && !coQ(sess, 'chua') && p.chuaCho !== (dd.chuaCho || '')) return can('chua'); dd.chuaCho = p.chuaCho; }
      dd.xuLy = sess.username; if (p.ghiChuNB !== undefined) dd.ghiChuNB = p.ghiChuNB;
      return tre({ status: 'ok', msg: 'Đã cập nhật' + (dd.tt === 'giu' && dd.han ? ' – giữ tới ' + new Date(dd.han).toLocaleDateString('vi-VN') : '') });
    }
    if (action === 'xinGiaHan') {
      var dx = donDemo.filter(function (d) { return d.ma === p.ma && d.user === (sess && sess.username); })[0];
      if (!dx || dx.tt !== 'giu') return tre({ status: 'error', msg: 'Chỉ xin gia hạn được đơn đang chừa hàng.' });
      dx.xinGH = Number(p.soNgay) || 0; ghiNK(sess, 'Xin gia hạn chừa hàng', dx.ma, 'thêm ' + dx.xinGH + ' ngày');
      return tre({ status: 'ok', msg: 'Đã gửi xin gia hạn ' + dx.xinGH + ' ngày – chờ công ty duyệt' });
    }
    if (action === 'nhatKy') {
      if (!sess || (sess.role !== 'admin' && sess.role !== 'nv') || (!p.maDon && !coQ(sess, 'nhatky'))) return tre({ status: 'error', msg: 'forbidden' });
      return tre({ status: 'ok', data: sao(nhatKy.filter(function (x) { return !p.maDon || x.ma === p.maDon; })).reverse() });
    }
    if (action === 'dsNhanVien') {
      if (!sess || sess.role !== 'admin') return tre({ status: 'error', msg: 'forbidden' });
      return tre({ status: 'ok', tenQuyen: TEN_QUYEN, data: users.filter(function (u) { return u.role !== 'khachhang'; }).map(function (u) { var x = sao(u); x.quyen = quyenCua({ role: u.role, username: u.username }); x.gmail = gmailNV[u.username] || ''; return x; }) });
    }
    if (action === 'luuQuyen') {
      if (!sess || sess.role !== 'admin') return tre({ status: 'error', msg: 'forbidden' });
      quyenNV[p.username] = String(p.quyen || '').split(',').filter(function (k) { return TEN_QUYEN[k]; }); gmailNV[p.username] = p.gmail || '';
      ghiNK(sess, 'Đổi quyền nhân viên', '', p.username + ': ' + (quyenNV[p.username].join(', ') || 'chỉ xem'));
      return tre({ status: 'ok', msg: 'Đã lưu quyền cho ' + p.username + ' (thử)' });
    }
    if (action === 'suaGia') {
      if (!coQ(sess, 'nhapgia')) return tre({ status: 'error', msg: 'forbidden' });
      var gg = data.filter(function (x) { return x.ma === p.ma; })[0]; if (!gg) return tre({ status: 'error', msg: 'Không thấy mã ' + p.ma });
      if (p.ny) gg.ny = Number(p.ny); if (p.dl) gg.dl = Number(p.dl);
      ghiNK(sess, 'Sửa giá', '', p.ma + ': NY ' + gg.ny + ' · ĐL ' + gg.dl);
      return tre({ status: 'ok', msg: 'Đã lưu giá ' + p.ma + ' (thử)' });
    }
    if (action === 'docSanPham' || action === 'luuSanPham') {
      if (!coQ(sess, 'sanpham')) return tre({ status: 'error', msg: 'forbidden' });
      var sp = data.filter(function (x) { return x.ma.toUpperCase() === String(p.ma).toUpperCase(); })[0] || (action === 'luuSanPham' && p.an === false ? spAnDemo.filter(function (x) { return x.ma === p.ma; })[0] : null);
      if (action === 'docSanPham') return tre(sp ? { status: 'ok', data: Object.assign({ tenHien: '', an: false, anh: '', maKho: '' }, sao(sp), { ten: sp.ten }) } : { status: 'error', msg: 'Không thấy mã ' + p.ma });
      var f = p.f || {};
      if (p.moi) {
        if (sp) return tre({ status: 'error', msg: 'Mã ' + p.ma + ' đã có trong bảng giá – dùng "Sửa".' });
        sp = { ma: p.ma, hang: '', nhom: '', ten: '', kc: '', loai: '', dvt: '', dg: '', ny: 0, dl: 0 }; data.push(sp);
      } else if (!sp) return tre({ status: 'error', msg: 'Không thấy mã ' + p.ma });
      Object.keys(f).forEach(function (k) { sp[k] = k === 'ny' || k === 'dl' ? Number(f[k]) || 0 : k === 'kg' ? (parseFloat(String(f[k]).replace(',', '.')) || '') : f[k]; });
      if (f.tenHien) sp.ten = f.tenHien;
      if (p.an === true || p.an === 'true') { data = data.filter(function (x) { return x.ma !== sp.ma; }); spAnDemo.unshift(Object.assign({}, sp, { an: true })); }
      if ((p.an === false || p.an === 'false') && spAnDemo.some(function (x) { return x.ma === p.ma; })) { var h0 = spAnDemo.filter(function (x) { return x.ma === p.ma; })[0]; spAnDemo = spAnDemo.filter(function (x) { return x !== h0; }); delete h0.an; data.push(h0); }
      ghiNK(sess, p.moi ? 'Thêm sản phẩm' : 'Sửa sản phẩm', '', p.ma + ': ' + Object.keys(f).join(', '));
      return tre({ status: 'ok', msg: (p.moi ? 'Đã thêm mã ' : 'Đã lưu mã ') + p.ma + ' (thử)' });
    }
    if (action === 'xoaDon') { if (!sess || sess.role !== 'admin') return tre({ status: 'error', msg: 'forbidden' }); var dsX = p.ds || [], truoc = donDemo.length, giuX = donDemo.filter(function (d) { return dsX.indexOf(d.ma) >= 0 && ['moi', 'giu', 'xacnhan', 'danggiao'].indexOf(d.tt) >= 0; }).length;
      for (var iX = donDemo.length - 1; iX >= 0; iX--) if (dsX.indexOf(donDemo[iX].ma) >= 0) donDemo.splice(iX, 1);
      var nX = truoc - donDemo.length; if (!nX) return tre({ status: 'error', msg: 'Không thấy đơn đã chọn' }); ghiNK(sess, 'Xóa đơn', '', 'Xóa ' + nX + ' đơn: ' + dsX.join(', '));
      return tre({ status: 'ok', so: nX, traHang: giuX, msg: 'Đã xóa ' + nX + ' đơn' + (giuX ? ' – trả lại hàng giữ của ' + giuX + ' đơn chưa xuất' : '') }); }
    if (action === 'xoaHetDon') { if (!sess || sess.role !== 'admin') return tre({ status: 'error', msg: 'forbidden' }); var n0 = donDemo.length; donDemo.length = 0; ghiNK(sess, 'Xóa toàn bộ đơn hàng', '', n0 + ' đơn'); return tre({ status: 'ok', msg: 'Đã xóa ' + n0 + ' đơn hàng (thử)' }); }
    if (action === 'dsSanPhamAn') return tre(coQ(sess, 'sanpham') ? { status: 'ok', data: sao(spAnDemo) } : { status: 'error', msg: 'forbidden' });
    if (action === 'dsBaoGia') return tre(coQ(sess, 'baogia') ? { status: 'ok', data: sao(bgDemo) } : { status: 'error', msg: 'forbidden' });
    if (action === 'luuBaoGia') {
      if (!coQ(sess, 'baogia')) return tre({ status: 'error', msg: 'forbidden' });
      if (!p.khach) return tre({ status: 'error', msg: 'Nhập tên khách hàng.' });
      var its0 = (p.items || []).map(function (x) { return Object.assign({}, x, { tien: Math.round(x.sl * x.donGia) }); }), tam0 = its0.reduce(function (s, x) { return s + x.tien; }, 0);
      var cu0 = bgDemo.filter(function (x) { return x.ma === p.ma; })[0], ma0 = cu0 ? cu0.ma : 'BG261116-' + ('00' + (++soBG)).slice(-3);
      var bg0 = { ma: ma0, ngay: cu0 ? cu0.ngay : new Date().toISOString(), capNhat: new Date().toISOString(), nguoiTao: cu0 ? cu0.nguoiTao : sess.username, tt: p.tt || 'nhap', khach: p.khach, sdt: p.sdt || '', diaChi: p.diaChi || '',
        loaiGia: p.loaiGia, tamTinh: tam0, ck: Number(p.ck) || 0, tong: Math.round(tam0 * (1 - (Number(p.ck) || 0) / 100)), hieuLuc: p.hieuLuc || '', ghiChu: p.ghiChu || '', items: its0 };
      if (cu0) bgDemo[bgDemo.indexOf(cu0)] = bg0; else bgDemo.unshift(bg0);
      ghiNK(sess, cu0 ? 'Sửa báo giá' : 'Tạo báo giá', ma0, p.khach);
      return tre({ status: 'ok', ma: ma0, tong: bg0.tong, msg: (cu0 ? 'Đã lưu báo giá ' : 'Đã tạo báo giá ') + ma0 + ' (thử)' });
    }
    if (action === 'xoaBaoGia') {
      if (!coQ(sess, 'baogia')) return tre({ status: 'error', msg: 'forbidden' });
      bgDemo = bgDemo.filter(function (x) { return x.ma !== p.ma; }); ghiNK(sess, 'Xóa báo giá', p.ma, '');
      return tre({ status: 'ok', msg: 'Đã xóa báo giá ' + p.ma + ' (thử)' });
    }
    if (action === 'maKhoThieuGia') {
      if (!coQ(sess, 'sanpham')) return tre({ status: 'error', msg: 'forbidden' });
      var co = {}; data.forEach(function (x) { co[x.ma] = 1; });
      return tre({ status: 'ok', nhom: ['Gạch', 'Thiết bị vệ sinh', 'Thiết bị nhà bếp'], hang: ['Hãng Mẫu A', 'Hãng Mẫu B', 'Inax', 'Viglacera'], data: [
        { ma: 'TBL284V', ten: 'Lavabo Inax treo L284V - màu trắng', dvt: 'cái', dg: '', kc: '', nhom: 'Thiết bị vệ sinh', hang: 'Inax', ton: 1, kho: ['K1'] },
        { ma: 'TBV23', ten: 'Lavabo Viglacera V23', dvt: 'cái', dg: '', kc: '', nhom: 'Thiết bị vệ sinh', hang: 'Viglacera', ton: 2, kho: ['K1', 'K2'] },
        { ma: 'TBSQG612', ten: 'TỦ BASIC QG612', dvt: 'bộ', dg: '', kc: '', nhom: 'Thiết bị vệ sinh', hang: '', ton: 1, kho: ['K1'] },
        { ma: 'WBLDSH', ten: 'WB lẩu điện Sunhouse', dvt: 'cái', dg: '', kc: '', nhom: '', hang: '', ton: 0, kho: ['K1'] },
        { ma: 'GTDS3023', ten: 'Gạch TĐ 30x30 S3023 (12v/th)', dvt: 'm²', dg: '12 viên/thùng · 1,08 m²/thùng', kc: '30x30', nhom: 'Gạch', hang: '', ton: -8.333, kho: ['K2'] }
      ].filter(function (x) { return !co[x.ma]; }) });
    }
    if (action === 'themHangLoat') {
      if (!coQ(sess, 'sanpham')) return tre({ status: 'error', msg: 'forbidden' });
      var nThem = 0; (p.ds || []).forEach(function (x) { if (!data.some(function (y) { return y.ma === x.ma; })) { data.push({ ma: x.ma, hang: x.hang, nhom: x.nhom, ten: x.ten, kc: x.kc, dvt: x.dvt, dg: x.dg, ny: 0, dl: 0 }); nThem++; } });
      ghiNK(sess, 'Thêm sản phẩm hàng loạt', '', nThem + ' mã');
      return tre({ status: 'ok', them: nThem, boQua: 0, msg: 'Đã thêm ' + nThem + ' mã vào bảng giá (thử)' });
    }
    if (action === 'thongTinTon') return tre(coQ(sess, 'nhapton') ? { status: 'ok', link: 'https://docs.google.com/spreadsheets/', tab: 'TỒN TỔNG HỢP (thử)', luc: '✅ App đã đọc (dữ liệu thử)' } : { status: 'error', msg: 'forbidden' });
    if (action === 'lamMoiTon') return tre(coQ(sess, 'nhapton') ? { status: 'ok', msg: 'App sẽ đọc tồn kho mới ở lần tải tới (thử)' } : { status: 'error', msg: 'forbidden' });
    if (action === 'baoCao') {
      if (!coQ(sess, 'baocao')) return tre({ status: 'error', msg: 'forbidden' });
      var nhomCua = {}; data.forEach(function (g) { nhomCua[g.ma] = g.nhom; });
      var kq = { soDon: 0, doanhSo: 0, daGiao: 0, choDuyet: 0, huy: 0, tuChoi: 0, soChua: 0, cocDaNhan: 0, theoNgay: {}, daiLy: {}, hang: {}, nhom: {} };
      // Thêm đơn giả rải rác 60 ngày cho biểu đồ có hình (chỉ trong báo cáo thử).
      var ds = donDemo.slice(), r = 7;
      for (var i = 0; i < 60; i++) { r = (r * 9301 + 49297) % 233280; if (r % 3) continue; var ng = new Date(Date.now() - i * 86400000), g = data[r % data.length], sl = 1 + r % 20;
        ds.push({ ngay: ng.toISOString(), tt: ['dagiao', 'xacnhan', 'dagiao', 'huy'][r % 4], user: 'daily' + (r % 4), ten: ['VLXD Minh Phát', 'VLXD Hòa Bình', 'Cửa hàng Mẫu', 'VLXD Phú Tân'][r % 4], tong: sl * (g.dl || g.ny), loai: '', items: [{ ma: g.ma, ten: g.ten, sl: sl, dv: g.dvt, tien: sl * (g.dl || g.ny) }] }); }
      ds.forEach(function (d) {
        var ngay = d.ngay.slice(0, 10); if (ngay < p.tu || ngay > p.den) return;
        kq.soDon++; if (d.tt === 'moi') kq.choDuyet++; if (d.tt === 'huy') kq.huy++; if (d.tt === 'tuchoi') kq.tuChoi++; if (d.loai === 'chua') kq.soChua++; kq.cocDaNhan += d.daCoc || 0;
        var n = kq.theoNgay[ngay] || (kq.theoNgay[ngay] = { ngay: ngay, soDon: 0, doanhSo: 0 }); n.soDon++;
        if (['xacnhan', 'danggiao', 'dagiao'].indexOf(d.tt) < 0) return;
        kq.doanhSo += d.tong; n.doanhSo += d.tong; if (d.tt === 'dagiao') kq.daGiao += d.tong;
        var dl = kq.daiLy[d.user] || (kq.daiLy[d.user] = { user: d.user, ten: d.ten, soDon: 0, doanhSo: 0 }); dl.soDon++; dl.doanhSo += d.tong;
        d.items.forEach(function (x) { var h = kq.hang[x.ma] || (kq.hang[x.ma] = { ma: x.ma, ten: x.ten, dv: x.dv, sl: 0, tien: 0 }); h.sl += x.sl; h.tien += x.tien;
          var t = nhomCua[x.ma] || 'Khác', nn = kq.nhom[t] || (kq.nhom[t] = { nhom: t, tien: 0 }); nn.tien += x.tien; });
      });
      var sx = function (o, k) { return Object.keys(o).map(function (x) { return o[x]; }).sort(function (a, b) { return b[k] - a[k]; }); };
      kq.theoNgay = Object.keys(kq.theoNgay).sort().map(function (x) { return kq.theoNgay[x]; });
      kq.daiLy = sx(kq.daiLy, 'doanhSo').slice(0, 30); kq.hang = sx(kq.hang, 'tien').slice(0, 30); kq.nhom = sx(kq.nhom, 'tien');
      return tre({ status: 'ok', tu: p.tu, den: p.den, data: kq });
    }
    return tre({ status: 'ok' });
  };
  // Ngày nhập: phiếu nhập (nhập trước bán trước) -> ghi tay -> cột Sheet (giống máy chủ)
  var phieuDemo = [], ngayTayDemo = NGAY_TAY0, dcDemo = [];
  function apNgayDemo(d, ma) {
    var ton0 = d.tonGoc !== undefined ? d.tonGoc : d.tong, ds = [];
    phieuDemo.forEach(function (p) { p.items.forEach(function (x) { if (x.ma === ma) ds.push({ ngay: p.ngay, sl: x.sl, so: p.ma }); }); });
    ds.sort(function (a, b) { return a.ngay < b.ngay ? 1 : -1; });
    var tay = ngayTayDemo[ma];
    if (!ds.length) { if (tay) { d.nhap = tay; d.nguonNhap = 'tay'; } else if (d.nhap) d.nguonNhap = 'sheet'; return; }
    var con = [], cong = 0;
    for (var i = 0; i < ds.length && cong < ton0; i++) { var sl = Math.min(ds[i].sl, ton0 - cong); cong += sl; con.push({ ngay: ds[i].ngay, sl: Math.round(sl * 1000) / 1000, so: ds[i].so }); }
    d.nhapMoi = ds[0].ngay;
    if (cong >= ton0 - 1e-9) { d.nhap = con[con.length - 1].ngay; d.nguonNhap = 'phieu'; }
    else { var nguon = tay ? 'tay' : d.nhap ? 'sheet' : 'phieu', cu = tay || d.nhap || con[con.length - 1].ngay; con.push({ ngay: cu, sl: Math.round((ton0 - cong) * 1000) / 1000, so: '', cu: 1 }); d.nhap = cu; d.nguonNhap = nguon; d.thieuPhieu = Math.round((ton0 - cong) * 1000) / 1000; }
    d.loNhap = con.slice(0, 8);
  }
  var chuaCfg = [{ ngay: 3, coc: 0 }, { ngay: 5, coc: 0 }, { ngay: 7, coc: 10 }, { ngay: 10, coc: 10 }, { ngay: 15, coc: 20 }, { ngay: 30, coc: 30 }];
  var homQua = new Date(Date.now() - 86400000); homQua.setHours(23, 59, 0, 0);
  var spAnDemo = [{ ma: 'DPHN.POLO', ten: 'Đồng phục Hiển Nga áo Polo', tenGoc: 'Đồng phục Hiển Nga áo Polo', nhom: 'Nội bộ', hang: '', kc: '', dvt: 'cái', ny: 0, dl: 0, an: true }];
  var soBG = 1, bgDemo = [{ ma: 'BG261115-001', ngay: '2026-11-15T09:00:00+07:00', capNhat: '2026-11-15T09:20:00+07:00', nguoiTao: 'admin', tt: 'dagui', khach: 'Anh Tâm – nhà phố Bình Khánh', sdt: '0912345678', diaChi: 'Bình Khánh, Long Xuyên',
    loaiGia: 'dl', tamTinh: 9400000, ck: 3, tong: 9118000, hieuLuc: '2026-11-22', ghiChu: 'Giá đã gồm VAT. Giao trong 3 ngày.', items: [{ ma: 'VS001', ten: 'Bồn cầu một khối mẫu 1', dvt: 'bộ', sl: 2, donGia: 3500000, tien: 7000000 }, { ma: 'VS004', ten: 'Lavabo đặt bàn mẫu 4', dvt: 'cái', sl: 1, donGia: 2400000, tien: 2400000 }] }];
  var donDemo = [
    { ma: 'HN261029-003', ngay: '2026-10-29T10:05:00+07:00', tt: 'giu', user: 'daily', ten: 'Cửa hàng VLXD Mẫu', sdt: '0909000111', hinhThuc: 'Nhận tại kho', diaChi: '', ngayCan: '',
      ghiChu: 'Giữ giúp cho công trình nhà anh Tâm', tong: 7000000, items: [{ ma: 'VS002', ten: 'Lavabo đặt bàn mẫu 2', sl: 2, dv: 'bộ', qd: '', dongia: 3500000, tien: 7000000 }],
      xuLy: 'admin', ghiChuNB: '', loai: 'chua', chuaCho: 'Anh Tâm – công trình Bình Khánh', nguoiTao: 'Cúc', soNgay: 7, han: homQua.toISOString(), coc: 700000, daCoc: 700000, xinGH: 0 },
    { ma: 'HN261104-007', ngay: '2026-11-04T09:12:00+07:00', tt: 'moi', user: 'daily', nguoiTao: 'Anh Phát', ten: 'Cửa hàng VLXD Minh Phát', sdt: '0909123456', hinhThuc: 'Giao tận nơi', diaChi: '12 Trần Hưng Đạo, Long Xuyên',
      ngayCan: '2026-11-08', ghiChu: 'Giao buổi sáng', tong: 9216000, items: [{ ma: 'GM600600003', ten: 'Gạch mẫu trơn 3', sl: 32, dv: 'thùng', qd: '46.08 m²', dongia: 200000, tien: 9216000 }], xuLy: '', ghiChuNB: '' },
    { ma: 'HN261103-004', ngay: '2026-11-03T15:40:00+07:00', tt: 'dagiao', user: 'daily2', ten: 'VLXD Hòa Bình', sdt: '0911222333', hinhThuc: 'Nhận tại kho', diaChi: '', ngayCan: '',
      ghiChu: '', tong: 3500000, items: [{ ma: 'VS001', ten: 'Bồn cầu một khối mẫu 1', sl: 1, dv: 'bộ', qd: '', dongia: 3500000, tien: 3500000 }], xuLy: 'admin', ghiChuNB: 'Đã thu tiền' }
  ];
})();
