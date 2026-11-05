// ============================================================
// TRANG QUẢN TRỊ ĐƠN HÀNG (GĐ1) – cho chủ doanh nghiệp / nhân viên, chạy trên máy tính.
// Dùng chung máy chủ + tài khoản với app bảng giá. Chỉ QUẢN TRỊ được duyệt / đổi trạng thái đơn
// (máy chủ kiểm tra lại); nhân viên chỉ xem.
// ============================================================
(function () {
  'use strict';
  var CFG = window.APP_CONFIG || {};
  var DEMO = !CFG.APPS_URL || /[?&]demo=1/.test(location.search);
  var TEN_TT = { moi: 'Chờ duyệt', giu: 'Đang chừa hàng', xacnhan: 'Đã xác nhận', danggiao: 'Đang giao', dagiao: 'Đã giao', huy: 'Đã hủy', tuchoi: 'Từ chối' };
  var THU_TU = ['moi', 'giu', 'xacnhan', 'danggiao', 'dagiao', 'tuchoi', 'huy'];
  var LS = {
    get: function (k) { try { return JSON.parse(localStorage.getItem('hn_' + k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('hn_' + k, JSON.stringify(v)); } catch (e) { } }
  };
  var S = { sess: (function (s) { return s && (s.token === 'demo') === DEMO ? s : null; })(LS.get('sess')), don: [], dem: {}, trang: 'tong', loc: '', q: '', moMa: '', soMoiCu: -1, ton: null, chuaCfg: [] };
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tien(n) { return Number(n || 0).toLocaleString('vi-VN') + 'đ'; }
  function so(n) { return Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 }); }
  function gio(iso) { var d = new Date(iso); if (isNaN(d)) return esc(iso); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ' ' + ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2); }
  function toast(m) { var t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2800); }
  function laAdmin() { return S.sess && S.sess.role === 'admin'; }
  function nhanTT(tt) { return '<span class="tt tt-' + tt + '">' + (TEN_TT[tt] || tt) + '</span>'; }

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
      S.sess = { token: r.token, role: r.role, username: r.username, name: r.name, tenCty: r.tenCty, sdt: r.sdt || '', diaChi: r.diaChi || '' };
      LS.set('sess', S.sess); $('qt-pass').value = ''; batDau();
    }).catch(function (er) { $('qt-err').textContent = er.message; }).then(function () { nut.disabled = false; });
  });

  // ---------- Tải đơn ----------
  function taiDon(imLang) {
    return api('dsDon', {}).then(function (r) {
      if (r && r.msg === 'forbidden') { hienLogin('Tài khoản không có quyền quản trị.'); return; }
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      S.don = r.data || []; S.dem = r.dem || {}; if (r.chuaCfg) S.chuaCfg = r.chuaCfg;
      var moi = S.dem.moi || 0;
      if (S.soMoiCu >= 0 && moi > S.soMoiCu) toast('🛒 Có ' + (moi - S.soMoiCu) + ' đơn mới');
      S.soMoiCu = moi;
      $('qt-badge').hidden = !moi; $('qt-badge').textContent = moi;
      document.title = (moi ? '(' + moi + ') ' : '') + 'Quản trị đơn hàng – ' + (CFG.TEN_APP || '');
      ve();
      if (S.moMa) moDon(S.moMa);
    }).catch(function (e) { if (!imLang) toast('Không tải được đơn: ' + (e.message || e)); });
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
  function oTon(x, d) {
    if (!S.ton) return '<small class="mo">…</small>';
    var t = S.ton[x.ma];
    if (!t) return '<small class="qt-thieu">Hết / không có</small>';
    var can = x.dv === 'thùng' && t.dvt !== 'thùng' ? (parseFloat(String(x.qd || '').replace(',', '.')) || x.sl) : x.sl; // tồn tính m² mà đặt theo thùng -> so m²
    var thieu = (d.tt === 'moi') && t.tong < can;
    return '<small class="' + (thieu ? 'qt-thieu' : 'qt-du') + '">' + so(t.tong) + ' ' + esc(t.dvt || '') + '</small>' + (t.giu ? '<br><small class="mo">giữ ' + so(t.giu) + '</small>' : '');
  }

  var NUT_LM = '<button type="button" class="btn btn-vien btn-nho qt-lm" data-qt-act="lam-moi">↻ Làm mới</button>';
  // ---------- Vẽ ----------
  function ve() {
    document.querySelectorAll('[data-qt]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-qt') === S.trang); });
    $('qt-main').innerHTML = S.trang === 'don' ? veDon() : veTong();
    var q = $('qt-q'); if (q) { q.value = S.q; }
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
      '<div class="qt-so xanh"><small>Doanh số tháng này (đơn đã xác nhận)</small><b>' + tien(ds) + '</b></div></div>' +
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
  function moDon(ma) {
    var d = S.don.filter(function (x) { return x.ma === ma; })[0];
    if (!d) { if (S.don.length) toast('Không thấy đơn ' + ma); return; }
    S.moMa = ma; history.replaceState(null, '', location.pathname + location.search + '#don=' + encodeURIComponent(ma));
    var html = '<div class="sh-head"><h3>' + esc(d.ma) + ' ' + nhanTT(d.tt) + '</h3><button type="button" class="sh-x" data-qt-act="dong" aria-label="Đóng">✕</button></div><div class="sh-body">' +
      '<div class="qt-tt-ds"><span>Đại lý</span><b>' + esc(d.ten) + '</b><span>Tài khoản</span><div>' + esc(d.user) + '</div><span>SĐT</span><div>' + (d.sdt ? '<a href="tel:' + esc(d.sdt) + '">' + esc(d.sdt) + '</a>' : '—') + '</div>' +
      '<span>Ngày đặt</span><div>' + gio(d.ngay) + '</div><span>Hình thức</span><div>' + esc(d.hinhThuc) + (d.ngayCan ? ' · cần ngày <b>' + esc(d.ngayCan) + '</b>' : '') + '</div>' +
      (d.diaChi ? '<span>Địa chỉ giao</span><div>' + esc(d.diaChi) + '</div>' : '') + (d.ghiChu ? '<span>Ghi chú khách</span><div>' + esc(d.ghiChu) + '</div>' : '') +
      (d.loai === 'chua' ? '<span>Chừa hàng</span><div><b>' + d.soNgay + ' ngày</b>' + (d.tt === 'giu' && d.han ? ' · giữ tới <b>' + ngayNgan(d.han) + '</b> <span class="qt-chua' + (hetHan(d) ? ' het' : '') + '">(' + conLai(d.han) + ')</span>' : d.tt === 'moi' ? ' · chờ duyệt (hạn tính từ ngày duyệt)' : '') + '</div>' : '') +
      (d.xuLy ? '<span>Người xử lý</span><div>' + esc(d.xuLy) + (d.capNhat ? ' · ' + gio(d.capNhat) : '') + '</div>' : '') + '</div>' +
      htmlChuaQT(d) +
      '<div class="sec">Mặt hàng</div><table class="qt-ct"><thead><tr><th>Mã / tên</th><th class="so">SL</th><th class="so an-dt">Được bán</th><th class="so">Đơn giá</th><th class="so">Thành tiền</th></tr></thead><tbody>' +
      d.items.map(function (x) { return '<tr><td><b>' + esc(x.ma) + '</b><br><small>' + esc(x.ten) + '</small></td><td class="so">' + so(x.sl) + ' ' + esc(x.dv) + (x.qd ? '<br><small>' + esc(x.qd) + '</small>' : '') + '</td><td class="so an-dt">' + oTon(x, d) + '</td><td class="so">' + tien(x.dongia) + '</td><td class="so">' + tien(x.tien) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td colspan="4" class="so">Tổng</td><td class="so">' + tien(d.tong) + '</td></tr></tfoot></table>' +
      '<div class="sec">Ghi chú nội bộ</div><textarea class="qt-nb" id="qt-nb"' + (laAdmin() ? '' : ' disabled') + ' placeholder="Chỉ nội bộ thấy (đại lý không thấy)">' + esc(d.ghiChuNB) + '</textarea>' +
      (laAdmin() ? '' : '<p class="mo khong-in" style="margin-top:8px">Chỉ tài khoản Quản trị được duyệt / đổi trạng thái đơn.</p>') +
      '</div><div class="sh-foot"><div class="qt-hd">' +
      (laAdmin() ? nutDon(d).map(function (n) { return '<button type="button" class="btn ' + n[2] + '" data-qt-tt="' + n[0] + '">' + n[1] + '</button>'; }).join('') +
        '<button type="button" class="btn btn-vien" data-qt-act="luu-nb">Lưu</button>' : '') +
      '<button type="button" class="btn btn-vien" data-qt-act="in">In phiếu</button></div></div>';
    $('qt-ngan').innerHTML = html; $('qt-ngan').hidden = false; $('qt-nen').hidden = false;
    if (!S.ton) taiTon().then(function () { if (S.moMa === ma && S.ton) moDon(ma); });
  }
  function nutDon(d) {
    if (d.tt === 'moi' && d.loai === 'chua') return [['giu', 'Duyệt chừa ' + d.soNgay + ' ngày', 'btn-cam'], ['xacnhan', 'Duyệt giao luôn', 'btn-vien'], ['tuchoi', 'Từ chối', 'btn-vien']];
    return NUT[d.tt] || [];
  }
  function htmlChuaQT(d) {
    if (d.loai !== 'chua') return '';
    var ad = laAdmin(), h = '<div class="sec">Chừa hàng & đặt cọc</div><div class="qt-chua-box">';
    if (d.tt === 'giu' && d.xinGH) h += '<div class="qt-xin">⏳ Đại lý xin gia hạn thêm <b>' + d.xinGH + ' ngày</b>' +
      (ad ? '<span><button type="button" class="btn btn-cam btn-nho" data-qt-gh="' + d.xinGH + '">Đồng ý</button><button type="button" class="btn btn-vien btn-nho" data-qt-act="bo-xin">Không</button></span>' : '') + '</div>';
    if (d.tt === 'giu' && hetHan(d)) h += '<div class="qt-xin het">❗ Đã hết hạn chừa – hàng VẪN đang giữ. Chọn: gia hạn / chuyển thành đơn giao / nhả hàng.</div>';
    h += '<div class="qt-coc"><label>Cọc yêu cầu<input id="qt-coc" inputmode="numeric" value="' + (d.coc || 0) + '"' + (ad ? '' : ' disabled') + '></label>' +
      '<label>Đã nhận cọc<input id="qt-dacoc" inputmode="numeric" value="' + (d.daCoc || 0) + '"' + (ad ? '' : ' disabled') + '></label>' +
      '<div class="qt-coc-tt">' + (d.coc ? (d.daCoc >= d.coc ? '✅ Đủ cọc' : '⚠️ Còn thiếu ' + tien(d.coc - (d.daCoc || 0))) : 'Không yêu cầu cọc') + '</div></div>';
    if (ad && d.tt === 'giu') h += '<div class="qt-gh"><span>Gia hạn thêm:</span>' + S.chuaCfg.map(function (c) { return '<button type="button" class="chip" data-qt-gh="' + c.ngay + '">+' + c.ngay + ' ngày</button>'; }).join('') + '</div>';
    return h + '</div>';
  }
  function giaTriCoc() {
    var c = $('qt-coc'), dc = $('qt-dacoc'), n = function (el) { return el ? String(el.value).replace(/[^\d]/g, '') : undefined; };
    return { coc: n(c), daCoc: n(dc) };
  }
  function guiCapNhat(them, thongBao) {
    var d = S.don.filter(function (x) { return x.ma === S.moMa; })[0];
    if (!d) return;
    var p = { ma: d.ma, ghiChuNB: $('qt-nb') ? $('qt-nb').value : undefined }, gc = giaTriCoc();
    if (d.loai === 'chua') { p.coc = gc.coc; p.daCoc = gc.daCoc; }
    Object.keys(them).forEach(function (k) { p[k] = them[k]; });
    api('capNhatDon', p, true).then(function (r) {
      if (!r || r.status !== 'ok') throw new Error((r && r.msg) || 'lỗi');
      toast(thongBao || r.msg || 'Đã cập nhật'); S.ton = null; return taiDon();
    }).catch(function (e) { toast('Không cập nhật được: ' + e.message); });
  }
  function dongDon() { S.moMa = ''; $('qt-ngan').hidden = true; $('qt-nen').hidden = true; history.replaceState(null, '', location.pathname + location.search); }
  function doiTT(tt) {
    var d = S.don.filter(function (x) { return x.ma === S.moMa; })[0];
    if (!d) return;
    var hoi = tt === 'tuchoi' ? 'Từ chối đơn ' : tt === 'huy' ? (d.tt === 'giu' ? 'Nhả hàng (hủy chừa) đơn ' : 'Hủy đơn ') : '';
    if (hoi && !confirm(hoi + d.ma + '?' + (d.daCoc ? '\nLưu ý: đại lý đã cọc ' + tien(d.daCoc) + ' – ghi rõ cách xử lý cọc vào ghi chú nội bộ.' : ''))) return;
    guiCapNhat({ tt: tt });
  }

  // ---------- Bấm ----------
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-qt],[data-qt-loc],[data-don],[data-qt-tt],[data-qt-gh],[data-qt-act]');
    if (!el) { if (e.target.id === 'qt-nen') dongDon(); return; }
    if (el.hasAttribute('data-qt')) { S.trang = el.getAttribute('data-qt'); ve(); return; }
    if (el.hasAttribute('data-qt-loc')) { S.loc = el.getAttribute('data-qt-loc'); S.trang = 'don'; ve(); return; }
    if (el.hasAttribute('data-don')) { moDon(el.getAttribute('data-don')); return; }
    if (el.hasAttribute('data-qt-tt')) { doiTT(el.getAttribute('data-qt-tt')); return; }
    if (el.hasAttribute('data-qt-gh')) { var n = el.getAttribute('data-qt-gh'); if (confirm('Gia hạn chừa hàng thêm ' + n + ' ngày?')) guiCapNhat({ giaHan: n }); return; }
    var a = el.getAttribute('data-qt-act');
    if (a === 'dong') dongDon();
    else if (a === 'in') window.print();
    else if (a === 'luu-nb') guiCapNhat({}, 'Đã lưu');
    else if (a === 'bo-xin') guiCapNhat({ boXin: 1 });
    else if (a === 'lam-moi') { S.ton = null; el.disabled = true; taiDon().then(function () { toast('Đã làm mới'); }); }
    else if (a === 'dang-xuat') { try { localStorage.removeItem('hn_sess'); } catch (er) { } S.sess = null; hienLogin(); }
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'qt-q') { S.q = e.target.value; var k = document.querySelector('.qt-khung'); if (k) k.innerHTML = bangDon(locDon(), 'Không có đơn phù hợp'); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('qt-ngan').hidden) dongDon(); });

  function batDau() {
    if (!S.sess || (S.sess.role !== 'admin' && S.sess.role !== 'nv')) { hienLogin(S.sess ? 'Tài khoản này không có quyền quản trị.' : ''); return; }
    $('qt-login').hidden = true; $('qt-app').hidden = false;
    $('qt-ai').textContent = (S.sess.name || S.sess.username) + ' · ' + (S.sess.role === 'admin' ? 'Quản trị' : 'Nhân viên');
    var m = location.hash.match(/don=([^&]+)/); if (m) { S.moMa = decodeURIComponent(m[1]); S.trang = 'don'; }
    ve(); taiDon();
    clearInterval(batDau._t); batDau._t = setInterval(function () { if (!document.hidden) taiDon(true); }, 60000); // tự làm mới mỗi phút
  }
  if (DEMO) { var sc = document.createElement('script'); sc.src = 'demo-data.js?v=5'; sc.onload = batDau; document.head.appendChild(sc); } else batDau();
})();
