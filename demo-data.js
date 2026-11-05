// ============================================================
// DỮ LIỆU DÙNG THỬ – HOÀN TOÀN GIẢ (tên hãng, mã, giá, tồn kho đều bịa).
// Chỉ nạp khi config.js chưa có APPS_URL hoặc địa chỉ có ?demo=1.
// Mô phỏng đúng cách máy chủ che dữ liệu theo quyền.
// ============================================================
(function () {
  var HANG = ['Hãng Mẫu A', 'Hãng Mẫu B', 'Hãng Mẫu C'];
  var KHO = [['Kho Trung tâm', 'nhanh'], ['Kho Chi nhánh', 'mai'], ['Kho Hãng', 'cho']];
  var data = [], ton = {}, seed = 7;
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
    if (d.tong) ton[p.ma] = d;
  });

  var users = [
    { username: 'admin', ten: 'Quản trị (thử)', role: 'admin', tenCty: '', sdt: '', diaChi: '', khoa: false, coMatKhau: true },
    { username: 'nv', ten: 'Nhân viên (thử)', role: 'nv', tenCty: '', sdt: '', diaChi: '', khoa: false, coMatKhau: true },
    { username: 'daily', ten: 'Đại lý (thử)', role: 'khachhang', tenCty: 'Cửa hàng VLXD Mẫu', sdt: '', diaChi: '', khoa: false, coMatKhau: true }
  ];
  function sao(o) { return JSON.parse(JSON.stringify(o)); }
  function tre(v) { return new Promise(function (ok) { setTimeout(function () { ok(v); }, 350); }); }

  window.DEMO_API = function (action, p, sess) {
    if (action === 'getAll') {
      var ds = sao(data);
      if (!sess) ds.forEach(function (x) { x.dl = 0; });
      return tre({ status: 'ok', data: ds, anh: {}, luc: new Date().toISOString(), capNhat: '2026-11-05T08:00:00+07:00', daDangNhap: !!sess });
    }
    if (action === 'getTonKho') {
      if (!sess) return tre({ status: 'error', msg: 'need_login' });
      var t = sao(ton);
      if (sess.role === 'khachhang') Object.keys(t).forEach(function (m) {
        var d = t[m], c = function (n) { return Math.min(n, 51); };
        t[m] = { tong: c(d.tong), dvt: d.dvt, tier: { nhanh: c(d.tier.nhanh), mai: c(d.tier.mai), cho: c(d.tier.cho) } };
      });
      return tre({ status: 'ok', data: t });
    }
    if (action === 'login') {
      var u = String(p.username || '').toLowerCase();
      var role = u.indexOf('admin') === 0 ? 'admin' : (u.indexOf('nv') === 0 ? 'nv' : 'khachhang');
      return tre({ status: 'ok', token: 'demo', role: role, username: u, name: u + ' (thử)', tenCty: role === 'khachhang' ? 'Cửa hàng VLXD Mẫu' : '' });
    }
    if (action === 'listUsers') return tre(sess && sess.role === 'admin' ? { status: 'ok', data: sao(users) } : { status: 'error', msg: 'forbidden' });
    if (action === 'luuUser') {
      if (!sess || sess.role !== 'admin') return tre({ status: 'error', msg: 'forbidden' });
      var cu = users.filter(function (x) { return x.username === p.username; })[0];
      var moi = { username: p.username, ten: p.ten, role: p.role, tenCty: p.tenCty, sdt: p.sdt, diaChi: p.diaChi, khoa: !!p.khoa, coMatKhau: true };
      if (cu) users[users.indexOf(cu)] = moi; else users.push(moi);
      return tre({ status: 'ok', msg: (cu ? 'Đã cập nhật ' : 'Đã tạo ') + p.username + ' (thử, không lưu thật)' });
    }
    return tre({ status: 'ok' });
  };
})();
