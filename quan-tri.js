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
  var TEN_QUYEN = { don: 'Duyệt đơn (xác nhận / từ chối / hủy)', giao: 'Kho & giao hàng (xuất kho, đang giao, đã giao)', chua: 'Duyệt chừa hàng / gia hạn / nhả hàng', coc: 'Ghi tiền cọc', ghichu: 'Ghi chú nội bộ', baogia: 'Soạn báo giá (tạo, sửa, xóa, in)', nhapgia: 'Nhập / sửa giá', sanpham: 'Thêm / sửa sản phẩm (mã mới, thông tin, ảnh)', nhapton: 'Nhập tồn kho (mở quyền sửa Sheet Tồn kho)', baocao: 'Xem báo cáo doanh số', nhatky: 'Xem nhật ký thao tác' };
  var LS = {
    get: function (k) { try { return JSON.parse(localStorage.getItem('hn_' + k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('hn_' + k, JSON.stringify(v)); } catch (e) { } }
  };
  var S = { sess: (function (s) { return s && (s.token === 'demo') === DEMO ? s : null; })(LS.get('sess')), don: [], dem: {}, trang: 'tong', loc: '', q: '', moMa: '', soMoiCu: -1,
    ton: null, chuaCfg: [], quyen: null, ls: {}, bc: { kieu: 'thangnay' }, nk: { ds: null, q: '' }, nv: null, gia: { ds: null, q: '' }, tonTT: null, sp: { q: '', nhom: '', tt: '' }, spAn: null, bg: { ds: null, q: '', tt: '', dang: null }, th: { ds: null, chon: {}, q: '' }, tk: { ds: null, q: '', vt: '' }, temQ: { q: '', nhom: '', hang: '', kc: '', loc: {} } };
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
    $('qt-m-tk').hidden = !laAdmin();
    $('qt-m-bg').hidden = !co('baogia');
    $('qt-m-giao').hidden = !(co('giao') || co('don'));
    $('qt-m-gia').hidden = !co('nhapgia');
    $('qt-m-sp').hidden = !co('sanpham');
    $('qt-m-ton').hidden = !(co('nhapton') || co('baocao'));
    var cg = S.don.filter(function (d) { return d.tt === 'xacnhan'; }).length;
    $('qt-badge-giao').hidden = !cg; $('qt-badge-giao').textContent = cg;
  }

  // ---------- Chừa hàng ----------
  function hetHan(d) { return d.tt === 'giu' && d.han && new Date(d.han).getTime() < Date.now(); }
  function sapHet(d) { return d.tt === 'giu' && d.han && new Date(d.han).getTime() < Date.now() + 86400000; }
  function canQuyet(d) { return sapHet(d) || (d.tt === 'giu' && d.xinGH); }
  function ngayNgan(iso) { var x = new Date(iso); return isNaN(x) ? '' : ('0' + x.getDate()).slice(-2) + '/' + ('0' + (x.getMonth() + 1)).slice(-2); }
  function conLai(iso) { var h = new Date(iso).getTime() - Date.now(); if (isNaN(h)) return ''; if (h < 0) return 'quá hạn ' + Math.ceil(-h / 86400000) + ' ngày'; var n = Math.floor(h / 86400000); return n < 1 ? 'hết hạn hôm nay' : 'còn ' + n + ' ngày'; }
  function tuoiTon(iso) { if (!iso) return null; var t = new Date(iso + 'T00:00:00'); if (isNaN(t)) return null; var n = Math.max(0, Math.floor((Date.now() - t.getTime()) / 86400000));
    return { n: n, muc: n <= 30 ? 'moi' : n <= 90 ? 'tb' : n <= 180 ? 'lau' : 'rlau', ten: n <= 30 ? 'Hàng mới' : n <= 90 ? 'Bình thường' : n <= 180 ? 'Tồn lâu' : 'Tồn rất lâu – nên sale', ngay: ('0' + t.getDate()).slice(-2) + '/' + ('0' + (t.getMonth() + 1)).slice(-2) + '/' + t.getFullYear() }; }
  function nhanChua(d) {
    if (d.loai !== 'chua') return '';
    var s = '<br><small class="qt-chua' + (hetHan(d) ? ' het' : '') + '">🔒 ' + (d.nguoiChua ? esc(d.nguoiChua) + ' · ' : '') + 'Chừa ' + d.soNgay + ' ngày' + (d.tt === 'giu' && d.han ? ' · hạn ' + ngayNgan(d.han) + (hetHan(d) ? ' – HẾT HẠN' : '') : '') + '</small>';
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
    var v = { don: veDon, baocao: veBaoCao, nhatky: veNhatKy, nhanvien: veNhanVien, giao: veGiao, gia: veGia, ton: veTon, sanpham: veSanPham, tem: veTem, taikhoan: veTaiKhoan, baogia: veBaoGia }[S.trang] || veTong;
    $('qt-main').innerHTML = v();
    var q = $('qt-q'); if (q) { q.value = S.q; }
    if (S.trang === 'baocao' && !S.bc.kq && !S.bc.dang) taiBaoCao();
    if (S.trang === 'nhatky' && !S.nk.ds) taiNhatKy();
    if (S.trang === 'nhanvien' && !S.nv) taiNhanVien();
    if ((S.trang === 'gia' || S.trang === 'sanpham' || S.trang === 'tem' || (S.trang === 'ton' && co('nhapton'))) && !S.gia.ds) taiGia();
    if (S.trang === 'taikhoan' && !S.tk.ds) taiTaiKhoan();
    if (S.trang === 'baogia' && S.bg.dang && !S.gia.ds) taiGia();
    if (S.trang === 'ton' && !S.tonTT && co('nhapton')) taiTonTT();
  }
  function trongThang(d) { var x = new Date(d.ngay), n = new Date(); return x.getMonth() === n.getMonth() && x.getFullYear() === n.getFullYear(); }
  function veTong() {
    var homNay = new Date().toDateString();
    var nay = S.don.filter(function (d) { return new Date(d.ngay).toDateString() === homNay; });
    var thang = S.don.filter(function (d) { return trongThang(d) && ['xacnhan', 'danggiao', 'dagiao'].indexOf(d.tt) >= 0; });
    var ds = thang.reduce(function (t, d) { return t + d.tong; }, 0);
    var cho = S.don.filter(function (d) { return d.tt === 'moi'; }).slice(0, 15);
    var quyet = S.don.filter(canQuyet);
    return '<div class="qt-h1">Bảng điều khiển <small>' + esc(CFG.TEN_DAY_DU || '') + '</small>' + NUT_LM +
      (laAdmin() ? '<button type="button" class="btn btn-vien btn-nho" data-qt-act="xoa-dem" title="Sửa Sheet xong muốn app đại lý thấy ngay">⟳ Lấy dữ liệu mới từ Sheet</button>' : '') + '</div>' +
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
      return [d.ma, d.ten, d.sdt, d.user, d.diaChi, d.nguoiChua].concat(d.items.map(function (x) { return x.ma; })).join(' ').toLowerCase().indexOf(q) >= 0;
    });
  }
  function veDon() {
    var ds = locDon();
    return '<div class="qt-h1">Đơn hàng <small>' + S.don.length + ' đơn gần nhất</small>' + NUT_LM + (laAdmin() && S.don.length ? '<button type="button" class="btn btn-vien btn-nho nut-xoa-het" data-qt-act="xoa-het-don">🗑 Xóa toàn bộ đơn</button>' : '') + '</div>' +
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
      (d.loai === 'chua' ? '<span>Người chừa</span><div><b>' + (esc(d.nguoiChua) || '<span class="qt-thieu">(chưa ghi)</span>') + '</b></div>' : '') +
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
    h += '<label class="qt-nc">Người chừa hàng<input id="qt-nc" maxlength="80" value="' + esc(d.nguoiChua || '') + '"' + (cc ? '' : ' disabled') + ' placeholder="Tên người chừa"></label>';
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
    if (d.loai === 'chua') { p.coc = gc.coc; p.daCoc = gc.daCoc; if ($('qt-nc') && !$('qt-nc').disabled) p.nguoiChua = $('qt-nc').value.trim(); }
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
      S.gia.ds = r.data || []; if (S.trang === 'gia' || S.trang === 'sanpham' || S.trang === 'tem' || S.trang === 'baogia' || S.trang === 'ton') ve();
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
      '<table class="qt-bang qt-gia"><thead><tr><th>Mã / tên</th><th class="an-dt">Hãng · ĐVT</th><th class="so">Giá niêm yết</th><th class="so">Giá đại lý</th><th class="so">NY / viên</th><th class="so">ĐL / viên</th><th></th></tr></thead><tbody>' +
      ds.slice(0, 60).map(function (p) {
        return '<tr><td><b>' + esc(p.ma) + '</b><br><small>' + esc(p.ten) + '</small></td><td class="an-dt"><small>' + esc(p.hang) + ' · ' + esc(p.dvt) + '</small></td>' +
          oGia(p, 'ny') + oGia(p, 'dl') + (p.m2Vien ? oGia(p, 'nyV') + oGia(p, 'dlV') : '<td class="so"><small class="mo">—</small></td><td class="so"><small class="mo">—</small></td>') +
          '<td><button type="button" class="btn btn-chinh btn-nho" data-gia-luu="' + esc(p.ma) + '">Lưu</button></td></tr>';
      }).join('') + '</tbody></table>';
  }
  // Ô giá: số tự tính (từ giá m² ↔ giá viên) hiện mờ ở placeholder, không điền sẵn – gõ vào là ghi đè.
  function oGia(p, k) {
    var tu = p[k + 'Tu'], v = p[k];
    return '<td class="so"><input class="qt-so-o' + (k.length > 2 ? ' o-vien' : '') + '" inputmode="numeric" data-gia-' + k.toLowerCase() + '="' + esc(p.ma) + '" value="' + (!tu && v ? so(v) : '') + '" placeholder="' + (tu && v ? '≈ ' + so(v) : '0') + '" title="' + (tu ? 'Đang tự tính – gõ số để đặt giá riêng' : '') + '"></td>';
  }
  function luuGia(ma, nut) {
    var gt = function (k) { var el = document.querySelector('[data-gia-' + k + '="' + ma + '"]'); return el ? el.value.replace(/[^\d]/g, '') : ''; };
    var ny = gt('ny'), dl = gt('dl'), nyV = gt('nyv'), dlV = gt('dlv');
    if (dl && ny && Number(dl) > Number(ny) && !confirm('Giá đại lý cao hơn giá niêm yết – vẫn lưu?')) return;
    nut.disabled = true;
    api('suaGia', { ma: ma, ny: ny, dl: dl, nyV: nyV, dlV: dlV }, true).then(function (r) {
      nut.disabled = false;
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      S.gia.ds = null; taiGia(); // tải lại để thấy giá viên / m² tự tính mới
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
    ['Giá', [['ny', 'Giá niêm yết (đ / đơn vị)', 'vd 258000'], ['dl', 'Giá đại lý (đ / đơn vị)', 'vd 215000'], ['nyV', 'Giá NY / viên (gạch)', 'trống = tự tính từ giá m²'], ['dlV', 'Giá ĐL / viên (gạch)', 'trống = tự tính từ giá m²']]],
    ['Thuộc tính (bộ lọc trên app)', [['mau', 'Màu', '', 'dl-mau'], ['hoaVan', 'Hoa văn / vân', '', 'dl-hoaVan'], ['men', 'Men / bề mặt', 'vd Bóng, Mờ', 'dl-men'],
      ['congNang', 'Công năng', 'vd Lát nền, Ốp tường', 'dl-congNang'], ['tinhNang', 'Tính năng', 'vd Chống trơn', 'dl-tinhNang'], ['dungTich', 'Dung tích', 'vd 18L, 5L']]],
    ['Khác', [['gc', 'Ghi chú', ''], ['anh', 'Link ảnh Google Drive', 'Chia sẻ "Bất kỳ ai có đường liên kết"'], ['maKho', 'Mã bên phần mềm kho (nếu khác mã hàng)', 'để tồn kho tự khớp']]]
  ];
  // ---------- Mã có trong kho, chưa có trong bảng giá -> thêm hàng loạt ----------
  function taiThieu() {
    S.th.ds = null;
    api('maKhoThieuGia', {}).then(function (r) {
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      S.th.ds = r.data; S.th.nhom = r.nhom || []; S.th.hang = r.hang || []; S.th.chon = {};
      r.data.forEach(function (x) { if (x.nhom) S.th.chon[x.ma] = 1; }); // đoán được nhóm thì chọn sẵn
      if (S.trang === 'sanpham') ve();
    }).catch(function (e) { S.th.ds = []; S.th.loi = e.message; if (S.trang === 'sanpham') ve(); });
  }
  function locThieu() {
    var q = boDau(S.th.q).trim();
    return (S.th.ds || []).filter(function (x) { return !q || boDau([x.ma, x.ten, x.nhom, x.hang].join(' ')).indexOf(q) >= 0; });
  }
  function veThieu() {
    var h = '<div class="qt-h1"><button type="button" class="btn btn-vien btn-nho" data-qt-act="sp-ve-ds">← Sản phẩm</button> Mã trong kho chưa có trong bảng giá' +
      '<small>' + (S.th.ds ? S.th.ds.length + ' mã' : '') + '</small><button type="button" class="btn btn-vien btn-nho qt-lm" data-qt-act="th-tai-lai">↻ Quét lại</button></div>' +
      '<p class="mo qt-ghi">App chỉ hiện sản phẩm có trong tab Giá. Đây là các mã đã có trong Sheet Tồn kho nhưng chưa có dòng trong tab Giá. Kiểm tra nhóm hàng (máy đã đoán sẵn theo tên), tick chọn rồi bấm <b>Thêm vào bảng giá</b>. Giá điền sau – trong lúc chưa có giá, app hiện "Liên hệ báo giá".</p>';
    if (!S.th.ds) return h + '<div class="qt-khung"><div class="qt-trong">Đang quét Sheet Tồn kho…</div></div>';
    if (S.th.loi) return h + '<div class="qt-khung"><div class="qt-trong">Không quét được: ' + esc(S.th.loi) + '</div></div>';
    if (!S.th.ds.length) return h + '<div class="qt-khung"><div class="qt-trong">✓ Mọi mã trong kho đều đã có trong bảng giá.</div></div>';
    var ds = locThieu(), soChon = S.th.ds.filter(function (x) { return S.th.chon[x.ma]; }).length, hetDs = ds.length && ds.every(function (x) { return S.th.chon[x.ma]; });
    var dl = function (id, arr) { return '<datalist id="' + id + '">' + arr.map(function (v) { return '<option value="' + esc(v) + '">'; }).join('') + '</datalist>'; };
    var nhomGoiY = (S.th.nhom || []).concat((CFG.NHOM_HANG || []).map(function (n) { return n.ten; })).filter(function (v, i, arr) { return arr.indexOf(v) === i; });
    h += dl('dl-th-nhom', nhomGoiY) + dl('dl-th-hang', S.th.hang || []) + dl('dl-th-dvt', ['m²', 'cái', 'bộ', 'thùng', 'bao', 'lon', 'viên', 'chai', 'cây', 'tấm', 'cuộn', 'kg']);
    h += '<div class="qt-khung th-thanh"><input id="qt-th-q" type="search" placeholder="Lọc theo mã, tên, nhóm, hãng…" value="' + esc(S.th.q) + '">' +
      '<span class="th-gan"><input id="qt-th-nhom" list="dl-th-nhom" placeholder="Nhóm hàng…"><button type="button" class="btn btn-vien btn-nho" data-qt-act="th-gan-nhom">Gán nhóm cho mã đã chọn</button></span>' +
      '<span class="th-gan"><input id="qt-th-hang" list="dl-th-hang" placeholder="Hãng…"><button type="button" class="btn btn-vien btn-nho" data-qt-act="th-gan-hang">Gán hãng</button></span>' +
      '<button type="button" class="btn btn-chinh" data-qt-act="th-them"' + (soChon ? '' : ' disabled') + '>＋ Thêm ' + soChon + ' mã vào bảng giá</button></div>';
    h += '<div class="qt-khung"><table class="qt-bang th-bang"><thead><tr><th><button type="button" class="tm-tat-ca' + (hetDs ? ' co' : soChon ? ' mot-phan' : '') + '" data-qt-act="th-chon-het" title="Chọn / bỏ chọn tất cả đang lọc"><i>' + (hetDs ? '✓' : soChon ? '–' : '') + '</i></button></th>' +
      '<th>Mã / tên vật tư</th><th>Nhóm hàng *</th><th class="an-dt">Hãng</th><th>Đơn vị *</th><th class="so an-dt">Tồn</th></tr></thead><tbody>' +
      ds.slice(0, 400).map(function (x) {
        var i = S.th.ds.indexOf(x), c = S.th.chon[x.ma];
        return '<tr class="' + (c ? 'th-chon' : '') + '"><td><button type="button" class="tm-tat-ca' + (c ? ' co' : '') + '" data-th-chon="' + esc(x.ma) + '"><i>' + (c ? '✓' : '') + '</i></button></td>' +
          '<td><b>' + esc(x.ma) + '</b><br><small>' + esc(x.ten) + (x.kc ? ' · ' + esc(x.kc) : '') + (x.dg ? ' · ' + esc(x.dg) : '') + '</small></td>' +
          '<td><input class="th-o' + (x.nhom ? '' : ' thieu') + '" list="dl-th-nhom" data-th="' + i + '|nhom" value="' + esc(x.nhom) + '" placeholder="chọn nhóm"></td>' +
          '<td class="an-dt"><input class="th-o" list="dl-th-hang" data-th="' + i + '|hang" value="' + esc(x.hang) + '"></td>' +
          '<td><input class="th-o th-dv" list="dl-th-dvt" data-th="' + i + '|dvt" value="' + esc(x.dvt) + '"></td>' +
          '<td class="so an-dt">' + (x.ton > 0 ? so(x.ton) : '<small class="qt-thieu">' + so(x.ton) + '</small>') + '<br><small>' + esc(x.kho.join(', ')) + '</small></td></tr>';
      }).join('') + '</tbody></table>' + (ds.length > 400 ? '<p class="mo" style="padding:8px 14px">Hiện 400 mã đầu – lọc để xem thêm. "Chọn tất cả" vẫn áp cho đủ ' + ds.length + ' mã.</p>' : '') + '</div>';
    return h;
  }
  function themThieu(nut) {
    var ds = S.th.ds.filter(function (x) { return S.th.chon[x.ma]; });
    var thieu = ds.filter(function (x) { return !x.nhom || !x.dvt || !x.ten; });
    if (thieu.length) { toast(thieu.length + ' mã đã chọn chưa có Nhóm hàng / Đơn vị – vd ' + thieu[0].ma); return; }
    if (!confirm('Thêm ' + ds.length + ' mã vào tab Giá của bảng giá?')) return;
    nut.disabled = true; nut.textContent = 'Đang thêm…';
    api('themHangLoat', { ds: ds.map(function (x) { return { ma: x.ma, ten: x.ten, nhom: x.nhom, hang: x.hang, dvt: x.dvt, dg: x.dg, kc: x.kc }; }) }, true).then(function (r) {
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      toast(r.msg); S.gia.ds = null; S.nk.ds = null; taiThieu(); ve();
    }).catch(function (e) { nut.disabled = false; toast('Không thêm được: ' + e.message); ve(); });
  }
  function veSanPham() {
    if (!co('sanpham')) return '<div class="qt-trong">Tài khoản chưa có quyền thêm / sửa sản phẩm.</div>';
    if (S.sp.cheDo === 'thieu') return veThieu();
    var nhom = {}; (S.gia.ds || []).forEach(function (p) { if (p.nhom) nhom[p.nhom] = (nhom[p.nhom] || 0) + 1; });
    return '<div class="qt-h1">Sản phẩm <small>' + (S.gia.ds ? S.gia.ds.length + ' mã đang hiện' + (S.spAn && S.spAn.length ? ' · ' + S.spAn.length + ' mã đang ẩn' : '') : '') + '</small>' +
      '<button type="button" class="btn btn-vien btn-nho qt-lm" data-qt-act="sp-thieu">📥 Mã trong kho chưa có giá' + (S.th.ds ? ' (' + S.th.ds.length + ')' : '') + '</button>' +
      '<button type="button" class="btn btn-chinh btn-nho" data-qt-act="sp-moi">＋ Thêm sản phẩm mới</button></div>' +
      '<div class="qt-loc"><input id="qt-sp-q" type="search" placeholder="Tìm mã, tên, hãng, kích cỡ…" value="' + esc(S.sp.q) + '">' +
      '<select id="qt-sp-nhom" class="qt-chon"><option value="">Tất cả nhóm</option>' + Object.keys(nhom).sort().map(function (n) { return '<option' + (S.sp.nhom === n ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select>' +
      [['', 'Tất cả'], ['hien', 'Đang hiện'], ['an', 'Đang ẩn']].map(function (t) { return '<button type="button" class="chip' + (S.sp.tt === t[0] ? ' on' : '') + '" data-sp-tt="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="qt-khung" id="qt-sp-ds">' + bangSP() + '</div>' +
      '<p class="mo" style="margin-top:10px">Cột <b>Trên app</b>: bấm để ẩn / hiện mã trên app bảng giá (không xóa dữ liệu). Thêm hàng loạt thì dán thẳng vào tab Giá của Sheet chính.</p>';
  }
  function taiSPAn() {
    api('dsSanPhamAn', {}).then(function (r) { S.spAn = r && r.status === 'ok' ? r.data : []; if (S.trang === 'sanpham') { var e = $('qt-sp-ds'); if (e) { ve(); } } }).catch(function () { S.spAn = []; });
  }
  function bangSP() {
    if (!S.gia.ds) return '<div class="qt-trong">Đang tải…</div>';
    if (S.spAn === null) taiSPAn();
    var q = boDau(S.sp.q).trim().split(/\s+/).filter(String);
    var tatCa = S.sp.tt === 'an' ? (S.spAn || []) : S.sp.tt === 'hien' ? S.gia.ds : S.gia.ds.concat(S.spAn || []);
    var ds = tatCa.filter(function (p) {
      if (S.sp.nhom && p.nhom !== S.sp.nhom) return false;
      var s = boDau([p.ma, p.ten, p.tenGoc, p.hang, p.kc, p.nhom, p.mau].join(' '));
      return q.every(function (w) { return s.indexOf(w) >= 0; });
    });
    if (!ds.length) return '<div class="qt-trong">Không có mã phù hợp</div>';
    return '<div class="qt-trong-nho">' + ds.length + ' mã' + (ds.length > 80 ? ' – hiện 80 mã đầu, gõ thêm để lọc' : '') + '</div>' +
      '<table class="qt-bang"><thead><tr><th>Mã / tên</th><th class="giua">Trên app</th><th class="an-dt">Nhóm · hãng</th><th class="an-dt">Kích cỡ · ĐVT</th><th class="so">Giá NY / ĐL</th><th></th></tr></thead><tbody>' +
      ds.slice(0, 80).map(function (p) {
        return '<tr class="dong' + (p.an ? ' sp-an' : '') + '" data-sp-sua="' + esc(p.ma) + '"><td><b>' + esc(p.ma) + '</b><br><small>' + esc(p.ten) + '</small></td>' +
          '<td class="giua"><button type="button" class="cong-tac' + (p.an ? '' : ' bat') + '" data-sp-an="' + esc(p.ma) + '" title="' + (p.an ? 'Đang ẩn – bấm để hiện trên app' : 'Đang hiện – bấm để ẩn khỏi app') + '"><i></i><span>' + (p.an ? 'Ẩn' : 'Hiện') + '</span></button></td>' +
          '<td class="an-dt"><small>' + esc(p.nhom) + '<br>' + esc(p.hang) + '</small></td>' +
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
          var k = o[0], v = sp[k] == null ? '' : sp[k], laSo = k === 'ny' || k === 'dl' || k === 'nyV' || k === 'dlV';
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
    goiYGiaVien();
  }
  // Form Sản phẩm: m² một viên = (m²/thùng) / (viên/thùng) -> gợi ý giá viên ↔ giá m² ở placeholder
  function goiYGiaVien() {
    var g = function (k) { var e = document.querySelector('[data-sp=' + k + ']'); return e ? e : null; };
    var vt = Number((g('vt') || {}).value) || 0, m2 = parseFloat(String((g('m2') || {}).value || '').replace(',', '.')) || 0, mv = vt && m2 ? m2 / vt : 0;
    [['ny', 'nyV'], ['dl', 'dlV']].forEach(function (k) {
      var eM = g(k[0]), eV = g(k[1]); if (!eM || !eV) return;
      var vM = Number(eM.value.replace(/[^\d]/g, '')) || 0, vV = Number(eV.value.replace(/[^\d]/g, '')) || 0;
      eV.placeholder = mv && vM && !vV ? '≈ ' + so(Math.round(vM * mv / 100) * 100) + ' (tự tính)' : 'trống = tự tính từ giá m²';
      eM.placeholder = mv && vV && !vM ? '≈ ' + so(Math.round(vV / mv)) + ' (tự tính từ giá viên)' : 'vd 258000';
    });
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
    ['ny', 'dl', 'nyV', 'dlV'].forEach(function (k) { f[k] = (f[k] || '').replace(/[^\d]/g, ''); });
    if (f.dl && f.ny && Number(f.dl) > Number(f.ny) && !confirm('Giá đại lý cao hơn giá niêm yết – vẫn lưu?')) return;
    var gui = {}, goc = S.sp.goc || {};
    ['hang', 'nhom', 'ten', 'tenHien', 'kc', 'loai', 'dvt', 'dg', 'ny', 'dl', 'nyV', 'dlV', 'gc', 'mau', 'congNang', 'tinhNang', 'hoaVan', 'men', 'dungTich'].forEach(function (k) {
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
  // IN TEM GIÁ (quản trị / nhân viên). Giỏ tem lưu trên máy, dùng chung với app trên cùng trình duyệt.
  // ============================================================
  var GT = { gio: LS.get('giotem') || [], cfg: LS.get('temcfg') || { kho: 'the', w: 60, h: 40 }, daIn: LS.get('tem_dain') || {} };
  if (GT.cfg.tenCH === undefined) { GT.cfg.tenCH = CFG.LIEN_HE_TEN || CFG.TEN_APP || ''; GT.cfg.sdtCH = CFG.LIEN_HE_SDT || ''; }
  function luuGT() { LS.set('giotem', GT.gio); LS.set('temcfg', GT.cfg); }
  function spTheoMa(ma) { var p = (S.gia.ds || []).filter(function (x) { return x.ma === ma; })[0]; return p ? window.TEM_HN.chuanSP(p) : null; }
  function khoGT() { var K = window.TEM_HN.KHO, k = K[GT.cfg.kho] || K.the; return GT.cfg.kho === 'tuy' ? { ten: k.ten, w: Number(GT.cfg.w) || 60, h: Number(GT.cfg.h) || 40 } : k; }
  function giaGT(it) { var p = spTheoMa(it.ma); return it.gia !== '' && it.gia != null ? Number(it.gia) || 0 : (p ? p.ny || 0 : 0); }
  function linkXemMau(ma) {
    var goc = location.href.split('#')[0].replace(/quan-tri\.html.*$/, '').replace(/\?.*$/, '');
    var dt = String(GT.cfg.sdtCH || '').replace(/[^\d+]/g, '');
    return goc + '#xem=' + encodeURIComponent(ma) + (GT.cfg.tenCH ? '&ch=' + encodeURIComponent(GT.cfg.tenCH) : '') + (dt ? '&dt=' + dt : '');
  }
  function temHtml(it) {
    var p = spTheoMa(it.ma) || { ma: it.ma, _ten: it.ma, dvt: '' };
    return window.TEM_HN.htmlTem({ p: p, gia: giaGT(it), logo: CFG.LOGO, logoDay: CFG.LOGO_DAY_DU, tenApp: CFG.TEN_APP, link: linkXemMau(it.ma) }, khoGT());
  }
  function themGT(ma, so) { var it = GT.gio.filter(function (x) { return x.ma === ma; })[0]; if (it) it.so += so || 1; else GT.gio.push({ ma: ma, so: so || 1, gia: '' }); luuGT(); }
  function maDoiGiaGT() { return Object.keys(GT.daIn).filter(function (m) { var p = spTheoMa(m); return p && p.ny > 0 && GT.daIn[m].ny != null && Number(GT.daIn[m].ny) !== p.ny; }); }
  var LOC_TEM = [['conHang', 'Còn hàng'], ['coGia', 'Có giá'], ['chuaIn', 'Chưa in tem'], ['doiGia', 'Đã đổi giá'], ['trongGio', 'Đang trong giỏ']];
  function locTem(boQua) { // boQua: bỏ qua 1 điều kiện (để đếm số lựa chọn cho ô chọn đó)
    var q = boDau(S.temQ.q).trim().split(/\s+/).filter(String), L = S.temQ.loc, doi = L.doiGia ? maDoiGiaGT() : null;
    return (S.gia.ds || []).filter(function (p) {
      if (S.temQ.nhom && boQua !== 'nhom' && p.nhom !== S.temQ.nhom) return false;
      if (S.temQ.hang && boQua !== 'hang' && p.hang !== S.temQ.hang) return false;
      if (S.temQ.kc && boQua !== 'kc' && (p.kc || '') !== S.temQ.kc) return false;
      if (L.conHang && !(S.ton && S.ton[p.ma] && S.ton[p.ma].tong > 0)) return false;
      if (L.coGia && !(p.ny > 0)) return false;
      if (L.chuaIn && GT.daIn[p.ma]) return false;
      if (L.doiGia && doi.indexOf(p.ma) < 0) return false;
      if (L.trongGio && !GT.gio.some(function (x) { return x.ma === p.ma; })) return false;
      if (!q.length) return true;
      var s = boDau([p.ma, p.ten, p.tenGoc, p.hang, p.kc].join(' '));
      return q.every(function (w) { return s.indexOf(w) >= 0; });
    });
  }
  function chonTem(id, nhan, khoa) { // ô chọn có đếm số mã
    var dem = {}; locTem(khoa).forEach(function (p) { var v = p[khoa] || ''; if (v) dem[v] = (dem[v] || 0) + 1; });
    var gt = S.temQ[khoa];
    if (gt && !dem[gt]) dem[gt] = 0;
    return '<select id="' + id + '" class="qt-chon" data-tem-chon="' + khoa + '"><option value="">' + nhan + '</option>' + Object.keys(dem).sort(function (x, y) { return x.localeCompare(y, 'vi', { numeric: true }); })
      .map(function (v) { return '<option value="' + esc(v) + '"' + (gt === v ? ' selected' : '') + '>' + esc(v) + ' (' + dem[v] + ')</option>'; }).join('') + '</select>';
  }
  function boLocTem() {
    return '<div class="tm-loc"><input id="qt-tem-q" type="search" placeholder="Tìm mã, tên, hãng, kích cỡ…" value="' + esc(S.temQ.q) + '"></div>' +
      '<div class="tm-loc tm-loc-2">' + chonTem('qt-tem-nhom', 'Tất cả nhóm', 'nhom') + chonTem('qt-tem-hang', 'Tất cả hãng', 'hang') + chonTem('qt-tem-kc', 'Mọi kích cỡ', 'kc') + '</div>' +
      '<div class="qt-loc tm-chip tm-loc-3">' + LOC_TEM.map(function (l) { return '<button type="button" class="chip' + (S.temQ.loc[l[0]] ? ' on' : '') + '" data-tem-loc="' + l[0] + '">' + l[1] + '</button>'; }).join('') +
      (S.temQ.q || S.temQ.nhom || S.temQ.hang || S.temQ.kc || Object.keys(S.temQ.loc).some(function (k) { return S.temQ.loc[k]; }) ? '<button type="button" class="chip tm-bo" data-qt-act="tem-bo-loc">✕ Bỏ lọc</button>' : '') + '</div>';
  }
  function dsTimTem() {
    if (!S.gia.ds) return '<div class="qt-trong">Đang tải bảng giá…</div>';
    if (S.temQ.loc.conHang && !S.ton) { taiTon().then(function () { var e = $('qt-tem-tim'); if (e) e.innerHTML = dsTimTem(); }); return '<div class="qt-trong">Đang tải tồn kho…</div>'; }
    var ds = locTem();
    if (!ds.length) return '<div class="qt-trong">Không có mã phù hợp</div>';
    var trong = {}; GT.gio.forEach(function (x) { trong[x.ma] = 1; });
    var daChon = ds.filter(function (p) { return trong[p.ma]; }).length, het = daChon === ds.length;
    return '<div class="tm-dau-ds"><button type="button" class="tm-tat-ca' + (het ? ' co' : daChon ? ' mot-phan' : '') + '" data-qt-act="tem-chon-het"' + (!het && ds.length > 500 ? ' disabled title="Lọc bớt (tối đa 500 mã một lần)"' : '') + '>' +
      '<i>' + (het ? '✓' : daChon ? '–' : '') + '</i>' + (het ? 'Bỏ chọn ' : 'Chọn tất cả ') + ds.length + ' mã đang lọc</button><small>' + (daChon ? 'đã chọn ' + daChon + '/' + ds.length : '') + '</small></div>' +
      '<div class="tm-ds">' + ds.slice(0, 100).map(function (p) {
        var co = trong[p.ma], ton = S.ton && S.ton[p.ma];
        return '<button type="button" class="tm-sp' + (co ? ' co' : '') + '" data-tem-them="' + esc(p.ma) + '"><i>' + (co ? '✓' : '') + '</i><span><b>' + esc(p.ten) + '</b><small>' + esc(p.ma) + (p.kc ? ' · ' + esc(p.kc) : '') + (p.ny ? ' · ' + tien(p.ny) : ' · chưa có giá') +
          (GT.daIn[p.ma] ? ' · đã in' : '') + (ton ? ' · tồn ' + so(ton.tong) : '') + '</small></span></button>';
      }).join('') + '</div>' + (ds.length > 100 ? '<p class="mo" style="padding:8px 14px">Hiện 100 mã đầu – "Chọn tất cả" vẫn chọn đủ ' + ds.length + ' mã.</p>' : '');
  }
  function veTem() {
    var nhom = {}; (S.gia.ds || []).forEach(function (p) { if (p.nhom) nhom[p.nhom] = 1; });
    var kho = khoGT(), tong = GT.gio.reduce(function (s, x) { return s + Math.max(0, x.so | 0); }, 0), doi = S.gia.ds ? maDoiGiaGT() : [];
    var K = window.TEM_HN.KHO;
    return '<div class="qt-h1">In tem giá <small>tem dán sản phẩm có QR → khách quét xem mẫu</small></div>' +
      (doi.length ? '<div class="qt-xin" style="margin-bottom:12px">🔁 ' + doi.length + ' mã đã đổi giá so với tem in trước<span><button type="button" class="btn btn-cam btn-nho" data-qt-act="tem-doi-gia">Thêm vào giỏ tem</button></span></div>' : '') +
      '<div class="tm-luoi"><div class="qt-khung tm-trai"><h2>1. Chọn mã</h2><div id="qt-tem-loc">' + boLocTem() + '</div>' +
      '<div id="qt-tem-tim">' + dsTimTem() + '</div></div>' +
      '<div class="qt-khung tm-phai"><h2>2. Giỏ tem <small>' + GT.gio.length + ' mã · ' + tong + ' tem</small></h2><div class="tm-noi">' +
      '<div class="tm-nhan">Khổ tem</div><div class="qt-loc tm-chip">' + Object.keys(K).map(function (k) { return '<button type="button" class="chip' + (GT.cfg.kho === k ? ' on' : '') + '" data-tem-kho="' + k + '">' + K[k].ten + '</button>'; }).join('') + '</div>' +
      (GT.cfg.kho === 'tuy' ? '<div class="qt-o-luoi"><label>Rộng (mm)<input type="number" min="25" max="150" data-tem-cfg="w" value="' + esc(GT.cfg.w) + '"></label><label>Cao (mm)<input type="number" min="15" max="120" data-tem-cfg="h" value="' + esc(GT.cfg.h) + '"></label></div>' : '') +
      '<div class="tm-nhan">Khách quét QR thấy liên hệ</div><div class="qt-o-luoi"><label>Tên cửa hàng<input data-tem-cfg="tenCH" value="' + esc(GT.cfg.tenCH || '') + '"></label><label>Số điện thoại<input data-tem-cfg="sdtCH" inputmode="tel" value="' + esc(GT.cfg.sdtCH || '') + '"></label></div>' +
      (GT.gio.length ? '<div class="tm-tat-so"><span>Mỗi mã</span><input type="number" min="1" max="99" id="qt-tem-so" value="' + (GT.soMoi || 1) + '"><span>tem</span><button type="button" class="btn btn-vien btn-nho" data-qt-act="tem-so-het">Áp dụng cho ' + GT.gio.length + ' mã</button></div>' +
        '<div class="tm-gio">' + GT.gio.map(function (it, i) {
        var p = spTheoMa(it.ma);
        return '<div class="tm-dong"><span><b>' + esc(p ? p._ten : it.ma) + '</b><small>' + esc(it.ma) + '</small></span>' +
          '<input class="qt-so-o" inputmode="numeric" data-tem-gia="' + i + '" value="' + (giaGT(it) ? so(giaGT(it)) : '') + '" placeholder="Giá in" title="Giá in (chỉ in ra tem)">' +
          '<span class="tm-sl"><button type="button" data-tem-sl="' + i + '" data-d="-1">−</button><b>' + it.so + '</b><button type="button" data-tem-sl="' + i + '" data-d="1">＋</button></span></div>';
      }).join('') + '</div><div class="tm-nhan">Xem trước</div><div class="tm-xem">' + temHtml(GT.gio[0]) + '</div>' +
        '<p class="mo">Hộp thoại in: khổ giấy ' + kho.w + '×' + kho.h + ' mm' + (kho.a4 ? ' (giấy A4)' : '') + ', lề = Không, tỉ lệ 100%. Không có máy in tem: chọn "Lưu dưới dạng PDF".</p>'
        : '<div class="qt-trong">Chưa có mã – bấm ＋ ở danh sách bên trái.</div>') +
      '</div><div class="tm-chan"><button type="button" class="btn btn-vien" data-qt-act="tem-xoa"' + (GT.gio.length ? '' : ' disabled') + '>Xóa hết</button>' +
      '<button type="button" class="btn btn-chinh" data-qt-act="tem-in"' + (tong ? '' : ' disabled') + '>🖨 In ' + tong + ' tem</button></div></div></div>';
  }
  function inTemQT() {
    var ds = []; GT.gio.forEach(function (it) { for (var i = 0; i < Math.max(0, it.so | 0); i++) ds.push(temHtml(it)); });
    if (!ds.length) return;
    var ngay = new Date().toISOString();
    GT.gio.forEach(function (it) { var p = spTheoMa(it.ma); GT.daIn[it.ma] = { gia: giaGT(it), ny: p ? p.ny || 0 : 0, ngay: ngay }; });
    LS.set('tem_dain', GT.daIn);
    window.TEM_HN.inTem(ds, khoGT());
  }

  // ============================================================
  // TÀI KHOẢN (chỉ quản trị): thêm / sửa / khóa – đại lý, nhân viên, quản trị.
  // ============================================================
  var TEN_VT = { admin: 'Quản trị', nv: 'Nhân viên', khachhang: 'Đại lý' };
  function taiTaiKhoan() {
    api('listUsers', {}).then(function (r) {
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      S.tk.ds = r.data || []; if (S.trang === 'taikhoan') ve();
    }).catch(function (e) { toast('Không tải được tài khoản: ' + e.message); });
  }
  function veTaiKhoan() {
    if (!laAdmin()) return '<div class="qt-trong">Chỉ quản trị.</div>';
    var dem = { khachhang: 0, nv: 0, admin: 0 }; (S.tk.ds || []).forEach(function (u) { dem[u.role] = (dem[u.role] || 0) + 1; });
    return '<div class="qt-h1">Tài khoản <small>' + (S.tk.ds ? S.tk.ds.length + ' tài khoản' : '') + '</small><button type="button" class="btn btn-chinh btn-nho qt-lm" data-qt-act="tk-moi">＋ Thêm tài khoản</button></div>' +
      '<div class="qt-loc"><button type="button" class="chip' + (S.tk.vt ? '' : ' on') + '" data-tk-vt="">Tất cả</button>' +
      ['khachhang', 'nv', 'admin'].map(function (v) { return '<button type="button" class="chip' + (S.tk.vt === v ? ' on' : '') + '" data-tk-vt="' + v + '">' + TEN_VT[v] + ' <small>' + (dem[v] || 0) + '</small></button>'; }).join('') +
      '<input id="qt-tk-q" type="search" placeholder="Tìm tên, tài khoản, cửa hàng, SĐT…" value="' + esc(S.tk.q) + '"></div>' +
      '<div class="qt-khung" id="qt-tk-ds">' + bangTK() + '</div>' +
      '<p class="mo" style="margin-top:10px">Quyền chi tiết của nhân viên: mục "Nhân viên & quyền".</p>';
  }
  function bangTK() {
    if (!S.tk.ds) return '<div class="qt-trong">Đang tải…</div>';
    var q = boDau(S.tk.q).trim();
    var ds = S.tk.ds.filter(function (u) { return (!S.tk.vt || u.role === S.tk.vt) && (!q || boDau([u.username, u.ten, u.tenCty, u.sdt].join(' ')).indexOf(q) >= 0); });
    if (!ds.length) return '<div class="qt-trong">Không có tài khoản phù hợp</div>';
    return '<table class="qt-bang"><thead><tr><th>Tài khoản</th><th>Vai trò</th><th class="an-dt">Cửa hàng / SĐT</th><th>Tình trạng</th></tr></thead><tbody>' +
      ds.map(function (u) {
        return '<tr class="dong" data-tk="' + esc(u.username) + '"><td><b>' + esc(u.ten || u.username) + '</b><br><small>' + esc(u.username) + '</small></td><td><span class="tt tt-vt-' + u.role + '">' + (TEN_VT[u.role] || '?') + '</span></td>' +
          '<td class="an-dt"><small>' + esc(u.tenCty || '') + (u.sdt ? '<br>' + esc(u.sdt) : '') + '</small></td><td>' + (u.khoa ? '<span class="tt tt-huy">Đã khóa</span>' : u.coMatKhau ? '<span class="tt tt-dagiao">Hoạt động</span>' : '<span class="tt tt-moi">Chưa có mật khẩu</span>') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }
  function formTK(u) {
    var moi = !u; u = u || { role: S.tk.vt || 'khachhang' };
    $('qt-ngan').innerHTML = '<div class="sh-head"><h3>' + (moi ? '＋ Thêm tài khoản' : 'Sửa ' + esc(u.username)) + '</h3><button type="button" class="sh-x" data-qt-act="dong-sp" aria-label="Đóng">✕</button></div>' +
      '<div class="sh-body"><div class="qt-o-luoi">' +
      '<label>Tên đăng nhập *<input data-tk-f="username" value="' + esc(u.username || '') + '"' + (moi ? '' : ' readonly') + ' autocapitalize="none" placeholder="vd dl_minhphat"></label>' +
      '<label>Vai trò<select class="qt-chon" data-tk-f="role">' + ['khachhang', 'nv', 'admin'].map(function (r) { return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + TEN_VT[r] + '</option>'; }).join('') + '</select></label>' +
      '<label class="rong">Họ tên<input data-tk-f="ten" value="' + esc(u.ten || '') + '"></label>' +
      '<label class="rong">Tên cửa hàng / công ty<input data-tk-f="tenCty" value="' + esc(u.tenCty || '') + '"></label>' +
      '<label>Số điện thoại<input data-tk-f="sdt" inputmode="tel" value="' + esc(u.sdt || '') + '"></label>' +
      '<label>Mật khẩu ' + (moi ? '* (từ 6 ký tự)' : '(để trống = giữ nguyên)') + '<input data-tk-f="password" type="text" autocomplete="new-password"></label>' +
      '<label class="rong">Địa chỉ<input data-tk-f="diaChi" value="' + esc(u.diaChi || '') + '"></label></div>' +
      '<label class="qt-chk" style="margin-top:12px"><input type="checkbox" data-tk-f="khoa"' + (u.khoa ? ' checked' : '') + '> Khóa tài khoản (đăng xuất ngay, không đăng nhập được)</label></div>' +
      '<div class="sh-foot"><div class="qt-hd"><button type="button" class="btn btn-chinh" data-qt-act="luu-tk">' + (moi ? 'Tạo tài khoản' : 'Lưu') + '</button></div></div>';
    $('qt-ngan').hidden = false; $('qt-nen').hidden = false;
  }
  function luuTK(nut) {
    var d = {}; document.querySelectorAll('[data-tk-f]').forEach(function (el) { var k = el.getAttribute('data-tk-f'); d[k] = el.type === 'checkbox' ? el.checked : el.value.trim(); });
    nut.disabled = true;
    api('luuUser', d, true).then(function (r) {
      nut.disabled = false;
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      toast(r.msg || 'Đã lưu'); S.tk.ds = null; S.nv = null; dongDon(); ve();
    }).catch(function (e) { nut.disabled = false; toast('Không lưu được: ' + e.message); });
  }

  // Ẩn / hiện mã trên app (ghi cột "Hiện trên app" của tab Giá)
  function doiAnHien(ma, nut) {
    var p = (S.gia.ds || []).concat(S.spAn || []).filter(function (x) { return x.ma === ma; })[0]; if (!p) return;
    var an = !p.an; nut.disabled = true;
    api('luuSanPham', { ma: ma, an: an }, true).then(function (r) {
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      p.an = an;
      if (an) { S.gia.ds = S.gia.ds.filter(function (x) { return x.ma !== ma; }); (S.spAn = S.spAn || []).unshift(p); }
      else { S.spAn = (S.spAn || []).filter(function (x) { return x.ma !== ma; }); S.gia.ds.unshift(p); }
      toast((an ? 'Đã ẩn ' : 'Đã hiện lại ') + ma + (an ? ' – đại lý không thấy mã này nữa' : ' trên app')); S.nk.ds = null; ve();
    }).catch(function (e) { nut.disabled = false; toast('Không đổi được: ' + e.message); });
  }

  // ============================================================
  // BÁO GIÁ (nháp) – quyền "baogia": soạn, lưu nháp, sửa, xóa, nhân bản, in A4.
  // ============================================================
  var TEN_BG = { nhap: 'Nháp', dagui: 'Đã gửi khách' };
  function taiBG() {
    api('dsBaoGia', {}).then(function (r) {
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      S.bg.ds = r.data; if (S.trang === 'baogia') ve();
    }).catch(function (e) { S.bg.ds = []; toast('Không tải được báo giá: ' + e.message); });
  }
  function ymdCong(n) { var d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }
  function tinhBG(b) {
    b.items.forEach(function (x) { x.tien = Math.round((Number(x.sl) || 0) * (Number(x.donGia) || 0)); });
    b.tamTinh = b.items.reduce(function (s, x) { return s + x.tien; }, 0);
    b.tong = Math.round(b.tamTinh * (1 - (Number(b.ck) || 0) / 100));
    return b;
  }
  function veBaoGia() {
    if (!co('baogia')) return '<div class="qt-trong">Tài khoản chưa có quyền soạn báo giá.</div>';
    if (S.bg.dang) return veSoanBG();
    if (!S.bg.ds) { taiBG(); }
    var ds = (S.bg.ds || []).filter(function (b) {
      if (S.bg.tt && b.tt !== S.bg.tt) return false;
      var q = boDau(S.bg.q).trim(); return !q || boDau([b.ma, b.khach, b.sdt, b.nguoiTao].concat(b.items.map(function (x) { return x.ma; })).join(' ')).indexOf(q) >= 0;
    });
    var dem = { nhap: 0, dagui: 0 }; (S.bg.ds || []).forEach(function (b) { dem[b.tt]++; });
    return '<div class="qt-h1">Báo giá <small>' + (S.bg.ds ? S.bg.ds.length + ' báo giá' : '') + '</small><button type="button" class="btn btn-chinh btn-nho qt-lm" data-qt-act="bg-moi">＋ Tạo báo giá</button></div>' +
      '<div class="qt-loc"><button type="button" class="chip' + (S.bg.tt ? '' : ' on') + '" data-bg-loc="">Tất cả</button>' +
      ['nhap', 'dagui'].map(function (t) { return '<button type="button" class="chip' + (S.bg.tt === t ? ' on' : '') + '" data-bg-loc="' + t + '">' + TEN_BG[t] + ' <small>' + dem[t] + '</small></button>'; }).join('') +
      '<input id="qt-bg-q" type="search" placeholder="Tìm mã báo giá, khách, SĐT, mã hàng…" value="' + esc(S.bg.q) + '"></div>' +
      '<div class="qt-khung" id="qt-bg-ds">' + (!S.bg.ds ? '<div class="qt-trong">Đang tải…</div>' : !ds.length ? '<div class="qt-trong">Chưa có báo giá – bấm "＋ Tạo báo giá".</div>' :
        '<table class="qt-bang"><thead><tr><th>Mã báo giá</th><th>Ngày</th><th>Khách hàng</th><th class="an-dt">Mặt hàng</th><th class="so">Tổng tiền</th><th>Trạng thái</th><th class="an-dt">Người tạo</th></tr></thead><tbody>' +
        ds.map(function (b) {
          return '<tr class="dong" data-bg="' + esc(b.ma) + '"><td class="ma">' + esc(b.ma) + '</td><td>' + gio(b.capNhat || b.ngay) + '</td><td><b>' + esc(b.khach) + '</b>' + (b.sdt ? '<br><small>' + esc(b.sdt) + '</small>' : '') + '</td>' +
            '<td class="an-dt">' + b.items.length + ' mã</td><td class="so">' + tien(b.tong) + (b.ck ? '<br><small>CK ' + b.ck + '%</small>' : '') + '</td>' +
            '<td><span class="tt ' + (b.tt === 'dagui' ? 'tt-dagiao' : 'tt-moi') + '">' + TEN_BG[b.tt] + '</span></td><td class="an-dt"><small>' + esc(b.nguoiTao) + '</small></td></tr>';
        }).join('') + '</tbody></table>') + '</div>';
  }
  function moBaoGia(ma) {
    var b = ma ? (S.bg.ds || []).filter(function (x) { return x.ma === ma; })[0] : null;
    S.bg.dang = b ? JSON.parse(JSON.stringify(b)) : { ma: '', khach: '', sdt: '', diaChi: '', loaiGia: 'dl', ck: 0, hieuLuc: ymdCong(7), ghiChu: '', tt: 'nhap', items: [] };
    S.bg.doi = false; S.bg.tim = '';
    if (!S.gia.ds) taiGia();
    ve(); window.scrollTo(0, 0);
  }
  function giaTheoLoai(p, loai) { return loai === 'ny' ? (p.ny || 0) : (p.dl > 0 ? p.dl : (p.ny || 0)); }
  function quyThung(x) { // gạch tính m²: đổi số m² ra số thùng để dễ báo khách
    var p = (S.gia.ds || []).filter(function (y) { return y.ma === x.ma; })[0], m = p && String(p.dg || '').match(/([\d.,]+)\s*m(?:²|2)\s*\/\s*th/i);
    var m2 = m ? parseFloat(m[1].replace(',', '.')) : 0;
    return m2 && /^m(2|²)$/i.test(String(x.dvt || '').trim()) && x.sl ? '≈ ' + so(Math.ceil(x.sl / m2 * 100) / 100) + ' thùng (' + String(m2).replace('.', ',') + ' m²/th)' : '';
  }
  function dsTimBG() {
    var q = boDau(S.bg.tim || '').trim().split(/\s+/).filter(String);
    if (!q.length) return '';
    var ds = (S.gia.ds || []).filter(function (p) { var s = boDau([p.ma, p.ten, p.tenGoc, p.hang, p.kc].join(' ')); return q.every(function (w) { return s.indexOf(w) >= 0; }); }).slice(0, 8);
    return ds.length ? ds.map(function (p) { return '<button type="button" class="bg-goi-y" data-bg-them="' + esc(p.ma) + '"><span><b>' + esc(p.ten) + '</b><small>' + esc(p.ma) + ' · ' + esc(p.dvt) + '</small></span><b>' + (giaTheoLoai(p, S.bg.dang.loaiGia) ? tien(giaTheoLoai(p, S.bg.dang.loaiGia)) : 'chưa có giá') + '</b></button>'; }).join('') : '<div class="bg-goi-y mo">Không thấy mã phù hợp</div>';
  }
  function themDongBG(ma) {
    var p = (S.gia.ds || []).filter(function (x) { return x.ma === ma; })[0]; if (!p) return;
    var co0 = S.bg.dang.items.filter(function (x) { return x.ma === ma; })[0];
    if (co0) { co0.sl = (Number(co0.sl) || 0) + 1; toast('Đã có ' + ma + ' – tăng số lượng'); }
    else S.bg.dang.items.push({ ma: p.ma, ten: p.tenGoc || p.ten, dvt: p.dvt || '', sl: 1, donGia: giaTheoLoai(p, S.bg.dang.loaiGia) });
    S.bg.tim = ''; S.bg.doi = true; ve();
    var o = $('qt-bg-tim'); if (o) o.focus();
  }
  function doiLoaiGia(loai) {
    var b = S.bg.dang; if (b.loaiGia === loai) return;
    b.loaiGia = loai;
    if (b.items.length && confirm('Đổi đơn giá của ' + b.items.length + ' dòng sang ' + (loai === 'ny' ? 'giá niêm yết' : 'giá đại lý') + '? (Bấm Hủy để giữ giá đang nhập)'))
      b.items.forEach(function (x) { var p = (S.gia.ds || []).filter(function (y) { return y.ma === x.ma; })[0]; if (p) x.donGia = giaTheoLoai(p, loai); });
    S.bg.doi = true; ve();
  }
  function veSoanBG() {
    var b = tinhBG(S.bg.dang);
    return '<div class="qt-h1"><button type="button" class="btn btn-vien btn-nho" data-qt-act="bg-ve">← Danh sách</button> ' + (b.ma ? 'Báo giá ' + esc(b.ma) : 'Báo giá mới') +
      '<small>' + TEN_BG[b.tt] + (b.nguoiTao ? ' · ' + esc(b.nguoiTao) : '') + (S.bg.doi ? ' · <b class="qt-thieu">chưa lưu</b>' : '') + '</small>' +
      '<span class="bg-nut qt-lm">' + (b.ma ? '<button type="button" class="btn btn-vien btn-nho" data-qt-act="bg-xoa">🗑 Xóa</button><button type="button" class="btn btn-vien btn-nho" data-qt-act="bg-nhan-ban">⧉ Nhân bản</button>' : '') +
      '<button type="button" class="btn btn-vien btn-nho" data-qt-act="bg-in"' + (b.items.length ? '' : ' disabled') + '>🖨 In / PDF</button><button type="button" class="btn btn-chinh btn-nho" data-qt-act="bg-luu">💾 Lưu' + (b.ma ? '' : ' nháp') + '</button></span></div>' +
      '<div class="bg-luoi"><div class="qt-khung bg-khach"><h2>Khách hàng</h2><div class="qt-o-luoi" style="padding:12px 14px">' +
      '<label class="rong">Tên khách / công trình *<input data-bg-f="khach" value="' + esc(b.khach) + '" placeholder="vd Anh Tâm – nhà phố Bình Khánh"></label>' +
      '<label>Số điện thoại<input data-bg-f="sdt" inputmode="tel" value="' + esc(b.sdt) + '"></label><label>Hiệu lực đến<input type="date" data-bg-f="hieuLuc" value="' + esc(b.hieuLuc) + '"></label>' +
      '<label class="rong">Địa chỉ<input data-bg-f="diaChi" value="' + esc(b.diaChi) + '"></label></div>' +
      '<div class="bg-dong-tt"><span>Trạng thái</span>' + ['nhap', 'dagui'].map(function (t) { return '<button type="button" class="chip' + (b.tt === t ? ' on' : '') + '" data-bg-tt="' + t + '">' + TEN_BG[t] + '</button>'; }).join('') + '</div></div>' +
      '<div class="qt-khung bg-hang"><h2>Mặt hàng <small>' + b.items.length + ' dòng</small><span class="bg-loai">' + [['dl', 'Giá đại lý'], ['ny', 'Giá niêm yết']].map(function (g) { return '<button type="button" class="chip' + (b.loaiGia === g[0] ? ' on' : '') + '" data-bg-gia="' + g[0] + '">' + g[1] + '</button>'; }).join('') + '</span></h2>' +
      '<div class="bg-tim"><input id="qt-bg-tim" type="search" placeholder="🔍 Gõ mã / tên / kích cỡ để thêm sản phẩm…" value="' + esc(S.bg.tim || '') + '" autocomplete="off"><div id="qt-bg-goi-y">' + dsTimBG() + '</div></div>' +
      (b.items.length ? '<table class="qt-bang bg-bang"><thead><tr><th>#</th><th>Mã / tên</th><th>ĐVT</th><th class="so">Số lượng</th><th class="so">Đơn giá</th><th class="so">Thành tiền</th><th></th></tr></thead><tbody>' +
        b.items.map(function (x, i) {
          return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(x.ma) + '</b><br><small>' + esc(x.ten) + '</small><small class="bg-qd" id="bg-qd-' + i + '">' + quyThung(x) + '</small></td><td>' + esc(x.dvt) + '</td>' +
            '<td class="so"><input class="qt-so-o bg-sl" inputmode="decimal" data-bg-dong="' + i + '|sl" value="' + esc(x.sl) + '"></td>' +
            '<td class="so"><input class="qt-so-o" inputmode="numeric" data-bg-dong="' + i + '|donGia" value="' + (x.donGia ? so(x.donGia) : '') + '" placeholder="0"></td>' +
            '<td class="so" id="bg-tt-' + i + '">' + tien(x.tien) + '</td><td><button type="button" class="sh-x bg-x" data-bg-xoa-dong="' + i + '" title="Bỏ dòng">✕</button></td></tr>';
        }).join('') + '</tbody></table>' : '<div class="qt-trong">Chưa có mặt hàng – gõ vào ô tìm phía trên.</div>') +
      '<div class="bg-tong"><div><span>Tạm tính</span><b id="bg-tam">' + tien(b.tamTinh) + '</b></div><div><span>Chiết khấu (%)</span><input class="qt-so-o" inputmode="decimal" data-bg-f="ck" value="' + (b.ck || '') + '" placeholder="0" style="width:80px"></div>' +
      '<div class="bg-tong-lon"><span>Tổng cộng (đã gồm VAT)</span><b id="bg-tong">' + tien(b.tong) + '</b></div></div>' +
      '<label class="bg-gc">Ghi chú trên báo giá<textarea class="qt-nb" data-bg-f="ghiChu" placeholder="vd Giá đã gồm VAT, giao trong 3 ngày, miễn phí vận chuyển nội ô…">' + esc(b.ghiChu) + '</textarea></label></div></div>';
  }
  function capNhatTongBG() {
    var b = tinhBG(S.bg.dang);
    b.items.forEach(function (x, i) { var e = $('bg-tt-' + i); if (e) e.textContent = tien(x.tien); var q = $('bg-qd-' + i); if (q) q.textContent = quyThung(x); });
    var t = $('bg-tam'); if (t) t.textContent = tien(b.tamTinh); var g = $('bg-tong'); if (g) g.textContent = tien(b.tong);
  }
  function luuBG(nut) {
    var b = tinhBG(S.bg.dang);
    if (!b.khach.trim()) { toast('Nhập tên khách hàng'); var k = document.querySelector('[data-bg-f=khach]'); if (k) k.focus(); return; }
    if (!b.items.length) { toast('Thêm ít nhất 1 mặt hàng'); return; }
    nut.disabled = true;
    api('luuBaoGia', { ma: b.ma, khach: b.khach, sdt: b.sdt, diaChi: b.diaChi, loaiGia: b.loaiGia, ck: b.ck, hieuLuc: b.hieuLuc, ghiChu: b.ghiChu, tt: b.tt, items: b.items }, true).then(function (r) {
      nut.disabled = false;
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      b.ma = r.ma; S.bg.doi = false; toast(r.msg);
      api('dsBaoGia', {}).then(function (r2) { if (r2 && r2.status === 'ok') { S.bg.ds = r2.data; var m = S.bg.ds.filter(function (x) { return x.ma === b.ma; })[0]; if (m && S.bg.dang && S.bg.dang.ma === b.ma) S.bg.dang = JSON.parse(JSON.stringify(m)); ve(); } });
      ve(); S.nk.ds = null;
    }).catch(function (e) { nut.disabled = false; toast('Không lưu được: ' + e.message); });
  }
  function xoaBG(nut) {
    var b = S.bg.dang; if (!b.ma || !confirm('Xóa báo giá ' + b.ma + ' (' + b.khach + ')? Không khôi phục được.')) return;
    nut.disabled = true;
    api('xoaBaoGia', { ma: b.ma }, true).then(function (r) {
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      toast(r.msg); S.bg.dang = null; S.bg.doi = false; S.bg.ds = (S.bg.ds || []).filter(function (x) { return x.ma !== b.ma; }); S.nk.ds = null; ve();
    }).catch(function (e) { nut.disabled = false; toast('Không xóa được: ' + e.message); });
  }
  // Số tiền bằng chữ (tiếng Việt)
  function docSo(n) {
    n = Math.round(Number(n) || 0); if (!n) return 'Không đồng';
    var cs = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    function ba(x, day) {
      var tr = Math.floor(x / 100), ch = Math.floor(x % 100 / 10), dv = x % 10, s = [];
      if (day || tr) s.push(cs[tr] + ' trăm');
      if (ch > 1) s.push(cs[ch] + ' mươi'); else if (ch === 1) s.push('mười'); else if ((day || tr) && dv) s.push('lẻ');
      if (dv) s.push(dv === 1 && ch > 1 ? 'mốt' : dv === 5 && ch > 0 ? 'lăm' : dv === 4 && ch > 1 ? 'tư' : cs[dv]);
      return s.join(' ');
    }
    var dvi = ['', ' nghìn', ' triệu', ' tỷ'], nhom = [], i = 0;
    while (n > 0) { nhom.push(n % 1000); n = Math.floor(n / 1000); }
    var kq = [];
    for (i = nhom.length - 1; i >= 0; i--) { if (!nhom[i]) { if (i === 3) kq.push('tỷ'); continue; } kq.push(ba(nhom[i], i < nhom.length - 1) + dvi[i % 4] + (i >= 4 ? ' tỷ' : '')); }
    var s = kq.join(' ').replace(/\s+/g, ' ').trim(); return s.charAt(0).toUpperCase() + s.slice(1) + ' đồng';
  }
  function inBG() {
    var b = tinhBG(S.bg.dang), d = new Date(), hl = b.hieuLuc ? b.hieuLuc.split('-').reverse().join('/') : '';
    var html = '<div class="bg-in"><div class="bg-in-dau"><img src="' + esc(CFG.LOGO_DAY_DU || CFG.LOGO) + '" alt=""><div><b>' + esc(CFG.TEN_DAY_DU || '') + '</b><br>' + esc(CFG.DIA_CHI || '') +
      '<br>ĐT: ' + esc(CFG.LIEN_HE_SDT || '') + (CFG.EMAIL ? ' · Email: ' + esc(CFG.EMAIL) : '') + '</div></div>' +
      '<h1>BẢNG BÁO GIÁ</h1><div class="bg-in-ma">Số: ' + esc(b.ma || '(nháp chưa lưu)') + ' · Ngày ' + ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear() + (hl ? ' · Hiệu lực đến ' + hl : '') + '</div>' +
      '<table class="bg-in-kh"><tr><td>Kính gửi:</td><td><b>' + esc(b.khach) + '</b></td></tr>' + (b.sdt ? '<tr><td>Điện thoại:</td><td>' + esc(b.sdt) + '</td></tr>' : '') + (b.diaChi ? '<tr><td>Địa chỉ:</td><td>' + esc(b.diaChi) + '</td></tr>' : '') + '</table>' +
      '<p>' + esc(CFG.TEN_DAY_DU || '') + ' trân trọng gửi Quý khách bảng báo giá như sau:</p>' +
      '<table class="bg-in-bang"><thead><tr><th>STT</th><th>Mã hàng</th><th>Tên hàng</th><th>ĐVT</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>' +
      b.items.map(function (x, i) { return '<tr><td class="g">' + (i + 1) + '</td><td>' + esc(x.ma) + '</td><td>' + esc(x.ten) + (quyThung(x) ? '<br><small>' + esc(quyThung(x)) + '</small>' : '') + '</td><td class="g">' + esc(x.dvt) + '</td><td class="s">' + so(x.sl) + '</td><td class="s">' + so(x.donGia) + '</td><td class="s">' + so(x.tien) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td colspan="6" class="s">Tạm tính</td><td class="s">' + so(b.tamTinh) + '</td></tr>' +
      (b.ck ? '<tr><td colspan="6" class="s">Chiết khấu ' + b.ck + '%</td><td class="s">-' + so(b.tamTinh - b.tong) + '</td></tr>' : '') +
      '<tr class="lon"><td colspan="6" class="s">TỔNG CỘNG (đã gồm VAT)</td><td class="s">' + so(b.tong) + '</td></tr></tfoot></table>' +
      '<p class="bg-in-chu"><i>Bằng chữ: ' + docSo(b.tong) + '.</i></p>' + (b.ghiChu ? '<div class="bg-in-gc"><b>Ghi chú:</b><br>' + esc(b.ghiChu).replace(/\n/g, '<br>') + '</div>' : '') +
      '<div class="bg-in-ky"><div><b>KHÁCH HÀNG</b><br><i>(Ký, ghi rõ họ tên)</i></div><div><b>NGƯỜI LẬP BÁO GIÁ</b><br><i>(Ký, ghi rõ họ tên)</i><br><br><br><br>' + esc((S.sess && S.sess.name) || '') + '</div></div></div>';
    var vung = $('vung-in'); vung.innerHTML = html; vung.hidden = false;
    $('kieu-in').textContent = '@page{size:A4;margin:12mm}';
    document.body.classList.add('dang-in');
    var xong = function () { document.body.classList.remove('dang-in'); vung.hidden = true; vung.innerHTML = ''; window.removeEventListener('afterprint', xong); };
    window.addEventListener('afterprint', xong);
    var im = vung.querySelector('img'), mo = function () { setTimeout(function () { window.print(); }, 150); };
    if (!im || im.complete) mo(); else im.onload = im.onerror = mo;
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
  // Sổ tồn kho Excel: 6 trang tính (Tổng hợp, Theo nhóm, Theo kho & lô, Cần nhập thêm, Hàng đang giữ, Cần kiểm tra).
  function khungSoTon() {
    return '<div class="qt-khung qt-so-ton"><div><b>📗 Sổ tồn kho (Excel)</b><span>6 trang tính: Tổng hợp · Theo nhóm hàng · Theo kho & lô · Cần nhập thêm · Hàng đang giữ cho đơn · Dữ liệu cần kiểm tra. ' +
      'Có màu tình trạng, bộ lọc, dòng tổng tự tính theo lọc, in vừa khổ A4 ngang.</span></div>' +
      '<label class="qt-chk">Sắp hết khi còn ≤ <input id="qt-nguong" type="number" min="0" value="' + (S.nguong || 5) + '" style="width:64px"></label>' +
      '<button type="button" class="btn btn-xanh" data-qt-act="tai-so-ton">⬇ Tải sổ tồn kho (.xlsx)</button></div>';
  }
  function taiSoTon(nut) {
    nut.disabled = true; var cu = nut.textContent; nut.textContent = 'Đang tạo file…';
    S.nguong = Math.max(0, Number($('qt-nguong').value) || 0);
    Promise.all([api('getTonKho', {}), S.gia.ds ? Promise.resolve({ status: 'ok', data: S.gia.ds }) : api('getAll', {})]).then(function (kq) {
      if (!kq[0] || kq[0].status !== 'ok') throw new Error((kq[0] && kq[0].msg) || 'không tải được tồn kho');
      if (!kq[1] || kq[1].status !== 'ok') throw new Error((kq[1] && kq[1].msg) || 'không tải được bảng giá');
      S.gia.ds = kq[1].data;
      var sach = window.taoSoTonKho({ ton: kq[0].data, gia: kq[1].data, don: S.don, tonLuc: kq[0].luc, cty: CFG.TEN_DAY_DU || CFG.TEN_APP, nguong: S.nguong });
      var n = new Date(), ten = 'So-ton-kho-Hien-Nga-' + n.getFullYear() + ('0' + (n.getMonth() + 1)).slice(-2) + ('0' + n.getDate()).slice(-2) + '-' + ('0' + n.getHours()).slice(-2) + ('0' + n.getMinutes()).slice(-2) + '.xlsx';
      window.XLSX_HN.taiVe(ten, sach);
      var t = sach.tomTat;
      toast('Đã tải ' + ten + ' – ' + t.soMa + ' mã, ' + t.sapHet + ' sắp hết, ' + t.het + ' hết hàng');
    }).catch(function (e) { toast('Không tạo được file: ' + e.message); }).then(function () { nut.disabled = false; nut.textContent = cu; });
  }
  function veTon() {
    if (!co('nhapton')) return '<div class="qt-h1">Tồn kho</div>' + khungSoTon();
    var t = S.tonTT;
    return '<div class="qt-h1">Tồn kho <small>nhập ở Sheet Tồn kho riêng – app tự đọc</small></div>' + khungSoTon() +
      (!t ? '<div class="qt-khung"><div class="qt-trong">Đang tải…</div></div>' :
        '<div class="qt-khung qt-ton-hd"><h2>Cách nhập tồn</h2><ol>' +
        '<li>Bấm <b>Mở Sheet Tồn kho</b> (đăng nhập đúng Gmail đã được quản trị ghi trong "Nhân viên & quyền").</li>' +
        '<li>Xuất file tồn từ phần mềm kho → dán đè vào tab <b>' + esc(t.tab || 'Tồn kho') + '</b> (giữ dòng tiêu đề: Mã vật tư, Tên vật tư, ĐVT, Tồn, Kho…). Hoặc gõ / sửa số trực tiếp.</li>' +
        '<li>Bấm <b>App đọc lại tồn ngay</b> – đại lý thấy số mới ở lần mở tới (không bấm thì app tự đọc sau tối đa 10 phút).</li></ol>' +
        '<div class="qt-hd" style="padding:0 16px 16px">' + (t.link ? '<a class="btn btn-chinh" href="' + esc(t.link) + '" target="_blank" rel="noopener">📄 Mở Sheet Tồn kho</a>' : '') +
        '<button type="button" class="btn btn-vien" data-qt-act="lam-moi-ton">↻ App đọc lại tồn ngay</button></div>' +
        (t.luc ? '<p class="mo" style="padding:0 16px 14px">' + esc(t.luc) + '</p>' : '') + (t.loi ? '<p class="qt-thieu" style="padding:0 16px 14px">' + esc(t.loi) + '</p>' : '') + '</div>') +
      '<p class="mo" style="margin-top:10px">Số "Được bán" trên app = Tồn trong Sheet − hàng đang giữ cho đơn (chờ duyệt, chừa, đã xác nhận, đang giao).</p>' + veTuoiTon();
  }
  // Bảng tuổi tồn: đọc cột "Ngày nhập" của Sheet Tồn kho -> tô màu hàng tồn lâu để bán sale.
  var MUC_TUOI = [['', 'Tất cả'], ['rlau', '> 180 ngày'], ['lau', '91 – 180 ngày'], ['tb', '31 – 90 ngày'], ['moi', '≤ 30 ngày']];
  function veTuoiTon() {
    if (!S.ton) { if (!S.tonDangTai) { S.tonDangTai = 1; taiTon().then(function () { S.tonDangTai = 0; if (S.trang === 'ton') ve(); }); } return '<div class="qt-khung" style="margin-top:14px"><div class="qt-trong">Đang tải tồn kho…</div></div>'; }
    var theoMa = {}; ((S.gia && S.gia.ds) || []).forEach(function (p) { theoMa[p.ma] = p; });
    var ds = Object.keys(S.ton).map(function (ma) { var d = S.ton[ma], t = tuoiTon(d.nhap); return t && (d.tonGoc !== undefined ? d.tonGoc : d.tong) > 0 ? { ma: ma, d: d, t: t, p: theoMa[ma] } : null; }).filter(Boolean);
    var dau = '<div class="qt-khung" style="margin-top:14px"><h2 style="padding:14px 16px 0;margin:0">Tuổi tồn kho <small class="mo">– theo cột "Ngày nhập" của Sheet Tồn kho</small></h2>';
    if (!ds.length) return dau + '<div class="qt-hd-tuoi"><p>Chưa có ngày nhập. Ở Sheet Tồn kho, thêm 1 cột tiêu đề <b>Ngày nhập</b> và ghi ngày lô hàng về kho (vd 15/08/2026) cho từng dòng. App sẽ tô màu:</p>' + chuThichTuoi() + '</div></div>';
    var dem = {}; ds.forEach(function (x) { dem[x.t.muc] = (dem[x.t.muc] || 0) + 1; });
    var loc = S.tuoiLoc || '', q = (S.tuoiQ || '').toLowerCase();
    var hien = ds.filter(function (x) { return (!loc || x.t.muc === loc) && (!q || (x.ma + ' ' + (x.d.ten || '') + ' ' + (x.p ? x.p.ten : '')).toLowerCase().indexOf(q) >= 0); })
      .sort(function (a, b) { return b.t.n - a.t.n; });
    return dau + '<div class="qt-tuoi-loc">' + MUC_TUOI.map(function (m) { return '<button type="button" class="chip' + (loc === m[0] ? ' on' : '') + (m[0] ? ' tuoi-' + m[0] : '') + '" data-tuoi-loc="' + m[0] + '">' + m[1] + ' <small>' + (m[0] ? dem[m[0]] || 0 : ds.length) + '</small></button>'; }).join('') +
      '<input id="qt-tuoi-q" type="search" class="qt-tim" placeholder="Tìm mã / tên" value="' + esc(S.tuoiQ || '') + '"></div>' +
      '<div class="qt-cuon"><table class="qt-bang"><thead><tr><th>Mã / tên hàng</th><th class="so">Tồn</th><th>Nhập kho</th><th class="so">Ngày tồn</th><th class="an-dt">Mức</th></tr></thead><tbody>' +
      hien.slice(0, 300).map(function (x) { var thuc = x.d.tonGoc !== undefined ? x.d.tonGoc : x.d.tong;
        return '<tr><td><b class="ma">' + esc(x.ma) + '</b><br><small>' + esc((x.p ? (x.p.tenGoc || x.p.ten) : '') || x.d.ten || '') + '</small></td><td class="so">' + so(thuc) + ' ' + esc(x.d.dvt || '') + '</td><td>' + x.t.ngay + (x.d.nhapMoi && x.d.nhapMoi !== x.d.nhap ? '<br><small class="mo an-dt-chu">lô mới nhất ' + x.d.nhapMoi.split('-').reverse().join('/') + '</small>' : '') + '</td>' +
          '<td class="so"><b class="tuoi tuoi-' + x.t.muc + '">' + x.t.n + '</b></td><td class="an-dt"><span class="tuoi tuoi-' + x.t.muc + '">' + x.t.ten + '</span></td></tr>'; }).join('') +
      (hien.length ? '' : '<tr><td colspan="5" class="qt-trong">Không có mã nào</td></tr>') + '</tbody></table></div>' +
      (hien.length > 300 ? '<p class="mo" style="padding:8px 16px">Đang hiện 300 / ' + hien.length + ' mã lâu nhất – tải sổ Excel để xem đủ.</p>' : '') +
      '<div class="qt-hd-tuoi">' + chuThichTuoi() + '</div></div>';
  }
  function chuThichTuoi() { return '<div class="qt-tuoi-ct"><span class="tuoi tuoi-moi">≤ 30 ngày: hàng mới</span><span class="tuoi tuoi-tb">31 – 90: bình thường</span><span class="tuoi tuoi-lau">91 – 180: tồn lâu</span><span class="tuoi tuoi-rlau">> 180: tồn rất lâu – nên sale</span></div>'; }

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
    var el = e.target.closest('[data-qt],[data-qt-loc],[data-don],[data-qt-tt],[data-qt-gh],[data-qt-act],[data-bc-ky],[data-nv-luu],[data-gia-luu],[data-sp-sua],[data-tem-them],[data-tem-kho],[data-tem-sl],[data-tem-loc],[data-tk],[data-tk-vt],[data-th-chon],[data-sp-an],[data-sp-tt],[data-bg],[data-bg-tt],[data-bg-gia],[data-bg-them],[data-bg-xoa-dong],[data-bg-loc],[data-tuoi-loc]');
    if (!el) { if (e.target.id === 'qt-nen') dongDon(); return; }
    if (el.hasAttribute('data-qt')) { if (S.trang === 'baogia' && S.bg.doi && el.getAttribute('data-qt') !== 'baogia' && !confirm('Báo giá chưa lưu – rời đi?')) return; S.trang = el.getAttribute('data-qt'); ve(); return; }
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
    if (el.hasAttribute('data-tem-them')) { var mt = el.getAttribute('data-tem-them'), ct = GT.gio.filter(function (x) { return x.ma === mt; })[0]; if (ct) { GT.gio.splice(GT.gio.indexOf(ct), 1); luuGT(); } else themGT(mt); ve(); return; }
    if (el.hasAttribute('data-tem-loc')) { var kl = el.getAttribute('data-tem-loc'); S.temQ.loc[kl] = !S.temQ.loc[kl]; ve(); return; }
    if (el.hasAttribute('data-tem-kho')) { GT.cfg.kho = el.getAttribute('data-tem-kho'); luuGT(); ve(); return; }
    if (el.hasAttribute('data-tem-sl')) { var ts = GT.gio[Number(el.getAttribute('data-tem-sl'))]; if (ts) { ts.so += Number(el.getAttribute('data-d')); if (ts.so <= 0) GT.gio.splice(GT.gio.indexOf(ts), 1); luuGT(); ve(); } return; }
    if (el.hasAttribute('data-tk')) { var ut = (S.tk.ds || []).filter(function (u) { return u.username === el.getAttribute('data-tk'); })[0]; if (ut) formTK(ut); return; }
    if (el.hasAttribute('data-sp-an')) { e.stopPropagation(); doiAnHien(el.getAttribute('data-sp-an'), el); return; }
    if (el.hasAttribute('data-sp-tt')) { S.sp.tt = el.getAttribute('data-sp-tt'); ve(); return; }
    if (el.hasAttribute('data-bg')) { moBaoGia(el.getAttribute('data-bg')); return; }
    if (el.hasAttribute('data-bg-loc')) { S.bg.tt = el.getAttribute('data-bg-loc'); ve(); return; }
    if (el.hasAttribute('data-bg-tt')) { S.bg.dang.tt = el.getAttribute('data-bg-tt'); S.bg.doi = true; ve(); return; }
    if (el.hasAttribute('data-bg-gia')) { doiLoaiGia(el.getAttribute('data-bg-gia')); return; }
    if (el.hasAttribute('data-bg-them')) { themDongBG(el.getAttribute('data-bg-them')); return; }
    if (el.hasAttribute('data-bg-xoa-dong')) { S.bg.dang.items.splice(Number(el.getAttribute('data-bg-xoa-dong')), 1); S.bg.doi = true; ve(); return; }
    if (el.hasAttribute('data-th-chon')) { var mc = el.getAttribute('data-th-chon'); if (S.th.chon[mc]) delete S.th.chon[mc]; else S.th.chon[mc] = 1; ve(); return; }
    if (el.hasAttribute('data-tuoi-loc')) { S.tuoiLoc = el.getAttribute('data-tuoi-loc'); ve(); return; }
    if (el.hasAttribute('data-tk-vt')) { S.tk.vt = el.getAttribute('data-tk-vt'); ve(); return; }
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
    else if (a === 'tem-chon-het') {
      var dsl = locTem(), coHet = dsl.every(function (p) { return GT.gio.some(function (x) { return x.ma === p.ma; }); });
      if (coHet) { var bo = {}; dsl.forEach(function (p) { bo[p.ma] = 1; }); GT.gio = GT.gio.filter(function (x) { return !bo[x.ma]; }); luuGT(); }
      else dsl.slice(0, 500).forEach(function (p) { if (!GT.gio.some(function (x) { return x.ma === p.ma; })) GT.gio.push({ ma: p.ma, so: GT.soMoi || 1, gia: '' }); });
      luuGT(); ve();
    }
    else if (a === 'tem-bo-loc') { S.temQ = { q: '', nhom: '', hang: '', kc: '', loc: {} }; ve(); }
    else if (a === 'tem-so-het') { var sm = Math.max(1, Math.min(99, Number($('qt-tem-so').value) || 1)); GT.soMoi = sm; GT.gio.forEach(function (x) { x.so = sm; }); luuGT(); ve(); }
    else if (a === 'tem-doi-gia') { maDoiGiaGT().forEach(function (m) { if (!GT.gio.some(function (x) { return x.ma === m; })) themGT(m); }); ve(); }
    else if (a === 'tem-xoa') { if (confirm('Xóa hết giỏ tem?')) { GT.gio = []; luuGT(); ve(); } }
    else if (a === 'tem-in') inTemQT();
    else if (a === 'tk-moi') formTK(null);
    else if (a === 'luu-tk') luuTK(el);
    else if (a === 'xoa-dem') { el.disabled = true; api('clearCache', {}).then(function (r) { el.disabled = false; toast(r && r.status === 'ok' ? 'Đã xóa bộ nhớ đệm – app đọc lại Sheet ở lần mở tới' : 'Không làm được'); S.gia.ds = null; S.ton = null; }); }
    else if (a === 'sp-moi') moFormSP({ nhom: S.sp.nhom || '' }, true);
    else if (a === 'xoa-het-don') {
      if (!confirm('XÓA TOÀN BỘ ' + S.don.length + ' đơn hàng?\n\nMất hết dòng ở tab Đơn hàng + Chi tiết đơn, mã đơn đánh số lại từ 001. Không xóa bảng giá, tài khoản, báo giá, nhật ký.\nLấy lại chỉ bằng Lịch sử phiên bản của Sheet.')) return;
      if ((prompt('Gõ XOA (viết hoa) để xác nhận lần 2:') || '').trim() !== 'XOA') { toast('Đã hủy – không xóa gì'); return; }
      el.disabled = true;
      api('xoaHetDon', { xacNhan: 'XOA' }, true).then(function (r) { toast(r && r.status === 'ok' ? r.msg : 'Không xóa được: ' + (r && r.msg)); S.moMa = ''; S.ton = null; S.nk.ds = null; taiDon(); }).catch(function (e) { el.disabled = false; toast('Lỗi: ' + e.message); });
    }
    else if (a === 'bg-moi') moBaoGia('');
    else if (a === 'bg-ve') { if (!S.bg.doi || confirm('Báo giá chưa lưu – bỏ thay đổi?')) { S.bg.dang = null; S.bg.doi = false; ve(); } }
    else if (a === 'bg-luu') luuBG(el);
    else if (a === 'bg-xoa') xoaBG(el);
    else if (a === 'bg-nhan-ban') { var nb = JSON.parse(JSON.stringify(S.bg.dang)); nb.ma = ''; nb.tt = 'nhap'; nb.ngay = ''; nb.nguoiTao = ''; S.bg.dang = nb; S.bg.doi = true; ve(); toast('Đã chép thành báo giá mới – sửa rồi bấm Lưu'); }
    else if (a === 'bg-in') inBG();
    else if (a === 'sp-thieu') { S.sp.cheDo = 'thieu'; S.th.loi = ''; if (!S.th.ds) taiThieu(); ve(); }
    else if (a === 'sp-ve-ds') { S.sp.cheDo = ''; ve(); }
    else if (a === 'th-tai-lai') { S.th.loi = ''; taiThieu(); ve(); }
    else if (a === 'th-chon-het') { var dsc = locThieu(), het = dsc.every(function (x) { return S.th.chon[x.ma]; }); dsc.forEach(function (x) { if (het) delete S.th.chon[x.ma]; else S.th.chon[x.ma] = 1; }); ve(); }
    else if (a === 'th-gan-nhom' || a === 'th-gan-hang') {
      var k = a === 'th-gan-nhom' ? 'nhom' : 'hang', gv = $(a === 'th-gan-nhom' ? 'qt-th-nhom' : 'qt-th-hang').value.trim(), n = 0;
      if (!gv) { toast('Nhập ' + (k === 'nhom' ? 'nhóm hàng' : 'hãng') + ' trước'); return; }
      S.th.ds.forEach(function (x) { if (S.th.chon[x.ma]) { x[k] = gv; n++; } }); toast('Đã gán "' + gv + '" cho ' + n + ' mã'); ve();
    }
    else if (a === 'th-them') themThieu(el);
    else if (a === 'sp-mo-ma') { var mm = $('qt-sp-ma').value.trim(); if (mm) moSuaSP(mm); }
    else if (a === 'dong-sp') dongDon();
    else if (a === 'luu-sp') luuSP(el);
    else if (a === 'nhan-ban-sp') { var fb = docFormSP(); fb.ma = ''; fb.an = false; fb.anh = ''; fb.maKho = ''; moFormSP(fb, true); toast('Đã chép thông tin – nhập mã mới rồi bấm Thêm'); }
    else if (a === 'tai-so-ton') taiSoTon(el);
    else if (a === 'lam-moi-ton') { el.disabled = true; api('lamMoiTon', {}, true).then(function (r) { el.disabled = false; toast(r && r.status === 'ok' ? r.msg : 'Không làm được: ' + (r && r.msg)); S.ton = null; S.tonTT = null; ve(); }); }
    else if (a === 'dang-xuat') { try { localStorage.removeItem('hn_sess'); } catch (er) { } S.sess = null; hienLogin(); }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'qt-tuoi-q') { S.tuoiQ = e.target.value; var vt = e.target.selectionStart; ve(); var o = $('qt-tuoi-q'); if (o) { o.focus(); o.setSelectionRange(vt, vt); } return; }
    if (e.target.id === 'qt-q') { S.q = e.target.value; var k = document.querySelector('.qt-khung'); if (k) k.innerHTML = bangDon(locDon(), 'Không có đơn phù hợp'); }
    if (e.target.id === 'qt-nk-q') { S.nk.q = e.target.value; var n = $('qt-nk-ds'); if (n) n.innerHTML = bangNhatKy(); }
    if (e.target.id === 'qt-tem-q') { S.temQ.q = e.target.value; var tt0 = $('qt-tem-tim'); if (tt0) tt0.innerHTML = dsTimTem(); }
    if (e.target.hasAttribute && e.target.hasAttribute('data-tem-chon')) {
      S.temQ[e.target.getAttribute('data-tem-chon')] = e.target.value;
      if (e.target.getAttribute('data-tem-chon') === 'nhom') { S.temQ.hang = ''; S.temQ.kc = ''; }
      var vt = S.temQ.q; $('qt-tem-loc').innerHTML = boLocTem(); $('qt-tem-q').value = vt; $('qt-tem-tim').innerHTML = dsTimTem();
    }
    if (e.target.id === 'qt-bg-q') { S.bg.q = e.target.value; var p1 = e.target.selectionStart; ve(); var q3 = $('qt-bg-q'); q3.focus(); q3.setSelectionRange(p1, p1); }
    if (e.target.id === 'qt-bg-tim') { S.bg.tim = e.target.value; var gy = $('qt-bg-goi-y'); if (gy) gy.innerHTML = dsTimBG(); }
    if (e.target.hasAttribute && e.target.hasAttribute('data-bg-f') && S.bg.dang) { var kf = e.target.getAttribute('data-bg-f'); S.bg.dang[kf] = kf === 'ck' ? Math.max(0, Math.min(100, Number(String(e.target.value).replace(',', '.')) || 0)) : e.target.value; S.bg.doi = true; if (kf === 'ck') capNhatTongBG(); }
    if (e.target.hasAttribute && e.target.hasAttribute('data-bg-dong') && S.bg.dang) { var pd = e.target.getAttribute('data-bg-dong').split('|'), xd = S.bg.dang.items[Number(pd[0])]; if (xd) { xd[pd[1]] = pd[1] === 'donGia' ? Number(String(e.target.value).replace(/[^\d]/g, '')) || 0 : Number(String(e.target.value).replace(',', '.')) || 0; S.bg.doi = true; capNhatTongBG(); } }
    if (e.target.id === 'qt-th-q') { S.th.q = e.target.value; var p0 = e.target.selectionStart; ve(); var q2 = $('qt-th-q'); q2.focus(); q2.setSelectionRange(p0, p0); }
    if (e.target.id === 'qt-tk-q') { S.tk.q = e.target.value; var tk0 = $('qt-tk-ds'); if (tk0) tk0.innerHTML = bangTK(); }
    if (e.target.id === 'qt-sp-q' || e.target.id === 'qt-sp-nhom') { S.sp.q = $('qt-sp-q').value; S.sp.nhom = $('qt-sp-nhom').value; var sd = $('qt-sp-ds'); if (sd) sd.innerHTML = bangSP(); }
    var dsp = e.target.getAttribute && e.target.getAttribute('data-sp');
    if (dsp === 'ny' || dsp === 'dl' || dsp === 'nyV' || dsp === 'dlV' || dsp === 'vt' || dsp === 'm2') goiYGiaVien();
    if (dsp === 'vt' || dsp === 'm2') { // tự ghép "Đóng gói" cho gạch / ngói
      var vt = document.querySelector('[data-sp=vt]').value.trim(), m2 = document.querySelector('[data-sp=m2]').value.trim();
      document.querySelector('[data-sp=dg]').value = [vt ? vt + ' viên/thùng' : '', m2 ? m2 + ' m²/thùng' : ''].filter(String).join(' · ');
    }
    if (e.target.id === 'qt-gia-q' || e.target.id === 'qt-gia-trong') { S.gia.q = $('qt-gia-q').value; S.gia.trong = $('qt-gia-trong').checked; var g = $('qt-gia-ds'); if (g) g.innerHTML = bangGia(); }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.hasAttribute('data-th')) { var pt = t.getAttribute('data-th').split('|'), xt = S.th.ds[Number(pt[0])]; if (xt) { xt[pt[1]] = t.value.trim(); if (pt[1] === 'nhom' && xt.nhom) S.th.chon[xt.ma] = 1; ve(); } }
    if (t.hasAttribute('data-tem-cfg')) { GT.cfg[t.getAttribute('data-tem-cfg')] = t.value.trim(); luuGT(); if (S.trang === 'tem') ve(); }
    if (t.hasAttribute('data-tem-gia')) { var it = GT.gio[Number(t.getAttribute('data-tem-gia'))]; if (it) { it.gia = String(t.value).replace(/[^\d]/g, ''); luuGT(); ve(); } }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'qt-bg-tim') { var g1 = document.querySelector('#qt-bg-goi-y [data-bg-them]'); if (g1) { e.preventDefault(); g1.click(); } return; } if (e.key === 'Escape' && !$('qt-ngan').hidden) dongDon(); });

  function batDau() {
    if (!S.sess || (S.sess.role !== 'admin' && S.sess.role !== 'nv')) { hienLogin(S.sess ? 'Tài khoản này không có quyền quản trị.' : ''); return; }
    $('qt-login').hidden = true; $('qt-app').hidden = false;
    $('qt-ai').textContent = (S.sess.name || S.sess.username) + ' · ' + (S.sess.role === 'admin' ? 'Quản trị' : 'Nhân viên');
    var m = location.hash.match(/don=([^&]+)/); if (m) { S.moMa = decodeURIComponent(m[1]); S.trang = 'don'; }
    if (/^#tem/.test(location.hash)) S.trang = 'tem';
    veMenu(); ve(); taiDon();
    clearInterval(batDau._t); batDau._t = setInterval(function () { if (!document.hidden) taiDon(true); }, 60000); // tự làm mới mỗi phút
  }
  if (DEMO) { var sc = document.createElement('script'); sc.src = 'demo-data.js?v=16'; sc.onload = batDau; document.head.appendChild(sc); } else batDau();
})();
