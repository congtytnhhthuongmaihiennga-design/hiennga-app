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

  var TEN_QUYEN = { don: 'Duyệt đơn & đổi trạng thái giao hàng', chua: 'Duyệt chừa hàng / gia hạn / nhả hàng', coc: 'Ghi tiền cọc', ghichu: 'Ghi chú nội bộ', baocao: 'Xem báo cáo doanh số', nhatky: 'Xem nhật ký thao tác' };
  var quyenNV = { nv: [] };
  function quyenCua(s) { return !s ? [] : s.role === 'admin' ? Object.keys(TEN_QUYEN) : s.role === 'nv' ? (quyenNV[s.username] || []) : []; }
  function coQ(s, q) { return quyenCua(s).indexOf(q) >= 0; }
  var nhatKy = [
    { luc: '2026-11-03T16:02:00+07:00', user: 'admin', role: 'admin', hd: 'Cập nhật đơn', ma: 'HN261103-004', ct: 'Đã xác nhận → Đã giao' },
    { luc: '2026-11-04T09:12:00+07:00', user: 'daily', role: 'khachhang', hd: 'Gửi đơn', ma: 'HN261104-007', ct: '1 mã · 9.216.000đ' },
    { luc: '2026-11-05T07:40:00+07:00', user: 'admin', role: 'admin', hd: 'Đăng nhập', ma: '', ct: '' }
  ];
  function ghiNK(s, hd, ma, ct) { nhatKy.push({ luc: new Date().toISOString(), user: s ? s.username : '', role: s ? s.role : '', hd: hd, ma: ma || '', ct: ct || '' }); }
  window.DEMO_API = function (action, p, sess) {
    if (action === 'getAll') {
      var ds = sao(data);
      if (!sess) ds.forEach(function (x) { x.dl = 0; });
      return tre({ status: 'ok', data: ds, anh: {}, luc: new Date().toISOString(), capNhat: '2026-11-05T08:00:00+07:00', daDangNhap: !!sess, chuaCfg: sess ? sao(chuaCfg) : [] });
    }
    if (action === 'getTonKho') {
      if (!sess) return tre({ status: 'error', msg: 'need_login' });
      var t = sao(ton), giu = {};
      donDemo.forEach(function (d) { if (['moi', 'giu', 'xacnhan', 'danggiao'].indexOf(d.tt) >= 0) d.items.forEach(function (x) { giu[x.ma] = (giu[x.ma] || 0) + x.sl; }); });
      Object.keys(giu).forEach(function (m) {
        var d = t[m]; if (!d) return;
        d.tonGoc = d.tong; d.giu = giu[m]; d.tong = Math.max(0, d.tong - giu[m]);
        var con = giu[m]; ['nhanh', 'mai', 'cho'].forEach(function (k) { var b = Math.min(d.tier[k], con); d.tier[k] -= b; con -= b; });
        if (sess.role === 'khachhang') { delete d.giu; delete d.tonGoc; }
      });
      if (sess.role === 'khachhang') Object.keys(t).forEach(function (m) {
        var d = t[m], c = function (n) { return Math.min(n, 51); };
        t[m] = { tong: c(d.tong), dvt: d.dvt, tier: { nhanh: c(d.tier.nhanh), mai: c(d.tier.mai), cho: c(d.tier.cho) } };
      });
      return tre({ status: 'ok', data: t, luc: new Date().toISOString() });
    }
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
        loai: chua ? 'chua' : '', soNgay: chua ? cfg.ngay : 0, coc: chua && cfg.coc ? Math.round(tong * cfg.coc / 100000) * 1000 : 0, daCoc: 0, han: '', xinGH: 0 });
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
      var qTT = p.tt === 'giu' || dd.tt === 'giu' || (dd.loai === 'chua' && ['moi', 'huy', 'tuchoi'].indexOf(dd.tt) >= 0) ? 'chua' : 'don';
      var can = function (q) { return tre({ status: 'error', msg: 'Tài khoản chưa có quyền: ' + TEN_QUYEN[q] }); };
      if (noiBo && p.tt && p.tt !== dd.tt && !coQ(sess, qTT)) return can(qTT);
      if (noiBo && (p.giaHan || p.boXin) && !coQ(sess, 'chua')) return can('chua');
      if (noiBo && p.ghiChuNB !== undefined && p.ghiChuNB !== dd.ghiChuNB && !coQ(sess, 'ghichu')) return can('ghichu');
      ghiNK(sess, noiBo ? 'Cập nhật đơn' : 'Đại lý tự hủy đơn', dd.ma, (p.tt && p.tt !== dd.tt ? dd.tt + ' → ' + p.tt : '') + (p.giaHan ? ' gia hạn +' + p.giaHan + ' ngày' : ''));
      if (p.tt === 'giu' && dd.loai !== 'chua') return tre({ status: 'error', msg: 'Đơn này không phải yêu cầu chừa hàng.' });
      var hanMoi = function (tu, n) { var x = new Date(tu.getTime() + n * 86400000); x.setHours(23, 59, 0, 0); return x.toISOString(); };
      if (p.tt && p.tt !== dd.tt) { dd.tt = p.tt; if (p.tt === 'giu') dd.han = hanMoi(new Date(), dd.soNgay || 3); }
      if (p.giaHan) { var tu = dd.han && new Date(dd.han) > new Date() ? new Date(dd.han) : new Date(); dd.han = hanMoi(tu, Number(p.giaHan)); dd.soNgay += Number(p.giaHan); dd.xinGH = 0; }
      if (p.boXin) dd.xinGH = 0;
      if (p.coc !== undefined && p.coc !== '') dd.coc = Number(p.coc) || 0;
      if (p.daCoc !== undefined && p.daCoc !== '') dd.daCoc = Number(p.daCoc) || 0;
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
      return tre({ status: 'ok', tenQuyen: TEN_QUYEN, data: users.filter(function (u) { return u.role !== 'khachhang'; }).map(function (u) { var x = sao(u); x.quyen = quyenCua({ role: u.role, username: u.username }); return x; }) });
    }
    if (action === 'luuQuyen') {
      if (!sess || sess.role !== 'admin') return tre({ status: 'error', msg: 'forbidden' });
      quyenNV[p.username] = String(p.quyen || '').split(',').filter(function (k) { return TEN_QUYEN[k]; });
      ghiNK(sess, 'Đổi quyền nhân viên', '', p.username + ': ' + (quyenNV[p.username].join(', ') || 'chỉ xem'));
      return tre({ status: 'ok', msg: 'Đã lưu quyền cho ' + p.username + ' (thử)' });
    }
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
  var chuaCfg = [{ ngay: 3, coc: 0 }, { ngay: 5, coc: 0 }, { ngay: 7, coc: 10 }, { ngay: 10, coc: 10 }, { ngay: 15, coc: 20 }, { ngay: 30, coc: 30 }];
  var homQua = new Date(Date.now() - 86400000); homQua.setHours(23, 59, 0, 0);
  var donDemo = [
    { ma: 'HN261029-003', ngay: '2026-10-29T10:05:00+07:00', tt: 'giu', user: 'daily', ten: 'Cửa hàng VLXD Mẫu', sdt: '0909000111', hinhThuc: 'Nhận tại kho', diaChi: '', ngayCan: '',
      ghiChu: 'Giữ giúp cho công trình nhà anh Tâm', tong: 7000000, items: [{ ma: 'VS002', ten: 'Lavabo đặt bàn mẫu 2', sl: 2, dv: 'bộ', qd: '', dongia: 3500000, tien: 7000000 }],
      xuLy: 'admin', ghiChuNB: '', loai: 'chua', soNgay: 7, han: homQua.toISOString(), coc: 700000, daCoc: 700000, xinGH: 0 },
    { ma: 'HN261104-007', ngay: '2026-11-04T09:12:00+07:00', tt: 'moi', user: 'daily', ten: 'Cửa hàng VLXD Minh Phát', sdt: '0909123456', hinhThuc: 'Giao tận nơi', diaChi: '12 Trần Hưng Đạo, Long Xuyên',
      ngayCan: '2026-11-08', ghiChu: 'Giao buổi sáng', tong: 9216000, items: [{ ma: 'GM600600003', ten: 'Gạch mẫu trơn 3', sl: 32, dv: 'thùng', qd: '46.08 m²', dongia: 200000, tien: 9216000 }], xuLy: '', ghiChuNB: '' },
    { ma: 'HN261103-004', ngay: '2026-11-03T15:40:00+07:00', tt: 'dagiao', user: 'daily2', ten: 'VLXD Hòa Bình', sdt: '0911222333', hinhThuc: 'Nhận tại kho', diaChi: '', ngayCan: '',
      ghiChu: '', tong: 3500000, items: [{ ma: 'VS001', ten: 'Bồn cầu một khối mẫu 1', sl: 1, dv: 'bộ', qd: '', dongia: 3500000, tien: 3500000 }], xuLy: 'admin', ghiChuNB: 'Đã thu tiền' }
  ];
})();
