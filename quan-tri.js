// ============================================================
// TRANG QUẢN TRỊ (GĐ1–GĐ3) – cho chủ doanh nghiệp / nhân viên, chạy trên máy tính (điện thoại vẫn xem được).
// Dùng chung máy chủ + tài khoản với app bảng giá.
//  GĐ1: bảng điều khiển + đơn hàng.  GĐ2: chừa hàng, cọc, gia hạn.
//  GĐ3: quyền nhân viên, nhật ký thao tác, báo cáo doanh số.
// Mọi quyền đều do MÁY CHỦ kiểm tra lại – ẩn nút ở đây chỉ để dễ dùng.
// ============================================================
(function () {
  'use strict';
  var CFG = window.APP_CONFIG || {};
  var DEMO = !CFG.APPS_URL || /[?&]demo=1/.test(location.search);
  var TEN_TT = { moi: 'Chờ duyệt', giu: 'Đang chừa hàng', xacnhan: 'Đã xác nhận', danggiao: 'Đang giao', dagiao: 'Đã giao', huy: 'Đã hủy', tuchoi: 'Từ chối' };
  var THU_TU = ['moi', 'giu', 'xacnhan', 'danggiao', 'dagiao', 'tuchoi', 'huy'];
  var TEN_QUYEN = { don: 'Duyệt đơn (xác nhận / từ chối / hủy)', giao: 'Kho & giao hàng (xuất kho, đang giao, đã giao)', chua: 'Duyệt chừa hàng / gia hạn / nhả hàng', coc: 'Ghi tiền cọc', ghichu: 'Ghi chú nội bộ', nhapgia: 'Nhập / sửa giá', sanpham: 'Thêm / sửa sản phẩm (mã mới, thông tin, ảnh)', nhapton: 'Nhập tồn kho (mở quyền sửa Sheet Tồn kho)', baocao: 'Xem báo cáo doanh số', nhatky: 'Xem nhật ký thao tác' };
  var LS = {
    get: function (k) { try { return JSON.parse(localStorage.getItem('hn_' + k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('hn_' + k, JSON.stringify(v)); } catch (e) { } }
  };
  var S = { sess: (function (s) { return s && (s.token === 'demo') === DEMO ? s : null; })(LS.get('sess')), don: [], dem: {}, trang: 'tong', loc: '', q: '', moMa: '', soMoiCu: -1,
    ton: null, chuaCfg: [], quyen: null, ls: {}, bc: { kieu: 'thangnay' }, nk: { ds: null, q: '' }, nv: null, gia: { ds: null, q: '' }, tonTT: null, sp: { q: '', nhom: '' } };
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tien(n) { return Number(n || 0).toLocaleString('vi-VN') + 'đ'; }
  function tienGon(n) { n = Number(n || 0); return n >= 1e9 ? so(Math.round(n / 1e8) / 10) + ' tỷ' : n >= 1e6 ? so(Math.round(n / 1e5) / 10) + ' tr' : n >= 1e3 ? so(Math.round(n / 1e3)) + 'k' : so(n); }
  function so(n) { return Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 }); }
  function gio(iso) { var d = new Date(iso); if (isNaN(d)) return esc(iso); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ' ' + ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2); }
  function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dmy(s) { var a = String(s).split('-'); return a.length === 3 ? a[2] + '/' + a[1] + '/' + a[0] : s; }
  function toast(m) { var t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2800); }
  function laAdmin() { return S.sess && S.sess.role === 'admin'; }
  function co(q) { return laAdmin() || (S.quyen || S.sess.quyen || []).indexOf(q) >= 0; }
  function nhanTT(tt) { return '<span class="tt tt-' + tt + '">' + (TEN_TT[tt] || tt) + '</span>'; }
  function don(ma) { return S.don.filter(function (x) { return x.ma === ma; })[0]; }

  function api(action, params, post) {
    if (DEMO) return window.DEMO_API(action, params || {}, S.sess);
    var p = { action: action, k: CFG.APP_KEY, t: (S.sess && S.sess.token) || '' };
    Object.keys(params || {}).forEach(function (k) { p[k] = params[k]; });
    var req = post ? fetch(CFG.APPS_URL, { method: 'POST', body: JSON.stringify(p) })
      : fetch(CFG.APPS_URL + '?' + Object.keys(p).map(function (k) { return k + '=' + encodeURIComponent(p[k]); }).join('&'));
    return req.then(function (r) { return r.json(); });
  }

  // ---------- Đăng nhập ----------
  function hienLogin(msg) { $('qt-app').hidden = true; $('qt-login').hidden = false; $('qt-err').textContent = msg || ''; $('qt-ten-cty').textContent = CFG.TEN_DAY_DU || ''; }
  $('qt-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var nut = $('qt-nut'); nut.disabled = true; $('qt-err').textContent = '';
    api('login', { username: $('qt-user').value.trim(), password: $('qt-pass').value }, true).then(function (r) {
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'Đăng nhập thất bại');
      if (r.role !== 'admin' && r.role !== 'nv') throw new Error('Tài khoản đại lý không vào trang quản trị được.');
      S.sess = { token: r.token, role: r.role, username: r.username, name: r.name, tenCty: r.tenCty, sdt: r.sdt || '', diaChi: r.diaChi || '', quyen: r.quyen || [] };
      S.quyen = r.quyen || null;
      LS.set('sess', S.sess); $('qt-pass').value = ''; batDau();
    }).catch(function (er) { $('qt-err').textContent = er.message; }).then(function () { nut.disabled = false; });
  });

  // ---------- Tải đơn ----------
  function taiDon(imLang) {
    return api('dsDon', {}).then(function (r) {
      if (r && r.msg === 'forbidden') { hienLogin('Tài khoản không có quyền vào trang quản trị.'); return; }
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      S.don = r.data || []; S.dem = r.dem || {}; if (r.chuaCfg) S.chuaCfg = r.chuaCfg;
      if (r.quyen) S.quyen = r.quyen;
      if (r.tenQuyen) TEN_QUYEN = r.tenQuyen;
      veMenu();
      var moi = S.dem.moi || 0;
      if (S.soMoiCu >= 0 && moi > S.soMoiCu) toast('🛒 Có ' + (moi - S.soMoiCu) + ' đơn mới');
      S.soMoiCu = moi;
      $('qt-badge').hidden = !moi; $('qt-badge').textContent = moi;
      document.title = (moi ? '(' + moi + ') ' : '') + 'Quản trị đơn hàng – ' + (CFG.TEN_APP || '');
      if (S.trang === 'tong' || S.trang === 'don' || S.trang === 'giao') ve();
      // Tự làm mới không vẽ lại ngăn chi tiết khi đang gõ (khỏi mất chữ).
      if (S.moMa && !(imLang && $('qt-ngan').contains(document.activeElement))) moDon(S.moMa);
    }).catch(function (e) { if (!imLang) toast('Không tải được đơn: ' + (e.message || e)); });
  }
  function veMenu() {
    $('qt-m-bc').hidden = !co('baocao');
    $('qt-m-nk').hidden = !co('nhatky');
    $('qt-m-nv').hidden = !laAdmin();
    $('qt-m-giao').hidden = !(co('giao') || co('don'));
    $('qt-m-gia').hidden = !co('nhapgia');
    $('qt-m-sp').hidden = !co('sanpham');
    $('qt-m-ton').hidden = !co('nhapton');
    var cg = S.don.filter(function (d) { return d.tt === 'xacnhan'; }).length;
    $('qt-badge-giao').hidden = !cg; $('qt-badge-giao').textContent = cg;
  }

  // ---------- Chừa hàng ----------
  function hetHan(d) { return d.tt === 'giu' && d.han && new Date(d.han).getTime() < Date.now(); }
  function sapHet(d) { return d.tt === 'giu' && d.han && new Date(d.han).getTime() < Date.now() + 86400000; }
  function canQuyet(d) { return sapHet(d) || (d.tt === 'giu' && d.xinGH); }
  function ngayNgan(iso) { var x = new Date(iso); return isNaN(x) ? '' : ('0' + x.getDate()).slice(-2) + '/' + ('0' + (x.getMonth() + 1)).slice(-2); }
  function conLai(iso) { var h = new Date(iso).getTime() - Date.now(); if (isNaN(h)) return ''; if (h < 0) return 'quá hạn ' + Math.ceil(-h / 86400000) + ' ngày'; var n = Math.floor(h / 86400000); return n < 1 ? 'hết hạn hôm nay' : 'còn ' + n + ' ngày'; }
  function nhanChua(d) {
    if (d.loai !== 'chua') return '';
    var s = '<br><small class="qt-chua' + (hetHan(d) ? ' het' : '') + '">🔒 Chừa ' + d.soNgay + ' ngày' + (d.tt === 'giu' && d.han ? ' · hạn ' + ngayNgan(d.han) + (hetHan(d) ? ' – HẾT HẠN' : '') : '') + '</small>';
    if (d.tt === 'giu' && d.xinGH) s += '<br><small class="qt-chua xin">⏳ Xin thêm ' + d.xinGH + ' ngày</small>';
    return s;
  }
  function taiTon() {
    if (S.ton) return Promise.resolve(S.ton);
    return api('getTonKho', {}).then(function (r) { if (r && r.status === 'ok') S.ton = r.data; return S.ton; }).catch(function () { return null; });
  }
  // "Được bán" đã trừ mọi đơn đang giữ (kể cả đơn này). Đỏ = các đơn đang giữ vượt quá tồn thực.
  function oTon(x) {
    if (!S.ton) return '<small class="mo">…</small>';
    var t = S.ton[x.ma];
    if (!t) return '<small class="qt-thieu">Không có tồn</small>';
    var thieu = t.giu && t.tonGoc !== undefined && t.giu > t.tonGoc;
    return '<small class="' + (thieu ? 'qt-thieu' : 'qt-du') + '">' + so(t.tong) + ' ' + esc(t.dvt || '') + '</small>' +
      (t.giu ? '<br><small class="' + (thieu ? 'qt-thieu' : 'mo') + '">giữ ' + so(t.giu) + (thieu ? ' > tồn ' + so(t.tonGoc) : '') + '</small>' : '');
  }

  var NUT_LM = '<button type="button" class="btn btn-vien btn-nho qt-lm" data-qt-act="lam-moi">↻ Làm mới</button>';
  // ---------- Vẽ ----------
  function ve() {
    document.querySelectorAll('[data-qt]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-qt') === S.trang); });
    var v = { don: veDon, baocao: veBaoCao, nhatky: veNhatKy, nhanvien: veNhanVien, giao: veGiao, gia: veGia, ton: veTon, sanpham: veSanPham }[S.trang] || veTong;
    $('qt-main').innerHTML = v();
    var q = $('qt-q'); if (q) { q.value = S.q; }
    if (S.trang === 'baocao' && !S.bc.kq && !S.bc.dang) taiBaoCao();
    if (S.trang === 'nhatky' && !S.nk.ds) taiNhatKy();
    if (S.trang === 'nhanvien' && !S.nv) taiNhanVien();
    if ((S.trang === 'gia' || S.trang === 'sanpham') && !S.gia.ds) taiGia();
    if (S.trang === 'ton' && !S.tonTT) taiTonTT();
  }
  function trongThang(d) { var x = new Date(d.ngay), n = new Date(); return x.getMonth() === n.getMonth() && x.getFullYear() === n.getFullYear(); }
  function veTong() {
    var homNay = new Date().toDateString();
    var nay = S.don.filter(function (d) { return new Date(d.ngay).toDateString() === homNay; });
    var thang = S.don.filter(function (d) { return trongThang(d) && ['xacnhan', 'danggiao', 'dagiao'].indexOf(d.tt) >= 0; });
    var ds = thang.reduce(function (t, d) { return t + d.tong; }, 0);
    var cho = S.don.filter(function (d) { return d.tt === 'moi'; }).slice(0, 15);
    var quyet = S.don.filter(canQuyet);
    return '<div class="qt-h1">Bảng điều khiển <small>' + esc(CFG.TEN_DAY_DU || '') + '</small>' + NUT_LM + '</div>' +
      '<div class="qt-the">' +
      '<button type="button" class="qt-so do" data-qt-loc="moi"><small>Đơn chờ duyệt</small><b>' + (S.dem.moi || 0) + '</b></button>' +
      '<button type="button" class="qt-so cam" data-qt-loc="giu"><small>Chừa hàng cần quyết (hết hạn / xin gia hạn)</small><b>' + ((S.dem.hetHan || 0) + (S.dem.xinGH || 0)) + '</b><small>đang chừa ' + (S.dem.giu || 0) + ' đơn</small></button>' +
      '<button type="button" class="qt-so c" data-qt-loc="xacnhan"><small>Đã xác nhận – chờ giao</small><b>' + ((S.dem.xacnhan || 0) + (S.dem.danggiao || 0)) + '</b></button>' +
      '<div class="qt-so"><small>Đơn hôm nay</small><b>' + nay.length + '</b></div>' +
      (co('baocao') ? '<button type="button" class="qt-so xanh" data-qt="baocao"><small>Doanh số tháng này (đơn đã xác nhận)</small><b>' + tien(ds) + '</b><small>Xem báo cáo →</small></button>' : '') + '</div>' +
      (quyet.length ? '<div class="qt-khung qt-khung-cam"><h2>🔒 Chừa hàng cần quyết – gia hạn / chuyển giao / nhả hàng</h2>' + bangDon(quyet, '') + '</div>' : '') +
      '<div class="qt-khung"><h2>Đơn chờ duyệt</h2>' + bangDon(cho, 'Không có đơn nào chờ duyệt 👍') + '</div>';
  }
  function locDon() {
    var q = S.q.trim().toLowerCase();
    return S.don.filter(function (d) {
      if (S.loc && d.tt !== S.loc) return false;
      if (!q) return true;
      return [d.ma, d.ten, d.sdt, d.user, d.diaChi].concat(d.items.map(function (x) { return x.ma; })).join(' ').toLowerCase().indexOf(q) >= 0;
    });
  }
  function veDon() {
    var ds = locDon();
    return '<div class="qt-h1">Đơn hàng <small>' + S.don.length + ' đơn gần nhất</small>' + NUT_LM + '</div>' +
      '<div class="qt-loc"><button type="button" class="chip' + (S.loc ? '' : ' on') + '" data-qt-loc="">Tất cả</button>' +
      THU_TU.map(function (t) { return '<button type="button" class="chip' + (S.loc === t ? ' on' : '') + '" data-qt-loc="' + t + '">' + TEN_TT[t] + ' <small>' + (S.dem[t] || 0) + '</small></button>'; }).join('') +
      '<input id="qt-q" type="search" placeholder="Tìm mã đơn, đại lý, SĐT, mã hàng…"></div>' +
      '<div class="qt-khung">' + bangDon(ds, 'Không có đơn phù hợp') + '</div>';
  }
  function bangDon(ds, trong) {
    if (!ds.length) return '<div class="qt-trong">' + trong + '</div>';
    return '<table class="qt-bang"><thead><tr><th>Mã đơn</th><th>Ngày đặt</th><th>Đại lý / cửa hàng</th><th class="an-dt">Giao hàng</th><th class="an-dt">Mặt hàng</th><th class="so">Tổng tiền</th><th>Trạng thái</th></tr></thead><tbody>' +
      ds.map(function (d) {
        return '<tr class="dong" data-don="' + esc(d.ma) + '"><td class="ma">' + esc(d.ma) + '</td><td>' + gio(d.ngay) + '</td><td><b>' + esc(d.ten) + '</b><br><small>' + esc(d.sdt) + ' · ' + esc(d.user) + '</small></td>' +
          '<td class="an-dt">' + esc(d.hinhThuc) + (d.ngayCan ? '<br><small>cần ' + esc(d.ngayCan) + '</small>' : '') + '</td><td class="an-dt">' + d.items.length + ' mã</td>' +
          '<td class="so">' + tien(d.tong) + '</td><td>' + nhanTT(d.tt) + nhanChua(d) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  // ---------- Chi tiết đơn ----------
  var NUT = { moi: [['xacnhan', 'Xác nhận đơn', 'btn-chinh'], ['tuchoi', 'Từ chối', 'btn-vien']],
    giu: [['xacnhan', 'Chuyển thành đơn giao', 'btn-chinh'], ['huy', 'Nhả hàng', 'btn-vien']],
    xacnhan: [['danggiao', 'Đang giao', 'btn-chinh'], ['dagiao', 'Đã giao', 'btn-xanh'], ['huy', 'Hủy đơn', 'btn-vien']],
    danggiao: [['dagiao', 'Đã giao', 'btn-xanh'], ['huy', 'Hủy đơn', 'btn-vien']], dagiao: [], huy: [['moi', 'Mở lại', 'btn-vien']], tuchoi: [['moi', 'Mở lại', 'btn-vien']] };
  // Cùng quy tắc với máy chủ: việc với đơn chừa hàng cần quyền "chua", giao hàng cần "don".
  function quyenTT(d, tt) {
    if (tt === 'giu' || d.tt === 'giu' || (d.loai === 'chua' && ['moi', 'huy', 'tuchoi'].indexOf(d.tt) >= 0)) return 'chua';
    if ((tt === 'danggiao' || tt === 'dagiao') && (d.tt === 'xacnhan' || d.tt === 'danggiao')) return 'giao';
    return 'don';
  }
  function nutDon(d) {
    var ds = d.tt === 'moi' && d.loai === 'chua' ? [['giu', 'Duyệt chừa ' + d.soNgay + ' ngày', 'btn-cam'], ['xacnhan', 'Duyệt giao luôn', 'btn-vien'], ['tuchoi', 'Từ chối', 'btn-vien']] : (NUT[d.tt] || []);
    return ds.filter(function (n) { return co(quyenTT(d, n[0])); });
  }
  function moDon(ma) {
    var d = don(ma);
    if (!d) { if (S.don.length) toast('Không thấy đơn ' + ma); return; }
    S.moMa = ma; history.replaceState(null, '', location.pathname + location.search + '#don=' + encodeURIComponent(ma));
    var nut = nutDon(d), luu = co('ghichu') || (d.loai === 'chua' && co('coc'));
    var html = '<div class="sh-head"><h3>' + esc(d.ma) + ' ' + nhanTT(d.tt) + '</h3><button type="button" class="sh-x" data-qt-act="dong" aria-label="Đóng">✕</button></div><div class="sh-body">' +
      '<div class="qt-tt-ds"><span>Đại lý</span><b>' + esc(d.ten) + '</b><span>Tài khoản</span><div>' + esc(d.user) + '</div><span>SĐT</span><div>' + (d.sdt ? '<a href="tel:' + esc(d.sdt) + '">' + esc(d.sdt) + '</a>' : '—') + '</div>' +
      '<span>Ngày đặt</span><div>' + gio(d.ngay) + '</div><span>Hình thức</span><div>' + esc(d.hinhThuc) + (d.ngayCan ? ' · cần ngày <b>' + esc(d.ngayCan) + '</b>' : '') + '</div>' +
      (d.diaChi ? '<span>Địa chỉ giao</span><div>' + esc(d.diaChi) + '</div>' : '') + (d.ghiChu ? '<span>Ghi chú khách</span><div>' + esc(d.ghiChu) + '</div>' : '') +
      (d.loai === 'chua' ? '<span>Chừa hàng</span><div><b>' + d.soNgay + ' ngày</b>' + (d.tt === 'giu' && d.han ? ' · giữ tới <b>' + ngayNgan(d.han) + '</b> <span class="qt-chua' + (hetHan(d) ? ' het' : '') + '">(' + conLai(d.han) + ')</span>' : d.tt === 'moi' ? ' · chờ duyệt (hạn tính từ ngày duyệt)' : '') + '</div>' : '') +
      (d.nguoiGiao ? '<span>Người giao</span><div><b>' + esc(d.nguoiGiao) + '</b></div>' : '') + (d.ngayGiao ? '<span>Đã giao lúc</span><div>' + gio(d.ngayGiao) + '</div>' : '') +
      (d.xuLy ? '<span>Người xử lý</span><div>' + esc(d.xuLy) + (d.capNhat ? ' · ' + gio(d.capNhat) : '') + '</div>' : '') + '</div>' +
      htmlChuaQT(d) +
      '<div class="sec">Mặt hàng</div><table class="qt-ct"><thead><tr><th>Mã / tên</th><th class="so">SL</th><th class="so an-dt">Được bán</th><th class="so">Đơn giá</th><th class="so">Thành tiền</th></tr></thead><tbody>' +
      d.items.map(function (x) { return '<tr><td><b>' + esc(x.ma) + '</b><br><small>' + esc(x.ten) + '</small></td><td class="so">' + so(x.sl) + ' ' + esc(x.dv) + (x.qd ? '<br><small>' + esc(x.qd) + '</small>' : '') + '</td><td class="so an-dt">' + oTon(x) + '</td><td class="so">' + tien(x.dongia) + '</td><td class="so">' + tien(x.tien) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td colspan="4" class="so">Tổng</td><td class="so">' + tien(d.tong) + '</td></tr></tfoot></table>' +
      '<div class="sec">Ghi chú nội bộ</div><textarea class="qt-nb" id="qt-nb"' + (co('ghichu') ? '' : ' disabled') + ' placeholder="Chỉ nội bộ thấy (đại lý không thấy)">' + esc(d.ghiChuNB) + '</textarea>' +
      (!nut.length && !luu && !laAdmin() ? '<p class="mo khong-in" style="margin-top:8px">Tài khoản của bạn chỉ xem đơn này. Cần duyệt / sửa: nhờ quản trị bật quyền trong "Nhân viên & quyền".</p>' : '') +
      '<div class="sec khong-in">Lịch sử xử lý</div><div class="qt-ls khong-in" id="qt-ls">' + htmlLichSu(ma) + '</div>' +
      '</div><div class="sh-foot"><div class="qt-hd">' +
      nut.map(function (n) { return '<button type="button" class="btn ' + n[2] + '" data-qt-tt="' + n[0] + '">' + n[1] + '</button>'; }).join('') +
      (luu ? '<button type="button" class="btn btn-vien" data-qt-act="luu-nb">Lưu</button>' : '') +
      '<button type="button" class="btn btn-vien" data-qt-act="in">In phiếu</button></div></div>';
    $('qt-ngan').innerHTML = html; $('qt-ngan').hidden = false; $('qt-nen').hidden = false;
    if (!S.ton) taiTon().then(function () { if (S.moMa === ma && S.ton) moDon(ma); });
    if (!S.ls[ma]) api('nhatKy', { maDon: ma, gioiHan: 100 }).then(function (r) {
      S.ls[ma] = r && r.status === 'ok' ? r.data : [];
      var el = $('qt-ls'); if (el && S.moMa === ma) el.innerHTML = htmlLichSu(ma);
    }).catch(function () { });
  }
  function htmlLichSu(ma) {
    var ds = S.ls[ma];
    if (!ds) return '<small class="mo">Đang tải…</small>';
    if (!ds.length) return '<small class="mo">Chưa có ghi nhận (đơn tạo trước khi có nhật ký).</small>';
    return ds.map(function (x) { return '<div class="qt-ls-dong"><span>' + gio(x.luc) + '</span><b>' + esc(x.user) + '</b><div>' + esc(x.hd) + (x.ct ? ' – ' + esc(x.ct) : '') + '</div></div>'; }).join('');
  }
  function htmlChuaQT(d) {
    if (d.loai !== 'chua') return '';
    var cc = co('chua'), ccoc = co('coc'), h = '<div class="sec">Chừa hàng & đặt cọc</div><div class="qt-chua-box">';
    if (d.tt === 'giu' && d.xinGH) h += '<div class="qt-xin">⏳ Đại lý xin gia hạn thêm <b>' + d.xinGH + ' ngày</b>' +
      (cc ? '<span><button type="button" class="btn btn-cam btn-nho" data-qt-gh="' + d.xinGH + '">Đồng ý</button><button type="button" class="btn btn-vien btn-nho" data-qt-act="bo-xin">Không</button></span>' : '') + '</div>';
    if (d.tt === 'giu' && hetHan(d)) h += '<div class="qt-xin het">❗ Đã hết hạn chừa – hàng VẪN đang giữ. Chọn: gia hạn / chuyển thành đơn giao / nhả hàng.</div>';
    h += '<div class="qt-coc"><label>Cọc yêu cầu<input id="qt-coc" inputmode="numeric" value="' + (d.coc || 0) + '"' + (ccoc ? '' : ' disabled') + '></label>' +
      '<label>Đã nhận cọc<input id="qt-dacoc" inputmode="numeric" value="' + (d.daCoc || 0) + '"' + (ccoc ? '' : ' disabled') + '></label>' +
      '<div class="qt-coc-tt">' + (d.coc ? (d.daCoc >= d.coc ? '✅ Đủ cọc' : '⚠️ Còn thiếu ' + tien(d.coc - (d.daCoc || 0))) : 'Không yêu cầu cọc') + '</div></div>';
    if (cc && d.tt === 'giu') h += '<div class="qt-gh"><span>Gia hạn thêm:</span>' + S.chuaCfg.map(function (c) { return '<button type="button" class="chip" data-qt-gh="' + c.ngay + '">+' + c.ngay + ' ngày</button>'; }).join('') + '</div>';
    return h + '</div>';
  }
  function giaTriCoc() {
    var c = $('qt-coc'), dc = $('qt-dacoc'), n = function (el) { return el ? String(el.value).replace(/[^\d]/g, '') : undefined; };
    return { coc: n(c), daCoc: n(dc) };
  }
  function guiCapNhat(them, thongBao) {
    var d = don(S.moMa);
    if (!d) return;
    var p = { ma: d.ma, ghiChuNB: $('qt-nb') ? $('qt-nb').value : undefined }, gc = giaTriCoc();
    if (d.loai === 'chua') { p.coc = gc.coc; p.daCoc = gc.daCoc; }
    Object.keys(them).forEach(function (k) { p[k] = them[k]; });
    api('capNhatDon', p, true).then(function (r) {
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      toast(thongBao && r.msg !== 'Không có gì thay đổi' ? thongBao : (r.msg || 'Đã cập nhật'));
      S.ton = null; delete S.ls[d.ma]; S.bc.kq = null; S.nk.ds = null; return taiDon();
    }).catch(function (e) { toast('Không cập nhật được: ' + e.message); });
  }
  function dongDon() { S.moMa = ''; $('qt-ngan').hidden = true; $('qt-nen').hidden = true; history.replaceState(null, '', location.pathname + location.search); }
  function doiTT(tt) {
    var d = don(S.moMa);
    if (!d) return;
    var hoi = tt === 'tuchoi' ? 'Từ chối đơn ' : tt === 'huy' ? (d.tt === 'giu' ? 'Nhả hàng (hủy chừa) đơn ' : 'Hủy đơn ') : '';
    if (hoi && !confirm(hoi + d.ma + '?' + (d.daCoc ? '\nLưu ý: đại lý đã cọc ' + tien(d.daCoc) + ' – ghi rõ cách xử lý cọc vào ghi chú nội bộ.' : ''))) return;
    if (tt === 'danggiao') { var ng = prompt('Người giao / xe (không bắt buộc):', d.nguoiGiao || ''); if (ng === null) return; guiCapNhat({ tt: tt, nguoiGiao: ng }); return; }
    if (tt === 'dagiao' && !confirm('Xác nhận đơn ' + d.ma + ' ĐÃ GIAO xong?')) return;
    guiCapNhat({ tt: tt });
  }

  // ============================================================
  // BÁO CÁO (quyền "baocao"): doanh số theo khoảng ngày (đơn Đã xác nhận / Đang giao / Đã giao).
  // ============================================================
  var MAU_KY = [['homnay', 'Hôm nay'], ['7ngay', '7 ngày'], ['thangnay', 'Tháng này'], ['thangtruoc', 'Tháng trước'], ['namnay', 'Năm nay'], ['tuychon', 'Tùy chọn']];
  function khoangKy(k) {
    var n = new Date(), tu = new Date(n), den = new Date(n);
    if (k === '7ngay') tu.setDate(n.getDate() - 6);
    else if (k === 'thangnay') tu = new Date(n.getFullYear(), n.getMonth(), 1);
    else if (k === 'thangtruoc') { tu = new Date(n.getFullYear(), n.getMonth() - 1, 1); den = new Date(n.getFullYear(), n.getMonth(), 0); }
    else if (k === 'namnay') tu = new Date(n.getFullYear(), 0, 1);
    return { tu: ymd(tu), den: ymd(den) };
  }
  function veBaoCao() {
    if (!co('baocao')) return '<div class="qt-trong">Tài khoản chưa có quyền xem báo cáo.</div>';
    var b = S.bc; if (!b.tu) { var k = khoangKy(b.kieu); b.tu = k.tu; b.den = k.den; }
    return '<div class="qt-h1">Báo cáo doanh số <small>theo ngày đặt · ' + dmy(b.tu) + ' – ' + dmy(b.den) + '</small>' +
      '<button type="button" class="btn btn-vien btn-nho qt-lm" data-qt-act="xuat-bc"' + (b.kq ? '' : ' disabled') + '>⬇ Tải Excel (CSV)</button></div>' +
      '<div class="qt-loc">' + MAU_KY.map(function (m) { return '<button type="button" class="chip' + (b.kieu === m[0] ? ' on' : '') + '" data-bc-ky="' + m[0] + '">' + m[1] + '</button>'; }).join('') +
      (b.kieu === 'tuychon' ? '<span class="qt-ngay"><input type="date" id="qt-bc-tu" value="' + b.tu + '"> – <input type="date" id="qt-bc-den" value="' + b.den + '"><button type="button" class="btn btn-chinh btn-nho" data-qt-act="xem-bc">Xem</button></span>' : '') + '</div>' +
      '<div id="qt-bc-kq">' + (b.kq ? htmlBaoCao(b.kq) : '<div class="qt-trong">Đang tính…</div>') + '</div>';
  }
  function taiBaoCao() {
    var b = S.bc; b.dang = true;
    api('baoCao', { tu: b.tu, den: b.den }).then(function (r) {
      b.dang = false;
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      b.kq = r.data; if (S.trang === 'baocao') ve();
    }).catch(function (e) { b.dang = false; var el = $('qt-bc-kq'); if (el) el.innerHTML = '<div class="qt-trong">Không tải được báo cáo: ' + esc(e.message) + '</div>'; });
  }
  // Các ngày trong khoảng (≤ 62 ngày) hoặc các tháng (khoảng dài hơn) – ngày không có đơn vẫn có cột 0.
  function chuoiThoiGian(kq) {
    var tu = new Date(S.bc.tu + 'T00:00:00'), den = new Date(S.bc.den + 'T00:00:00'), ngay = Math.round((den - tu) / 86400000) + 1, theo = {};
    kq.theoNgay.forEach(function (x) { theo[x.ngay] = x; });
    var ds = [];
    if (ngay <= 62) {
      for (var d = new Date(tu); d <= den; d.setDate(d.getDate() + 1)) { var k = ymd(d), x = theo[k] || {}; ds.push({ nhan: ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2), doanhSo: x.doanhSo || 0, soDon: x.soDon || 0 }); }
    } else {
      var th = {};
      kq.theoNgay.forEach(function (x) { var m = x.ngay.slice(0, 7), o = th[m] || (th[m] = { doanhSo: 0, soDon: 0 }); o.doanhSo += x.doanhSo; o.soDon += x.soDon; });
      for (var m = new Date(tu.getFullYear(), tu.getMonth(), 1); m <= den; m.setMonth(m.getMonth() + 1)) {
        var km = m.getFullYear() + '-' + ('0' + (m.getMonth() + 1)).slice(-2), o = th[km] || {};
        ds.push({ nhan: 'T' + (m.getMonth() + 1) + '/' + String(m.getFullYear()).slice(2), doanhSo: o.doanhSo || 0, soDon: o.soDon || 0 });
      }
    }
    return { ds: ds, theoThang: ngay > 62 };
  }
  function htmlBaoCao(kq) {
    var tg = chuoiThoiGian(kq), max = Math.max.apply(null, tg.ds.map(function (x) { return x.doanhSo; }).concat([1]));
    var buoc = Math.ceil(tg.ds.length / 12); // nhãn trục ngang thưa bớt
    var the = function (cls, ten, gt, phu) { return '<div class="qt-so ' + cls + '"><small>' + ten + '</small><b>' + gt + '</b>' + (phu ? '<small>' + phu + '</small>' : '') + '</div>'; };
    var h = '<div class="qt-the">' +
      the('xanh', 'Doanh số (đơn đã xác nhận / giao)', tien(kq.doanhSo), 'đã giao ' + tien(kq.daGiao)) +
      the('c', 'Số đơn', so(kq.soDon), 'chờ duyệt ' + so(kq.choDuyet)) +
      the('', 'Giá trị TB / đơn bán', tien(kq.daiLy.reduce(function (t, x) { return t + x.soDon; }, 0) ? Math.round(kq.doanhSo / kq.daiLy.reduce(function (t, x) { return t + x.soDon; }, 0)) : 0)) +
      the('do', 'Hủy / từ chối', so(kq.huy + kq.tuChoi), kq.soDon ? Math.round((kq.huy + kq.tuChoi) * 100 / kq.soDon) + '% số đơn' : '') +
      the('cam', 'Đơn chừa hàng', so(kq.soChua), 'cọc đã nhận ' + tien(kq.cocDaNhan)) + '</div>';
    // Biểu đồ cột: 1 chuỗi (doanh số) → không cần chú thích, tiêu đề đã nói rõ. Di chuột vào cột để xem số.
    h += '<div class="qt-khung qt-bd-khung"><h2>Doanh số theo ' + (tg.theoThang ? 'tháng' : 'ngày') + '</h2>' +
      (kq.doanhSo ? '<div class="qt-bd"><div class="qt-bd-truc"><span>' + tienGon(max) + '</span><span>' + tienGon(max / 2) + '</span><span>0</span></div><div class="qt-bd-cot">' +
        tg.ds.map(function (x, i) {
          return '<div class="qt-bd-o" data-tip="' + esc(x.nhan + ' · ' + tien(x.doanhSo) + ' · ' + x.soDon + ' đơn') + '"><i style="height:' + (x.doanhSo ? Math.max(2, x.doanhSo / max * 100) : 0) + '%"></i>' +
            '<span>' + (i % buoc === 0 ? x.nhan : '') + '</span></div>';
        }).join('') + '</div></div>' : '<div class="qt-trong">Chưa có doanh số trong khoảng này.</div>') + '</div>';
    var maxN = Math.max.apply(null, kq.nhom.map(function (x) { return x.tien; }).concat([1]));
    h += '<div class="qt-bc-2"><div class="qt-khung"><h2>Theo ngành hàng</h2>' + (kq.nhom.length ? '<div class="qt-nganh">' + kq.nhom.map(function (x) {
        return '<div class="qt-nganh-dong" data-tip="' + esc(x.nhom + ' · ' + tien(x.tien)) + '"><span>' + esc(x.nhom) + '</span><div><i style="width:' + Math.max(1, x.tien / maxN * 100) + '%"></i></div><b>' + tienGon(x.tien) + '</b></div>';
      }).join('') + '</div>' : '<div class="qt-trong">—</div>') + '</div>' +
      '<div class="qt-khung"><h2>Đại lý mua nhiều nhất</h2>' + bangBC(kq.daiLy, [['Đại lý', function (x) { return '<b>' + esc(x.ten) + '</b><br><small>' + esc(x.user) + '</small>'; }], ['Đơn', function (x) { return so(x.soDon); }, 'so'], ['Doanh số', function (x) { return tien(x.doanhSo); }, 'so']]) + '</div></div>' +
      '<div class="qt-khung"><h2>Mặt hàng bán chạy (theo tiền)</h2>' + bangBC(kq.hang, [['Mã / tên', function (x) { return '<b>' + esc(x.ma) + '</b><br><small>' + esc(x.ten) + '</small>'; }], ['Số lượng', function (x) { return so(x.sl) + ' ' + esc(x.dv); }, 'so'], ['Thành tiền', function (x) { return tien(x.tien); }, 'so']]) + '</div>';
    return h;
  }
  function bangBC(ds, cot) {
    if (!ds.length) return '<div class="qt-trong">—</div>';
    return '<table class="qt-bang"><thead><tr><th>#</th>' + cot.map(function (c) { return '<th' + (c[2] ? ' class="' + c[2] + '"' : '') + '>' + c[0] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      ds.map(function (x, i) { return '<tr><td>' + (i + 1) + '</td>' + cot.map(function (c) { return '<td' + (c[2] ? ' class="' + c[2] + '"' : '') + '>' + c[1](x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function xuatBaoCao() {
    var kq = S.bc.kq; if (!kq) return;
    var q = function (v) { v = String(v == null ? '' : v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var dong = [['Báo cáo doanh số ' + (CFG.TEN_DAY_DU || ''), dmy(S.bc.tu) + ' - ' + dmy(S.bc.den)], [],
      ['Doanh số (đã xác nhận / giao)', kq.doanhSo], ['Đã giao', kq.daGiao], ['Số đơn', kq.soDon], ['Chờ duyệt', kq.choDuyet], ['Hủy', kq.huy], ['Từ chối', kq.tuChoi], ['Đơn chừa hàng', kq.soChua], ['Cọc đã nhận', kq.cocDaNhan], [],
      ['Theo ngày', 'Số đơn', 'Doanh số']].concat(kq.theoNgay.map(function (x) { return [dmy(x.ngay), x.soDon, x.doanhSo]; }))
      .concat([[], ['Ngành hàng', 'Doanh số']]).concat(kq.nhom.map(function (x) { return [x.nhom, x.tien]; }))
      .concat([[], ['Đại lý', 'Tài khoản', 'Số đơn', 'Doanh số']]).concat(kq.daiLy.map(function (x) { return [x.ten, x.user, x.soDon, x.doanhSo]; }))
      .concat([[], ['Mã hàng', 'Tên hàng', 'Số lượng', 'Đơn vị', 'Thành tiền']]).concat(kq.hang.map(function (x) { return [x.ma, x.ten, x.sl, x.dv, x.tien]; }));
    var csv = '﻿' + dong.map(function (r) { return r.map(q).join(','); }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'bao-cao-' + S.bc.tu + '_' + S.bc.den + '.csv';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ============================================================
  // NHẬT KÝ (quyền "nhatky"): ai làm gì, lúc nào – 1000 dòng gần nhất.
  // ============================================================
  function veNhatKy() {
    if (!co('nhatky')) return '<div class="qt-trong">Tài khoản chưa có quyền xem nhật ký.</div>';
    return '<div class="qt-h1">Nhật ký thao tác <small>đăng nhập, gửi đơn, duyệt, gia hạn, cọc, đổi quyền…</small>' + '<button type="button" class="btn btn-vien btn-nho qt-lm" data-qt-act="lam-moi-nk">↻ Làm mới</button></div>' +
      '<div class="qt-loc"><input id="qt-nk-q" type="search" placeholder="Tìm tài khoản, mã đơn, hành động…" value="' + esc(S.nk.q) + '"></div>' +
      '<div class="qt-khung" id="qt-nk-ds">' + bangNhatKy() + '</div>';
  }
  function bangNhatKy() {
    if (!S.nk.ds) return '<div class="qt-trong">Đang tải…</div>';
    var q = S.nk.q.trim().toLowerCase(), ds = S.nk.ds.filter(function (x) { return !q || [x.user, x.hd, x.ma, x.ct].join(' ').toLowerCase().indexOf(q) >= 0; });
    if (!ds.length) return '<div class="qt-trong">Không có dòng nào</div>';
    return '<table class="qt-bang"><thead><tr><th>Thời gian</th><th>Tài khoản</th><th>Hành động</th><th>Mã đơn</th><th class="an-dt">Chi tiết</th></tr></thead><tbody>' +
      ds.slice(0, 500).map(function (x) {
        return '<tr' + (x.ma ? ' class="dong" data-don="' + esc(x.ma) + '"' : '') + '><td>' + gio(x.luc) + '</td><td><b>' + esc(x.user) + '</b><br><small>' + esc(x.role) + '</small></td><td>' + esc(x.hd) + '</td><td class="ma">' + esc(x.ma) + '</td><td class="an-dt"><small>' + esc(x.ct) + '</small></td></tr>';
      }).join('') + '</tbody></table>';
  }
  function taiNhatKy() {
    api('nhatKy', { gioiHan: 1000 }).then(function (r) {
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      S.nk.ds = r.data; var el = $('qt-nk-ds'); if (el) el.innerHTML = bangNhatKy();
    }).catch(function (e) { var el = $('qt-nk-ds'); if (el) el.innerHTML = '<div class="qt-trong">Không tải được: ' + esc(e.message) + '</div>'; });
  }

  // ============================================================
  // NHÂN VIÊN & QUYỀN (chỉ quản trị)
  // ============================================================
  function veNhanVien() {
    if (!laAdmin()) return '<div class="qt-trong">Chỉ quản trị.</div>';
    var ma = Object.keys(TEN_QUYEN);
    var h = '<div class="qt-h1">Nhân viên & quyền <small>bật quyền nào nhân viên làm được việc đó</small></div>' +
      '<p class="mo qt-ghi">Không bật quyền nào = nhân viên chỉ <b>xem</b> đơn. Quyền <b>Nhập tồn kho</b> cần ghi Gmail của nhân viên – hệ thống tự mở quyền sửa Sheet Tồn kho cho Gmail đó (bỏ quyền thì tự gỡ). Thêm / khóa / đổi mật khẩu tài khoản: mở app bảng giá → menu tài khoản → <b>Quản lý tài khoản</b> (vai trò "Nhân viên"). Quyền có hiệu lực ngay, không cần đăng nhập lại.</p>';
    if (!S.nv) return h + '<div class="qt-khung"><div class="qt-trong">Đang tải…</div></div>';
    if (!S.nv.length) return h + '<div class="qt-khung"><div class="qt-trong">Chưa có tài khoản nhân viên.</div></div>';
    return h + '<div class="qt-khung"><table class="qt-bang qt-quyen"><thead><tr><th>Tài khoản</th>' + ma.map(function (k) { return '<th>' + esc(TEN_QUYEN[k]) + '</th>'; }).join('') + '<th></th></tr></thead><tbody>' +
      S.nv.map(function (u) {
        var ad = u.role === 'admin';
        return '<tr><td><b>' + esc(u.ten || u.username) + '</b><br><small>' + esc(u.username) + ' · ' + (ad ? 'Quản trị' : 'Nhân viên') + (u.khoa ? ' · <span class="qt-thieu">đã khóa</span>' : '') + '</small></td>' +
          ma.map(function (k) { return '<td class="qt-o-quyen">' + (ad ? '✔' : '<label><input type="checkbox" data-nv-q="' + esc(u.username) + '" value="' + k + '"' + (u.quyen.indexOf(k) >= 0 ? ' checked' : '') + '><span>' + esc(TEN_QUYEN[k]) + '</span></label>') + '</td>'; }).join('') +
          '<td>' + (ad ? '<small class="mo">Toàn quyền</small>' : '<input class="qt-gmail" type="email" data-nv-mail="' + esc(u.username) + '" value="' + esc(u.gmail || '') + '" placeholder="Gmail (để nhập tồn)"><button type="button" class="btn btn-chinh btn-nho" data-nv-luu="' + esc(u.username) + '">Lưu</button>') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function taiNhanVien() {
    api('dsNhanVien', {}).then(function (r) {
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      S.nv = r.data; if (r.tenQuyen) TEN_QUYEN = r.tenQuyen; if (S.trang === 'nhanvien') ve();
    }).catch(function (e) { toast('Không tải được danh sách: ' + e.message); });
  }
  function luuQuyen(user, nut) {
    var q = [].slice.call(document.querySelectorAll('[data-nv-q]')).filter(function (x) { return x.getAttribute('data-nv-q') === user && x.checked; }).map(function (x) { return x.value; });
    nut.disabled = true;
    var m = document.querySelector('[data-nv-mail="' + user + '"]');
    api('luuQuyen', { username: user, quyen: q.join(','), gmail: m ? m.value.trim() : '' }, true).then(function (r) {
      nut.disabled = false;
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      toast(r.msg); S.nv = null; S.nk.ds = null; taiNhanVien();
    }).catch(function (e) { nut.disabled = false; toast('Không lưu được: ' + e.message); });
  }

  // ============================================================
  // KHO & GIAO HÀNG (quyền "giao"): đơn đã duyệt cần xuất kho -> đang giao -> đã giao.
  // ============================================================
  function veGiao() {
    var can = S.don.filter(function (d) { return d.tt === 'xacnhan'; }), dang = S.don.filter(function (d) { return d.tt === 'danggiao'; });
    var theoNgay = function (a, b) { return String(a.ngayCan || '9999') < String(b.ngayCan || '9999') ? -1 : 1; };
    can.sort(theoNgay); dang.sort(theoNgay);
    var homNay = ymd(new Date());
    var xong = S.don.filter(function (d) { return d.tt === 'dagiao' && d.ngayGiao && ymd(new Date(d.ngayGiao)) === homNay; });
    return '<div class="qt-h1">Kho & giao hàng <small>đơn đã duyệt – sắp theo ngày khách cần</small>' + NUT_LM + '</div>' +
      '<div class="qt-the"><div class="qt-so do"><small>Cần xuất kho</small><b>' + can.length + '</b></div><div class="qt-so c"><small>Đang giao</small><b>' + dang.length + '</b></div><div class="qt-so xanh"><small>Đã giao hôm nay</small><b>' + xong.length + '</b></div></div>' +
      '<div class="qt-khung qt-khung-cam"><h2>📦 Cần xuất kho</h2>' + bangDon(can, 'Không có đơn nào chờ xuất 👍') + '</div>' +
      '<div class="qt-khung" style="margin-top:16px"><h2>🚚 Đang giao</h2>' + bangDon(dang, 'Không có đơn đang giao') + '</div>' +
      (co('giao') ? '' : '<p class="mo" style="margin-top:10px">Bạn xem được danh sách; báo Đang giao / Đã giao cần quyền "Kho & giao hàng".</p>');
  }

  // ============================================================
  // NHẬP GIÁ (quyền "nhapgia"): sửa giá niêm yết / giá đại lý ngay trên trang, ghi thẳng tab Giá.
  // ============================================================
  function taiGia() {
    api('getAll', {}).then(function (r) {
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      S.gia.ds = r.data || []; if (S.trang === 'gia' || S.trang === 'sanpham') ve();
    }).catch(function (e) { toast('Không tải được bảng giá: ' + e.message); });
  }
  function boDau(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase(); }
  function veGia() {
    if (!co('nhapgia')) return '<div class="qt-trong">Tài khoản chưa có quyền nhập giá.</div>';
    return '<div class="qt-h1">Nhập giá <small>sửa xong bấm Lưu – app đại lý thấy giá mới ngay</small></div>' +
      '<div class="qt-loc"><input id="qt-gia-q" type="search" placeholder="Tìm mã, tên, hãng… (vd: 60x60, inax, L284)" value="' + esc(S.gia.q) + '">' +
      '<label class="qt-chk"><input type="checkbox" id="qt-gia-trong"' + (S.gia.trong ? ' checked' : '') + '> Chỉ mã chưa có giá</label></div>' +
      '<div class="qt-khung" id="qt-gia-ds">' + bangGia() + '</div>' +
      '<p class="mo" style="margin-top:10px">Sửa nhiều mã một lúc (cả nghìn mã) thì vẫn nên nhập thẳng trong tab Giá của Sheet chính.</p>';
  }
  function bangGia() {
    if (!S.gia.ds) return '<div class="qt-trong">Đang tải bảng giá…</div>';
    var q = boDau(S.gia.q).trim().split(/\s+/).filter(String);
    var ds = S.gia.ds.filter(function (p) {
      if (S.gia.trong && p.ny > 0) return false;
      var s = boDau([p.ma, p.ten, p.tenGoc, p.hang, p.kc, p.nhom].join(' '));
      return q.every(function (w) { return s.indexOf(w) >= 0; });
    });
    if (!ds.length) return '<div class="qt-trong">Không có mã phù hợp</div>';
    return '<div class="qt-trong-nho">' + ds.length + ' mã' + (ds.length > 60 ? ' – hiện 60 mã đầu, gõ thêm để lọc' : '') + '</div>' +
      '<table class="qt-bang qt-gia"><thead><tr><th>Mã / tên</th><th class="an-dt">Hãng · ĐVT</th><th class="so">Giá niêm yết</th><th class="so">Giá đại lý</th><th></th></tr></thead><tbody>' +
      ds.slice(0, 60).map(function (p) {
        return '<tr><td><b>' + esc(p.ma) + '</b><br><small>' + esc(p.ten) + '</small></td><td class="an-dt"><small>' + esc(p.hang) + ' · ' + esc(p.dvt) + '</small></td>' +
          '<td class="so"><input class="qt-so-o" inputmode="numeric" data-gia-ny="' + esc(p.ma) + '" value="' + (p.ny ? so(p.ny) : '') + '" placeholder="0"></td>' +
          '<td class="so"><input class="qt-so-o" inputmode="numeric" data-gia-dl="' + esc(p.ma) + '" value="' + (p.dl ? so(p.dl) : '') + '" placeholder="0"></td>' +
          '<td><button type="button" class="btn btn-chinh btn-nho" data-gia-luu="' + esc(p.ma) + '">Lưu</button></td></tr>';
      }).join('') + '</tbody></table>';
  }
  function luuGia(ma, nut) {
    var gt = function (k) { var el = document.querySelector('[data-gia-' + k + '="' + ma + '"]'); return el ? el.value.replace(/[^\d]/g, '') : ''; };
    var ny = gt('ny'), dl = gt('dl');
    if (dl && ny && Number(dl) > Number(ny) && !confirm('Giá đại lý cao hơn giá niêm yết – vẫn lưu?')) return;
    nut.disabled = true;
    api('suaGia', { ma: ma, ny: ny, dl: dl }, true).then(function (r) {
      nut.disabled = false;
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      var p = S.gia.ds.filter(function (x) { return x.ma === ma; })[0]; if (p) { if (ny) p.ny = Number(ny); if (dl) p.dl = Number(dl); }
      nut.textContent = '✓'; setTimeout(function () { nut.textContent = 'Lưu'; }, 1500);
      toast(r.msg); S.nk.ds = null;
    }).catch(function (e) { nut.disabled = false; toast('Không lưu được: ' + e.message); });
  }

  // ============================================================
  // SẢN PHẨM (quyền "sanpham"): thêm mã mới, sửa đủ trường, ảnh, mã bên kho, ẩn / hiện.
  // ============================================================
  var NHOM_CFG = (CFG.NHOM_HANG || []).map(function (n) { return n.ten; });
  var DVT_GOI_Y = ['m²', 'viên', 'thùng', 'cái', 'bộ', 'bao', 'lon', 'thùng 18L', 'chai', 'cây', 'tấm', 'cuộn', 'kg'];
  var O_SP = [
    ['Cơ bản', [['ma', 'Mã hàng *', 'vd GHT.BC6600T – không dấu cách'], ['nhom', 'Nhóm hàng *', '', 'dl-nhom'], ['hang', 'Hãng', 'vd HT, Inax, TOTO', 'dl-hang'],
      ['ten', 'Tên vật tư (theo phần mềm kho) *', 'vd Gạch HT 60x60 BC6600 Trắng Loại 1 (4v/th)'], ['tenHien', 'Tên hiển thị trên app', 'để trống = dùng tên vật tư'],
      ['dvt', 'Đơn vị tính giá *', 'm², cái, bộ…', 'dl-dvt'], ['kc', 'Kích cỡ / Quy cách', 'vd 60x60, 30x60', 'dl-kc'], ['loai', 'Loại / dòng', 'vd Loại 1, Porcelain', 'dl-loai']]],
    ['Đóng gói (gạch, ngói: để app quy đổi m² ↔ thùng)', [['vt', 'Số viên / thùng', 'vd 4'], ['m2', 'm² / thùng', 'vd 1,44'], ['dg', 'Đóng gói (tự điền từ 2 ô trên, sửa được)', 'vd 4 viên/thùng · 1,44 m²/thùng']]],
    ['Giá', [['ny', 'Giá niêm yết (đ)', 'vd 258000'], ['dl', 'Giá đại lý (đ)', 'vd 215000']]],
    ['Thuộc tính (bộ lọc trên app)', [['mau', 'Màu', '', 'dl-mau'], ['hoaVan', 'Hoa văn / vân', '', 'dl-hoaVan'], ['men', 'Men / bề mặt', 'vd Bóng, Mờ', 'dl-men'],
      ['congNang', 'Công năng', 'vd Lát nền, Ốp tường', 'dl-congNang'], ['tinhNang', 'Tính năng', 'vd Chống trơn', 'dl-tinhNang'], ['dungTich', 'Dung tích', 'vd 18L, 5L']]],
    ['Khác', [['gc', 'Ghi chú', ''], ['anh', 'Link ảnh Google Drive', 'Chia sẻ "Bất kỳ ai có đường liên kết"'], ['maKho', 'Mã bên phần mềm kho (nếu khác mã hàng)', 'để tồn kho tự khớp']]]
  ];
  function veSanPham() {
    if (!co('sanpham')) return '<div class="qt-trong">Tài khoản chưa có quyền thêm / sửa sản phẩm.</div>';
    var nhom = {}; (S.gia.ds || []).forEach(function (p) { if (p.nhom) nhom[p.nhom] = (nhom[p.nhom] || 0) + 1; });
    return '<div class="qt-h1">Sản phẩm <small>' + (S.gia.ds ? S.gia.ds.length + ' mã đang hiện trên app' : '') + '</small>' +
      '<button type="button" class="btn btn-chinh btn-nho qt-lm" data-qt-act="sp-moi">＋ Thêm sản phẩm mới</button></div>' +
      '<div class="qt-loc"><input id="qt-sp-q" type="search" placeholder="Tìm mã, tên, hãng, kích cỡ…" value="' + esc(S.sp.q) + '">' +
      '<select id="qt-sp-nhom" class="qt-chon"><option value="">Tất cả nhóm</option>' + Object.keys(nhom).sort().map(function (n) { return '<option' + (S.sp.nhom === n ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select>' +
      '<span class="qt-ngay"><input id="qt-sp-ma" placeholder="Mở mã đã ẩn…" style="width:150px"><button type="button" class="btn btn-vien btn-nho" data-qt-act="sp-mo-ma">Mở</button></span></div>' +
      '<div class="qt-khung" id="qt-sp-ds">' + bangSP() + '</div>' +
      '<p class="mo" style="margin-top:10px">Thêm hàng loạt (vài chục mã trở lên) thì dán thẳng vào tab Giá của Sheet chính cho nhanh. Không xóa mã – muốn bỏ thì mở mã, tick "Ẩn khỏi app".</p>';
  }
  function bangSP() {
    if (!S.gia.ds) return '<div class="qt-trong">Đang tải…</div>';
    var q = boDau(S.sp.q).trim().split(/\s+/).filter(String);
    var ds = S.gia.ds.filter(function (p) {
      if (S.sp.nhom && p.nhom !== S.sp.nhom) return false;
      var s = boDau([p.ma, p.ten, p.tenGoc, p.hang, p.kc, p.nhom, p.mau].join(' '));
      return q.every(function (w) { return s.indexOf(w) >= 0; });
    });
    if (!ds.length) return '<div class="qt-trong">Không có mã phù hợp</div>';
    return '<div class="qt-trong-nho">' + ds.length + ' mã' + (ds.length > 80 ? ' – hiện 80 mã đầu, gõ thêm để lọc' : '') + '</div>' +
      '<table class="qt-bang"><thead><tr><th>Mã / tên</th><th class="an-dt">Nhóm · hãng</th><th class="an-dt">Kích cỡ · ĐVT</th><th class="so">Giá NY / ĐL</th><th></th></tr></thead><tbody>' +
      ds.slice(0, 80).map(function (p) {
        return '<tr class="dong" data-sp-sua="' + esc(p.ma) + '"><td><b>' + esc(p.ma) + '</b><br><small>' + esc(p.ten) + '</small></td><td class="an-dt"><small>' + esc(p.nhom) + '<br>' + esc(p.hang) + '</small></td>' +
          '<td class="an-dt"><small>' + esc(p.kc || '—') + '<br>' + esc(p.dvt) + '</small></td><td class="so">' + (p.ny ? tien(p.ny) : '<small class="qt-thieu">chưa có giá</small>') + '<br><small>' + (p.dl ? tien(p.dl) : '') + '</small></td>' +
          '<td><button type="button" class="btn btn-vien btn-nho" data-sp-sua="' + esc(p.ma) + '">Sửa</button></td></tr>';
      }).join('') + '</tbody></table>';
  }
  function goiY(k) { // danh sách gợi ý (datalist) từ dữ liệu đang có
    var dem = {};
    (S.gia.ds || []).forEach(function (p) { var v = p[k]; if (v) dem[v] = (dem[v] || 0) + 1; });
    if (k === 'nhom') NHOM_CFG.forEach(function (v) { dem[v] = (dem[v] || 0) + 1; });
    if (k === 'dvt') DVT_GOI_Y.forEach(function (v) { dem[v] = (dem[v] || 0) + 1; });
    return Object.keys(dem).sort(function (a, b) { return dem[b] - dem[a]; }).slice(0, 200);
  }
  function tachDongGoi(dg) {
    var s = String(dg || '').toLowerCase(), vt = s.match(/(\d+)\s*vi[eê]n/), m2 = s.match(/([\d.,]+)\s*m(?:²|2)\s*\/\s*th/);
    return { vt: vt ? vt[1] : '', m2: m2 ? m2[1] : '' };
  }
  function moFormSP(sp, moi) {
    S.sp.dang = { moi: moi, ma: sp.ma || '' };
    var g = tachDongGoi(sp.dg); sp.vt = sp.vt || g.vt; sp.m2 = sp.m2 || g.m2;
    var dls = {};
    var html = '<div class="sh-head"><h3>' + (moi ? '＋ Thêm sản phẩm mới' : 'Sửa ' + esc(sp.ma)) + '</h3><button type="button" class="sh-x" data-qt-act="dong-sp" aria-label="Đóng">✕</button></div><div class="sh-body qt-form-sp">' +
      O_SP.map(function (nh) {
        return '<div class="sec">' + nh[0] + '</div><div class="qt-o-luoi">' + nh[1].map(function (o) {
          var k = o[0], v = sp[k] == null ? '' : sp[k], laSo = k === 'ny' || k === 'dl';
          if (o[3]) dls[o[3]] = k === 'kc' || k === 'loai' || k === 'hang' || k === 'nhom' || k === 'dvt' || o[3].indexOf('dl-') === 0 ? goiY(k) : [];
          var rong = ['ten', 'tenHien', 'dg', 'gc', 'anh', 'tinhNang', 'congNang'].indexOf(k) >= 0 ? ' class="rong"' : '';
          return '<label' + rong + '>' + o[1] + '<input data-sp="' + k + '"' + (k === 'ma' && !moi ? ' readonly' : '') + (laSo ? ' inputmode="numeric"' : '') +
            (o[3] ? ' list="' + o[3] + '"' : '') + ' value="' + esc(laSo && v ? so(v) : v) + '" placeholder="' + esc(o[2] || '') + '"></label>';
        }).join('') + '</div>';
      }).join('') +
      '<label class="qt-chk" style="margin-top:12px"><input type="checkbox" id="qt-sp-an"' + (sp.an ? ' checked' : '') + '> Ẩn khỏi app (không xóa – bỏ tick để hiện lại)</label>' +
      (sp.anh && /[-\w]{25,}/.test(sp.anh) ? '<div class="qt-sp-anh"><img alt="" src="https://drive.google.com/thumbnail?sz=w300&id=' + esc(sp.anh.match(/[-\w]{25,}/)[0]) + '"></div>' : '') +
      Object.keys(dls).map(function (id) { return '<datalist id="' + id + '">' + dls[id].map(function (v) { return '<option value="' + esc(v) + '">'; }).join('') + '</datalist>'; }).join('') +
      '</div><div class="sh-foot"><div class="qt-hd">' +
      '<button type="button" class="btn btn-chinh" data-qt-act="luu-sp">' + (moi ? 'Thêm sản phẩm' : 'Lưu thay đổi') + '</button>' +
      (moi ? '' : '<button type="button" class="btn btn-vien" data-qt-act="nhan-ban-sp">Nhân bản thành mã mới</button>') + '</div></div>';
    $('qt-ngan').innerHTML = html; $('qt-ngan').hidden = false; $('qt-nen').hidden = false;
    S.sp.goc = moi ? {} : JSON.parse(JSON.stringify(sp));
  }
  function moSuaSP(ma) {
    api('docSanPham', { ma: ma }).then(function (r) {
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      moFormSP(r.data, false);
    }).catch(function (e) { toast('Không mở được: ' + e.message); });
  }
  function docFormSP() {
    var f = {}; document.querySelectorAll('[data-sp]').forEach(function (el) { f[el.getAttribute('data-sp')] = el.value.trim(); });
    return f;
  }
  function luuSP(nut) {
    var dg = S.sp.dang; if (!dg) return;
    var f = docFormSP(), ma = f.ma;
    if (!ma) { toast('Nhập mã hàng'); return; }
    if (/\s/.test(ma)) { toast('Mã hàng không được có dấu cách'); return; }
    if (dg.moi && (!f.ten || !f.nhom || !f.dvt)) { toast('Nhập đủ: Tên vật tư, Nhóm hàng, Đơn vị'); return; }
    ['ny', 'dl'].forEach(function (k) { f[k] = f[k].replace(/[^\d]/g, ''); });
    if (f.dl && f.ny && Number(f.dl) > Number(f.ny) && !confirm('Giá đại lý cao hơn giá niêm yết – vẫn lưu?')) return;
    var gui = {}, goc = S.sp.goc || {};
    ['hang', 'nhom', 'ten', 'tenHien', 'kc', 'loai', 'dvt', 'dg', 'ny', 'dl', 'gc', 'mau', 'congNang', 'tinhNang', 'hoaVan', 'men', 'dungTich'].forEach(function (k) {
      var cu = goc[k] == null ? '' : String(goc[k]);
      if (dg.moi ? f[k] !== '' : f[k] !== cu) gui[k] = f[k];
    });
    var p = { moi: dg.moi, ma: ma, f: gui, an: $('qt-sp-an').checked };
    if (dg.moi ? f.anh : f.anh !== (goc.anh || '')) p.anh = f.anh;
    if (dg.moi ? f.maKho : f.maKho !== (goc.maKho || '')) p.maKho = f.maKho;
    nut.disabled = true;
    api('luuSanPham', p, true).then(function (r) {
      nut.disabled = false;
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      toast(r.msg); S.gia.ds = null; S.nk.ds = null; dongDon(); ve();
    }).catch(function (e) { nut.disabled = false; toast('Không lưu được: ' + e.message); });
  }

  // ============================================================
  // TỒN KHO (quyền "nhapton"): mở Sheet Tồn kho để dán / nhập, bấm cho app đọc lại ngay.
  // ============================================================
  function taiTonTT() {
    api('thongTinTon', {}).then(function (r) {
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      S.tonTT = r; if (S.trang === 'ton') ve();
    }).catch(function (e) { toast('Không tải được: ' + e.message); });
  }
  function veTon() {
    if (!co('nhapton')) return '<div class="qt-trong">Tài khoản chưa có quyền nhập tồn kho.</div>';
    var t = S.tonTT;
    return '<div class="qt-h1">Tồn kho <small>nhập ở Sheet Tồn kho riêng – app tự đọc</small></div>' +
      (!t ? '<div class="qt-khung"><div class="qt-trong">Đang tải…</div></div>' :
        '<div class="qt-khung qt-ton-hd"><h2>Cách nhập tồn</h2><ol>' +
        '<li>Bấm <b>Mở Sheet Tồn kho</b> (đăng nhập đúng Gmail đã được quản trị ghi trong "Nhân viên & quyền").</li>' +
        '<li>Xuất file tồn từ phần mềm kho → dán đè vào tab <b>' + esc(t.tab || 'Tồn kho') + '</b> (giữ dòng tiêu đề: Mã vật tư, Tên vật tư, ĐVT, Tồn, Kho…). Hoặc gõ / sửa số trực tiếp.</li>' +
        '<li>Bấm <b>App đọc lại tồn ngay</b> – đại lý thấy số mới ở lần mở tới (không bấm thì app tự đọc sau tối đa 10 phút).</li></ol>' +
        '<div class="qt-hd" style="padding:0 16px 16px">' + (t.link ? '<a class="btn btn-chinh" href="' + esc(t.link) + '" target="_blank" rel="noopener">📄 Mở Sheet Tồn kho</a>' : '') +
        '<button type="button" class="btn btn-vien" data-qt-act="lam-moi-ton">↻ App đọc lại tồn ngay</button></div>' +
        (t.luc ? '<p class="mo" style="padding:0 16px 14px">' + esc(t.luc) + '</p>' : '') + (t.loi ? '<p class="qt-thieu" style="padding:0 16px 14px">' + esc(t.loi) + '</p>' : '') + '</div>') +
      '<p class="mo" style="margin-top:10px">Số "Được bán" trên app = Tồn trong Sheet − hàng đang giữ cho đơn (chờ duyệt, chừa, đã xác nhận, đang giao).</p>';
  }

  // ---------- Gợi ý khi di chuột vào cột biểu đồ ----------
  var tip = document.createElement('div'); tip.className = 'qt-tip'; tip.hidden = true; document.body.appendChild(tip);
  document.addEventListener('mouseover', function (e) {
    var el = e.target.closest && e.target.closest('[data-tip]');
    if (!el) { tip.hidden = true; return; }
    tip.textContent = el.getAttribute('data-tip'); tip.hidden = false;
    var r = el.getBoundingClientRect(), w = tip.offsetWidth;
    tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    tip.style.top = Math.max(8, r.top + scrollY - tip.offsetHeight - 8) + 'px';
  });

  // ---------- Bấm ----------
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-qt],[data-qt-loc],[data-don],[data-qt-tt],[data-qt-gh],[data-qt-act],[data-bc-ky],[data-nv-luu],[data-gia-luu],[data-sp-sua]');
    if (!el) { if (e.target.id === 'qt-nen') dongDon(); return; }
    if (el.hasAttribute('data-qt')) { S.trang = el.getAttribute('data-qt'); ve(); return; }
    if (el.hasAttribute('data-qt-loc')) { S.loc = el.getAttribute('data-qt-loc'); S.trang = 'don'; ve(); return; }
    if (el.hasAttribute('data-don')) { moDon(el.getAttribute('data-don')); return; }
    if (el.hasAttribute('data-qt-tt')) { doiTT(el.getAttribute('data-qt-tt')); return; }
    if (el.hasAttribute('data-qt-gh')) { var n = el.getAttribute('data-qt-gh'); if (confirm('Gia hạn chừa hàng thêm ' + n + ' ngày?')) guiCapNhat({ giaHan: n }); return; }
    if (el.hasAttribute('data-bc-ky')) {
      S.bc.kieu = el.getAttribute('data-bc-ky');
      if (S.bc.kieu !== 'tuychon') { var k = khoangKy(S.bc.kieu); S.bc.tu = k.tu; S.bc.den = k.den; S.bc.kq = null; }
      ve(); return;
    }
    if (el.hasAttribute('data-nv-luu')) { luuQuyen(el.getAttribute('data-nv-luu'), el); return; }
    if (el.hasAttribute('data-gia-luu')) { luuGia(el.getAttribute('data-gia-luu'), el); return; }
    if (el.hasAttribute('data-sp-sua')) { moSuaSP(el.getAttribute('data-sp-sua')); return; }
    var a = el.getAttribute('data-qt-act');
    if (a === 'dong') dongDon();
    else if (a === 'in') window.print();
    else if (a === 'luu-nb') guiCapNhat({}, 'Đã lưu');
    else if (a === 'bo-xin') guiCapNhat({ boXin: 1 });
    else if (a === 'lam-moi') { S.ton = null; S.ls = {}; el.disabled = true; taiDon().then(function () { toast('Đã làm mới'); }); }
    else if (a === 'lam-moi-nk') { S.nk.ds = null; ve(); }
    else if (a === 'xem-bc') {
      var tu = $('qt-bc-tu').value, den = $('qt-bc-den').value;
      if (!tu || !den || tu > den) { toast('Chọn ngày bắt đầu ≤ ngày kết thúc'); return; }
      S.bc.tu = tu; S.bc.den = den; S.bc.kq = null; ve();
    }
    else if (a === 'xuat-bc') xuatBaoCao();
    else if (a === 'sp-moi') moFormSP({ nhom: S.sp.nhom || '' }, true);
    else if (a === 'sp-mo-ma') { var mm = $('qt-sp-ma').value.trim(); if (mm) moSuaSP(mm); }
    else if (a === 'dong-sp') dongDon();
    else if (a === 'luu-sp') luuSP(el);
    else if (a === 'nhan-ban-sp') { var fb = docFormSP(); fb.ma = ''; fb.an = false; fb.anh = ''; fb.maKho = ''; moFormSP(fb, true); toast('Đã chép thông tin – nhập mã mới rồi bấm Thêm'); }
    else if (a === 'lam-moi-ton') { el.disabled = true; api('lamMoiTon', {}, true).then(function (r) { el.disabled = false; toast(r && r.status === 'ok' ? r.msg : 'Không làm được: ' + (r && r.msg)); S.ton = null; S.tonTT = null; ve(); }); }
    else if (a === 'dang-xuat') { try { localStorage.removeItem('hn_sess'); } catch (er) { } S.sess = null; hienLogin(); }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'qt-q') { S.q = e.target.value; var k = document.querySelector('.qt-khung'); if (k) k.innerHTML = bangDon(locDon(), 'Không có đơn phù hợp'); }
    if (e.target.id === 'qt-nk-q') { S.nk.q = e.target.value; var n = $('qt-nk-ds'); if (n) n.innerHTML = bangNhatKy(); }
    if (e.target.id === 'qt-sp-q' || e.target.id === 'qt-sp-nhom') { S.sp.q = $('qt-sp-q').value; S.sp.nhom = $('qt-sp-nhom').value; var sd = $('qt-sp-ds'); if (sd) sd.innerHTML = bangSP(); }
    var dsp = e.target.getAttribute && e.target.getAttribute('data-sp');
    if (dsp === 'vt' || dsp === 'm2') { // tự ghép "Đóng gói" cho gạch / ngói
      var vt = document.querySelector('[data-sp=vt]').value.trim(), m2 = document.querySelector('[data-sp=m2]').value.trim();
      document.querySelector('[data-sp=dg]').value = [vt ? vt + ' viên/thùng' : '', m2 ? m2 + ' m²/thùng' : ''].filter(String).join(' · ');
    }
    if (e.target.id === 'qt-gia-q' || e.target.id === 'qt-gia-trong') { S.gia.q = $('qt-gia-q').value; S.gia.trong = $('qt-gia-trong').checked; var g = $('qt-gia-ds'); if (g) g.innerHTML = bangGia(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('qt-ngan').hidden) dongDon(); });

  function batDau() {
    if (!S.sess || (S.sess.role !== 'admin' && S.sess.role !== 'nv')) { hienLogin(S.sess ? 'Tài khoản này không có quyền quản trị.' : ''); return; }
    $('qt-login').hidden = true; $('qt-app').hidden = false;
    $('qt-ai').textContent = (S.sess.name || S.sess.username) + ' · ' + (S.sess.role === 'admin' ? 'Quản trị' : 'Nhân viên');
    var m = location.hash.match(/don=([^&]+)/); if (m) { S.moMa = decodeURIComponent(m[1]); S.trang = 'don'; }
    veMenu(); ve(); taiDon();
    clearInterval(batDau._t); batDau._t = setInterval(function () { if (!document.hidden) taiDon(true); }, 60000); // tự làm mới mỗi phút
  }
  if (DEMO) { var sc = document.createElement('script'); sc.src = 'demo-data.js?v=9'; sc.onload = batDau; document.head.appendChild(sc); } else batDau();
})();
