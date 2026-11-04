// ============================================================
// APP BẢNG GIÁ + TỒN KHO (nhiều hãng). Thông số riêng: config.js.
// Dữ liệu: Apps Script (backend/) đọc Google Sheet. Mọi quyền kiểm tra
// ở máy chủ – app chỉ hiển thị cái máy chủ đã cho phép.
// ============================================================
(function () {
  'use strict';
  var CFG = window.APP_CONFIG || {};
  var DEMO = !CFG.APPS_URL || /[?&]demo=1/.test(location.search);
  var NGUONG = CFG.NGUONG_TON_KHACH || 50;
  var MOI_TRANG = 40;
  var TEN_VT = { admin: 'Quản trị', nv: 'Nhân viên', khachhang: 'Đại lý' };
  var TEN_TIER = { nhanh: 'Có hàng ngay', mai: 'Mai có hàng', cho: 'Chờ hàng' };
  var COT_LOC = [['kc', 'Kích cỡ'], ['loai', 'Loại'], ['mau', 'Màu'], ['congNang', 'Công năng'], ['tinhNang', 'Tính năng'],
    ['hoaVan', 'Hoa văn'], ['men', 'Men / bề mặt'], ['dungTich', 'Dung tích']];
  var COT_NHIEU_GIA_TRI = { mau: 1, congNang: 1, tinhNang: 1 }; // ô có thể ghi "Lát nền, Ốp tường"

  // ---------- Bộ nhớ trên máy (tiền tố hn_ để không lẫn app khác) ----------
  var LS = {
    get: function (k) { try { return JSON.parse(localStorage.getItem('hn_' + k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('hn_' + k, JSON.stringify(v)); } catch (e) { } },
    del: function (k) { try { localStorage.removeItem('hn_' + k); } catch (e) { } }
  };

  var S = {
    // Phiên của chế độ dùng thử không dùng được với máy chủ thật (và ngược lại).
    sess: (function (s) { return s && (s.token === 'demo') === DEMO ? s : null; })(LS.get('sess')), items: [], byMa: {}, anh: {}, ton: null, tonLoi: '', tonDangTai: false,
    dangTai: false, loi: '', nhom: '', hang: '', q: '', qHome: '', loc: {}, sort: '', trang: 1,
    sp: '', anhIdx: 0, moTuApp: false
  };

  // ---------- Tiện ích ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  function tien(n) { return n > 0 ? Number(n).toLocaleString('vi-VN') + 'đ' : 'Liên hệ'; }
  function so(n) { return Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 }); }
  function laKhach() { return !S.sess || S.sess.role === 'khachhang'; }
  function laNoiBo() { return !!S.sess && S.sess.role !== 'khachhang'; }
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }

  // ---------- Gọi máy chủ ----------
  function api(action, params, post) {
    if (DEMO) return window.DEMO_API ? window.DEMO_API(action, params || {}, S.sess) : Promise.reject(new Error('Thiếu demo-data.js'));
    var p = { action: action, k: CFG.APP_KEY, t: (S.sess && S.sess.token) || '' };
    Object.keys(params || {}).forEach(function (k) { p[k] = params[k]; });
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var hen = setTimeout(function () { if (ctl) ctl.abort(); }, 40000);
    // POST không đặt Content-Type (mặc định text/plain) để trình duyệt không gửi yêu cầu kiểm tra trước (CORS).
    var req = post
      ? fetch(CFG.APPS_URL, { method: 'POST', body: JSON.stringify(p), signal: ctl && ctl.signal })
      : fetch(CFG.APPS_URL + '?' + Object.keys(p).map(function (k) { return k + '=' + encodeURIComponent(p[k]); }).join('&'), { signal: ctl && ctl.signal });
    return req.then(function (r) { clearTimeout(hen); return r.json(); }, function (e) { clearTimeout(hen); throw e; });
  }
  function loiDeHieu(e) {
    if (!e) return 'lỗi không rõ';
    if (e.name === 'AbortError') return 'máy chủ phản hồi quá lâu';
    if (/fetch|network|load failed/i.test(e.message || '')) return 'không có mạng hoặc máy chủ chưa bật';
    return e.message || String(e);
  }

  // ---------- Nhóm hàng ----------
  var NHOM = (CFG.NHOM_HANG || []).slice();
  var NHOM_KHAC = { key: 'khac', ten: 'Khác', ngan: 'Khác', icon: '📦', alias: [] };
  var mapNhom = {};
  NHOM.forEach(function (g) { [g.key, g.ten, g.ngan].concat(g.alias || []).forEach(function (a) { mapNhom[norm(a)] = g.key; }); });
  function nhomCua(ten) {
    var k = norm(ten);
    if (!k) return 'khac';
    if (mapNhom[k]) return mapNhom[k];
    for (var i = 0; i < NHOM.length; i++) if (k.indexOf(norm(NHOM[i].ten)) === 0) return NHOM[i].key;
    return 'khac';
  }
  function dsNhom() { return S.items.some(function (p) { return p._nhom === 'khac'; }) ? NHOM.concat([NHOM_KHAC]) : NHOM; }
  function nhomTheoKey(k) { return dsNhom().filter(function (g) { return g.key === k; })[0] || { key: 'all', ten: 'Tất cả sản phẩm', icon: '🗂️' }; }

  // ---------- Dữ liệu ----------
  function khoaDem() { return (DEMO ? 'demo_' : '') + 'gia_' + (S.sess ? S.sess.role : 'khach'); }
  function nhanGia(res) {
    S.items = (res.data || []).map(function (p) {
      p._nhom = nhomCua(p.nhom);
      p._tk = norm([p.ma, p.ten, p.hang, p.kc, p.loai, p.mau, p.nhom].join(' '));
      return p;
    });
    S.byMa = {};
    S.items.forEach(function (p) { S.byMa[p.ma] = p; });
    S.anh = res.anh || {};
  }
  function taiDuLieu() {
    var c = LS.get(khoaDem());
    if (c && c.data) { nhanGia(c); veLai(); }
    S.dangTai = true; S.loi = ''; capNhatTrangThai();
    api('getAll').then(function (res) {
      if (!res || res.status !== 'ok') throw new Error((res && res.msg) || 'máy chủ báo lỗi');
      if (S.sess && res.daDangNhap === false) { hetPhien(); return; }
      LS.set(khoaDem(), { data: res.data, anh: res.anh, luc: res.luc });
      nhanGia(res);
    }).catch(function (e) {
      S.loi = 'Không tải được bảng giá: ' + loiDeHieu(e) + (S.items.length ? ' (đang hiện bản lưu trên máy)' : '');
    }).then(function () { S.dangTai = false; capNhatTrangThai(); veLai(); });
    if (S.sess) taiTonKho();
  }
  function taiTonKho() {
    S.tonDangTai = true; S.tonLoi = ''; capNhatTrangThai();
    api('getTonKho').then(function (res) {
      if (!res || res.status !== 'ok') throw new Error((res && res.msg) || 'máy chủ báo lỗi');
      S.ton = res.data || {};
    }).catch(function (e) {
      // Bài học Đồng Tâm: báo lỗi rõ, không treo "đang tải tồn kho".
      S.tonLoi = 'Không tải được tồn kho: ' + loiDeHieu(e);
    }).then(function () { S.tonDangTai = false; capNhatTrangThai(); veLai(); });
  }
  function capNhatTrangThai() {
    $('sync').textContent = (S.dangTai || S.tonDangTai) ? '⏳' : (S.loi || S.tonLoi ? '⚠️' : '✓');
    var loi = S.loi || S.tonLoi, b = $('loi-bar');
    b.hidden = !loi;
    if (loi) b.innerHTML = '<span>' + esc(loi) + '</span><button type="button" data-act="thu-lai">Thử lại</button>';
  }

  // ---------- Tồn kho hiển thị ----------
  function soTon(n, dvt) {
    if (laKhach() && n > NGUONG) return NGUONG + '+' + (dvt ? ' ' + dvt : '');
    return so(n) + (dvt ? ' ' + dvt : '');
  }
  function tierChinh(d) { return d.tier.nhanh > 0 ? 'nhanh' : (d.tier.mai > 0 ? 'mai' : 'cho'); }
  function nhanTon(p) {
    if (!S.sess || !S.ton) return '';
    var d = S.ton[p.ma];
    if (!d || d.tong <= 0) return '<span class="ton">Liên hệ</span>';
    var t = tierChinh(d);
    return '<span class="ton ' + t + '">' + (t === 'nhanh' ? 'Có sẵn ' + soTon(d.tier.nhanh, d.dvt) : TEN_TIER[t]) + '</span>';
  }
  // Sắp xếp "tồn nhiều": ưu tiên hàng có ngay, rồi mai có, rồi chờ hàng.
  function tongTon(p) { var d = S.ton && S.ton[p.ma]; return d ? d.tier.nhanh * 1e8 + d.tier.mai * 1e4 + d.tier.cho : 0; }

  // ---------- Ảnh ----------
  function anhCua(ma) { return S.anh[ma] || []; }
  function iconNhom(p) { return nhomTheoKey(p._nhom).icon || '📦'; }
  function thumb(p) {
    var a = anhCua(p.ma)[0];
    return '<div class="thumb">' + (a ? '<img class="anh" loading="lazy" alt="" src="' + esc(a) + '" data-icon="' + esc(iconNhom(p)) + '">' : iconNhom(p)) +
      (p.hang ? '<span class="tag-hang">' + esc(p.hang) + '</span>' : '') + '</div>';
  }
  // Ảnh lỗi (Drive chưa chia sẻ công khai, link sai) -> hiện icon thay vì khung trắng.
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (img && img.classList && img.classList.contains('anh')) img.outerHTML = esc(img.getAttribute('data-icon') || '📦');
  }, true);

  // ---------- Lọc + tìm ----------
  function dsCoSo() {
    return S.items.filter(function (p) {
      return (S.nhom === 'all' || p._nhom === S.nhom) && (!S.hang || p.hang === S.hang);
    });
  }
  function giaTriCot(p, k) {
    var v = p[k] || '';
    if (!v) return [];
    return COT_NHIEU_GIA_TRI[k] ? v.split(/[,;]/).map(function (x) { return x.trim(); }).filter(String) : [v];
  }
  function timKiem(ds, q) {
    var t = norm(q);
    if (!t) return ds;
    var tu = String(q).trim().split(/\s+/).map(norm).filter(String);
    return ds.filter(function (p) { return tu.every(function (w) { return p._tk.indexOf(w) >= 0; }); });
  }
  function dsHienThi() {
    var ds = timKiem(dsCoSo(), S.q);
    Object.keys(S.loc).forEach(function (k) {
      var v = S.loc[k];
      if (v) ds = ds.filter(function (p) { return giaTriCot(p, k).indexOf(v) >= 0; });
    });
    if (S.sort === 'gia-tang') ds = ds.slice().sort(function (a, b) { return (a.ny || 9e15) - (b.ny || 9e15); });
    else if (S.sort === 'gia-giam') ds = ds.slice().sort(function (a, b) { return (b.ny || 0) - (a.ny || 0); });
    else if (S.sort === 'ton') ds = ds.slice().sort(function (a, b) { return tongTon(b) - tongTon(a); });
    return ds;
  }
  function soLocDangBat() { return Object.keys(S.loc).filter(function (k) { return S.loc[k]; }).length; }

  // ---------- Thẻ sản phẩm ----------
  function the(p) {
    var dl = S.sess && p.dl > 0 ? '<div class="gia-dl">ĐL: ' + tien(p.dl) + '</div>' : '';
    return '<button type="button" class="card" data-sp="' + esc(p.ma) + '">' + thumb(p) +
      '<div class="card-body"><div class="card-ma">' + esc(p.ma) + '</div>' +
      '<div class="card-ten">' + esc([p.ten, p.kc].filter(String).join(' · ')) + '</div>' +
      '<div class="card-gia"><div class="gia-ny">' + tien(p.ny) + (p.ny && p.dvt ? ' <span class="dvt">/' + esc(p.dvt) + '</span>' : '') + '</div>' + dl + '</div>' +
      nhanTon(p) + '</div></button>';
  }
  function luoi(ds, gioiHan) {
    if (!ds.length) return '<div class="trong"><i>🔍</i>Không tìm thấy sản phẩm phù hợp</div>';
    var html = '<div class="grid">' + ds.slice(0, gioiHan).map(the).join('') + '</div>';
    if (ds.length > gioiHan) html += '<button type="button" class="btn btn-chinh them" data-act="them">Xem thêm (' + (ds.length - gioiHan) + ')</button>';
    return html;
  }

  // ---------- Điều hướng bằng #hash (nút Back điện thoại hoạt động, gửi link được) ----------
  function docHash() {
    var h = {};
    location.hash.replace(/^#/, '').split('&').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i > 0) h[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1));
    });
    return h;
  }
  function ghiHash(h, thay) {
    var s = Object.keys(h).filter(function (k) { return h[k]; }).map(function (k) { return k + '=' + encodeURIComponent(h[k]); }).join('&');
    var url = location.pathname + location.search + (s ? '#' + s : '');
    if (thay) history.replaceState(null, '', url); else history.pushState(null, '', url);
    theoHash();
  }
  function theoHash() {
    var h = docHash();
    var nhomMoi = h.n || '', hangMoi = h.h || '';
    if (nhomMoi !== S.nhom || hangMoi !== S.hang) { S.nhom = nhomMoi; S.hang = hangMoi; S.loc = {}; S.q = ''; S.trang = 1; S.sort = ''; veTrang(); }
    S.sp = h.sp || '';
    capNhatNav();
    if (S.sp) moChiTiet(); else dongSheet(true);
  }
  function diToi(nhom, hang) { ghiHash({ n: nhom, h: hang }); window.scrollTo(0, 0); }

  // ---------- Vẽ ----------
  function veLai() {
    if ($('app').hidden) return;
    var dangGo = document.activeElement && /^tk-/.test(document.activeElement.id);
    if (dangGo) veKetQua(); else veTrang();
    // Chi tiết đang mở thì vẽ lại (giá/tồn kho vừa về); mở bằng link (#sp=…) trước khi tải xong thì giờ mới mở.
    var sh = $('sheet');
    if (S.sp && S.items.length && (sh.hidden || sh.getAttribute('data-loai') === 'sp')) moChiTiet(!sh.hidden);
  }
  function veTrang() {
    if (S.nhom) veDanhSach(); else veTrangChu();
  }
  function veKetQua() {
    if (S.nhom) { var k = $('list-kq'); if (k) k.innerHTML = htmlKetQuaDS(); }
    else { var h = $('home-kq'); if (h) h.innerHTML = htmlKetQuaHome(); }
  }
  function dangTaiHtml() {
    if (S.items.length) return '';
    return S.dangTai ? '<div class="dang-tai">⏳ Đang tải bảng giá…</div>' : '<div class="trong"><i>📭</i>Chưa có dữ liệu bảng giá</div>';
  }

  function veTrangChu() {
    var dem = {}, hang = {};
    S.items.forEach(function (p) { dem[p._nhom] = (dem[p._nhom] || 0) + 1; if (p.hang) hang[p.hang] = (hang[p.hang] || 0) + 1; });
    var html = '<label class="search"><span>🔍</span><input id="tk-home" type="search" placeholder="Tìm mã, tên, hãng ở mọi nhóm hàng…" value="' + esc(S.qHome) + '"></label>' +
      '<div id="home-kq">' + htmlKetQuaHome() + '</div>';
    $('main').innerHTML = html;
    function htmlNhom() {
      return '<h2 class="h2">Nhóm hàng</h2><div class="dm-grid">' + dsNhom().map(function (g) {
        return '<button type="button" class="dm-card" data-nhom="' + g.key + '"><i>' + g.icon + '</i><b>' + esc(g.ten) + '</b><small>' + (dem[g.key] || 0) + ' mã</small></button>';
      }).join('') + '</div>' +
        (Object.keys(hang).length ? '<h2 class="h2">Hãng</h2><div class="chips" style="flex-wrap:wrap">' + Object.keys(hang).sort().map(function (h) {
          return '<button type="button" class="chip" data-hang-home="' + esc(h) + '">' + esc(h) + ' <small>' + hang[h] + '</small></button>';
        }).join('') + '</div>' : '');
    }
    S._htmlNhom = htmlNhom;
    $('home-kq').innerHTML = htmlKetQuaHome();
  }
  function htmlKetQuaHome() {
    if (!S.qHome.trim()) return dangTaiHtml() + (S._htmlNhom ? S._htmlNhom() : '');
    var ds = timKiem(S.items, S.qHome);
    return '<div class="dem">' + ds.length + ' kết quả</div>' + luoi(ds, 60);
  }

  function veDanhSach() {
    var g = nhomTheoKey(S.nhom), coSo = S.items.filter(function (p) { return S.nhom === 'all' || p._nhom === S.nhom; });
    var hang = {};
    coSo.forEach(function (p) { if (p.hang) hang[p.hang] = (hang[p.hang] || 0) + 1; });
    var dsHang = Object.keys(hang).sort();
    var nl = soLocDangBat();
    var html = '<div class="list-head"><button type="button" class="back" data-act="home" aria-label="Về trang chủ">←</button><h2>' + g.icon + ' ' + esc(g.ten) + (S.hang && S.nhom === 'all' ? ' · ' + esc(S.hang) : '') + '</h2></div>' +
      '<label class="search"><span>🔍</span><input id="tk-list" type="search" placeholder="Tìm mã, tên, kích cỡ…" value="' + esc(S.q) + '"></label>' +
      (dsHang.length > 1 ? '<div class="chips" style="margin-top:10px"><button type="button" class="chip' + (S.hang ? '' : ' on') + '" data-hang="">Tất cả hãng</button>' +
        dsHang.map(function (h) { return '<button type="button" class="chip' + (S.hang === h ? ' on' : '') + '" data-hang="' + esc(h) + '">' + esc(h) + ' <small>' + hang[h] + '</small></button>'; }).join('') + '</div>' : '') +
      '<div class="tools"><button type="button" class="tool' + (nl ? ' on' : '') + '" data-act="loc">⚙️ Lọc' + (nl ? ' (' + nl + ')' : '') + '</button>' +
      '<label class="tool">↕ <select id="sort" aria-label="Sắp xếp">' +
      [['', 'Mặc định'], ['gia-tang', 'Giá thấp → cao'], ['gia-giam', 'Giá cao → thấp']].concat(S.sess && S.ton ? [['ton', 'Tồn nhiều nhất']] : [])
        .map(function (o) { return '<option value="' + o[0] + '"' + (S.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') +
      '</select></label></div><div id="list-kq">' + htmlKetQuaDS() + '</div>';
    $('main').innerHTML = html;
  }
  function htmlKetQuaDS() {
    if (!S.items.length) return dangTaiHtml();
    var ds = dsHienThi();
    return '<div class="dem">' + ds.length + ' sản phẩm</div>' + luoi(ds, S.trang * MOI_TRANG);
  }

  function capNhatNav() {
    var tabs = [{ key: '', ten: 'Trang chủ', ngan: 'Trang chủ', icon: '▦' }].concat(NHOM.slice(0, 5));
    $('bottom-nav').innerHTML = tabs.map(function (g) {
      var on = (S.nhom === g.key) || (!g.key && !S.nhom);
      return '<button type="button" class="bn' + (on ? ' on' : '') + '" data-nav="' + g.key + '"><i>' + g.icon + '</i><span>' + esc(g.ngan || g.ten) + '</span></button>';
    }).join('');
  }

  // ---------- Bảng trượt ----------
  function moSheet(html, loai) {
    var s = $('sheet');
    s.innerHTML = html; s.setAttribute('data-loai', loai);
    s.hidden = false; $('sheet-nen').hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function dongSheet(chiAn) {
    var s = $('sheet');
    if (!chiAn && s.getAttribute('data-loai') === 'sp' && S.sp) {
      // Đóng chi tiết = bỏ "sp" khỏi địa chỉ (Back nếu mở từ trong app).
      if (S.moTuApp) { S.moTuApp = false; history.back(); return; }
      var h = docHash(); delete h.sp; ghiHash(h, true); return;
    }
    s.hidden = true; $('sheet-nen').hidden = true; s.innerHTML = ''; s.removeAttribute('data-loai');
    document.body.style.overflow = '';
  }
  function dauSheet(tieuDe, phu) {
    return '<div class="sh-head"><div><h3>' + tieuDe + '</h3>' + (phu ? '<p>' + phu + '</p>' : '') + '</div><button type="button" class="sh-close" data-act="dong" aria-label="Đóng">✕</button></div>';
  }

  // ---------- Chi tiết sản phẩm ----------
  function moChiTiet(giuAnh) {
    var p = S.byMa[S.sp];
    if (!p) {
      if (!S.items.length) return; // chờ tải xong sẽ mở
      toast('Không tìm thấy mã ' + S.sp); S.sp = ''; var h = docHash(); delete h.sp; ghiHash(h, true); return;
    }
    if (!giuAnh) S.anhIdx = 0;
    var anh = anhCua(p.ma), html = dauSheet(esc(p.ma), esc([p.ten, [p.hang, nhomTheoKey(p._nhom).ten].filter(String).join(' · ')].filter(String).join(' — ')));
    html += '<div class="sh-body"><div class="anh-wrap">' +
      (anh.length ? '<img class="anh" alt="" src="' + esc(anh[S.anhIdx] || anh[0]) + '" data-icon="' + esc(iconNhom(p)) + '">' : iconNhom(p)) +
      (anh.length > 1 ? '<button type="button" class="anh-nav trai" data-anh="-1" aria-label="Ảnh trước">‹</button><button type="button" class="anh-nav phai" data-anh="1" aria-label="Ảnh sau">›</button><span class="anh-so">' + (S.anhIdx + 1) + '/' + anh.length + '</span>' : '') + '</div>';

    // Giá
    var dv = p.dvt ? ' <span class="mo">/' + esc(p.dvt) + '</span>' : '';
    html += '<div class="sec">Giá</div><div class="box"><div class="gia-hang ny"><span>Giá niêm yết</span><b>' + tien(p.ny) + dv + '</b></div>';
    if (S.sess) html += '<div class="gia-hang dl"><span>Giá đại lý</span><b>' + (p.dl > 0 ? tien(p.dl) + dv : '<span class="mo">Chưa có</span>') + '</b></div>';
    else html += '<button type="button" class="btn btn-vien" data-act="dang-nhap">🔒 Đăng nhập để xem giá đại lý</button>';
    html += '</div>';

    // Quy đổi m² ↔ thùng (khi cột Đóng gói ghi "... m²/thùng")
    var qd = quyDoi(p);
    if (qd) {
      html += '<div class="sec">Tính số thùng</div><div class="box"><div class="quydoi"><span>Khách cần</span><input id="qd-m2" type="number" inputmode="decimal" min="0" step="0.1" placeholder="0"><span>m²</span></div><div class="quydoi-kq" id="qd-kq">' +
        so(qd.m2) + ' m²/thùng' + (qd.vien ? ' · ' + qd.vien + ' viên/thùng' : '') + '</div></div>';
    }

    // Thông tin
    var tt = [['Hãng', p.hang], ['Nhóm hàng', p.nhom], ['Kích cỡ / Quy cách', p.kc], ['Loại', p.loai], ['Đơn vị', p.dvt], ['Đóng gói', p.dg],
      ['Màu', p.mau], ['Công năng', p.congNang], ['Tính năng', p.tinhNang], ['Hoa văn', p.hoaVan], ['Men / bề mặt', p.men], ['Dung tích', p.dungTich], ['Ghi chú', p.gc]]
      .filter(function (r) { return r[1]; });
    if (tt.length) html += '<div class="sec">Thông tin</div><table class="tt">' + tt.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>';

    html += '<div class="sec">Tồn kho</div><div class="box">' + htmlTonKho(p) + '</div>';
    html += '<div class="sec"></div><button type="button" class="btn btn-chinh" data-act="chep" data-ma="' + esc(p.ma) + '">📋 Sao chép thông tin gửi khách</button></div>';

    var cuon = giuAnh ? $('sheet').scrollTop : 0;
    moSheet(html, 'sp');
    $('sheet').scrollTop = cuon;
    var inp = $('qd-m2');
    if (inp) inp.addEventListener('input', function () {
      var m = parseFloat(String(inp.value).replace(',', '.')) || 0;
      $('qd-kq').innerHTML = m > 0 ? ('Cần <b>' + Math.ceil(m / qd.m2 - 1e-9) + ' thùng</b> = ' + so(Math.ceil(m / qd.m2 - 1e-9) * qd.m2) + ' m²' + (qd.vien ? ' (' + Math.ceil(m / qd.m2 - 1e-9) * qd.vien + ' viên)' : '')) : so(qd.m2) + ' m²/thùng';
    });
  }
  function quyDoi(p) {
    var s = String(p.dg || '').toLowerCase();
    var m = s.match(/([\d.,]+)\s*m(?:²|2)\s*\/\s*th(?:ù|u)ng/);
    if (!m) return null;
    var m2 = parseFloat(m[1].replace(',', '.'));
    if (!(m2 > 0)) return null;
    var v = s.match(/(\d+)\s*vi(?:ê|e)n\s*\/\s*th(?:ù|u)ng/);
    return { m2: m2, vien: v ? Number(v[1]) : 0 };
  }
  function htmlTonKho(p) {
    if (!S.sess) return '<button type="button" class="btn btn-vien" style="margin:0" data-act="dang-nhap">🔒 Đăng nhập để xem tồn kho</button>';
    if (S.tonLoi && !S.ton) return '<div class="mo">' + esc(S.tonLoi) + '</div><button type="button" class="btn btn-chinh btn-nho" style="margin-top:8px" data-act="thu-lai">Thử lại</button>';
    if (!S.ton) return '<div class="mo">⏳ Đang tải tồn kho…</div>';
    var d = S.ton[p.ma];
    if (!d || d.tong <= 0) return '<div class="mo">Hiện không có sẵn trong kho – liên hệ để đặt hàng.</div>';
    var html = '<div class="tier">' + ['nhanh', 'mai', 'cho'].filter(function (t) { return d.tier[t] > 0; }).map(function (t) {
      return '<span class="ton ' + t + '">' + TEN_TIER[t] + ': ' + soTon(d.tier[t], d.dvt) + '</span>';
    }).join('') + '</div>';
    // Tên kho, số lô: máy chủ chỉ gửi cho nhân viên/quản trị.
    if (laNoiBo() && d.kho) html += d.kho.map(function (k) {
      return '<div class="kho"><div class="kho-dong"><span>' + esc(k.ten) + ' <span class="ton ' + k.nhom + '">' + TEN_TIER[k.nhom] + '</span></span><span>' + soTon(k.tong, d.dvt) + '</span></div>' +
        (k.lo && k.lo.length ? '<div class="lo">' + k.lo.map(function (l) { return 'Lô ' + esc(l.so) + ': ' + so(l.sl); }).join(' · ') + '</div>' : '') + '</div>';
    }).join('');
    return html;
  }
  function chepThongTin(ma) {
    var p = S.byMa[ma];
    if (!p) return;
    var txt = [p.ma + (p.ten ? ' – ' + p.ten : ''), p.hang ? 'Hãng: ' + p.hang : '', p.kc ? 'Quy cách: ' + p.kc : '',
      'Giá niêm yết: ' + tien(p.ny) + (p.dvt ? '/' + p.dvt : ''), CFG.TEN_DAY_DU || ''].filter(String).join('\n');
    var xong = function () { toast('Đã sao chép'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(xong, function () { chepCu(txt); xong(); });
    else { chepCu(txt); xong(); }
  }
  function chepCu(txt) {
    var t = document.createElement('textarea'); t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) { } t.remove();
  }

  // ---------- Bảng lọc ----------
  function moLoc() {
    var coSo = timKiem(dsCoSo(), S.q), html = dauSheet('Lọc sản phẩm', esc(nhomTheoKey(S.nhom).ten)) + '<div class="sh-body">', co = 0;
    COT_LOC.forEach(function (c) {
      var dem = {};
      coSo.forEach(function (p) { giaTriCot(p, c[0]).forEach(function (v) { dem[v] = (dem[v] || 0) + 1; }); });
      var ds = Object.keys(dem).sort(function (a, b) { return a.localeCompare(b, 'vi', { numeric: true }); });
      if (ds.length < 2 && !S.loc[c[0]]) return;
      co++;
      html += '<div class="loc-nhom"><div class="sec" style="margin-top:0">' + c[1] + '</div><div class="chips">' +
        '<button type="button" class="chip' + (S.loc[c[0]] ? '' : ' on') + '" data-loc="' + c[0] + '" data-v="">Tất cả</button>' +
        ds.map(function (v) { return '<button type="button" class="chip' + (S.loc[c[0]] === v ? ' on' : '') + '" data-loc="' + c[0] + '" data-v="' + esc(v) + '">' + esc(v) + ' <small>' + dem[v] + '</small></button>'; }).join('') +
        '</div></div>';
    });
    if (!co) html += '<div class="trong"><i>⚙️</i>Nhóm này chưa có thông tin để lọc (Màu, Công năng…)</div>';
    html += '</div><div class="sh-foot"><button type="button" class="btn btn-vien" style="margin:0" data-act="xoa-loc">Bỏ lọc</button><button type="button" class="btn btn-chinh" data-act="dong">Xem ' + dsHienThi().length + ' sản phẩm</button></div>';
    moSheet(html, 'loc');
  }

  // ---------- Quản lý tài khoản (chỉ admin; máy chủ kiểm tra lại) ----------
  var dsUser = [];
  function moQuanLy() {
    moSheet(dauSheet('Quản lý tài khoản', 'Quản trị · Nhân viên · Đại lý') + '<div class="sh-body"><div class="dang-tai">⏳ Đang tải…</div></div>', 'user');
    api('listUsers').then(function (res) {
      if (!res || res.status !== 'ok') throw new Error((res && res.msg) || 'lỗi');
      dsUser = res.data || [];
      veQuanLy();
    }).catch(function (e) { $('sheet').querySelector('.sh-body').innerHTML = '<div class="trong">' + esc(loiDeHieu(e)) + '</div>'; });
  }
  function veQuanLy() {
    var b = $('sheet').querySelector('.sh-body');
    if (!b) return;
    b.innerHTML = '<button type="button" class="btn btn-chinh" data-act="user-moi">＋ Thêm tài khoản</button><div class="sec">' + dsUser.length + ' tài khoản</div><div class="u-ds">' +
      dsUser.map(function (u, i) {
        return '<button type="button" class="u-dong" data-user="' + i + '"><span><b>' + esc(u.ten || u.username) + '</b><small>' + esc(u.username) + (u.tenCty ? ' · ' + esc(u.tenCty) : '') + (u.khoa ? ' · 🔒 đã khóa' : '') + '</small></span><span class="vt vt-' + u.role + '">' + (TEN_VT[u.role] || '?') + '</span></button>';
      }).join('') + '</div>';
  }
  function formUser(u) {
    var moi = !u; u = u || { role: 'khachhang' };
    var b = $('sheet').querySelector('.sh-body');
    b.innerHTML = '<form class="form" id="f-user">' +
      '<label>Username<input name="username" required value="' + esc(u.username || '') + '"' + (moi ? '' : ' readonly') + ' autocapitalize="none" placeholder="vd: dl_minhphat"></label>' +
      '<label>Họ tên<input name="ten" value="' + esc(u.ten || '') + '"></label>' +
      '<div class="hang2"><label>Vai trò<select name="role">' + ['khachhang', 'nv', 'admin'].map(function (r) { return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + TEN_VT[r] + '</option>'; }).join('') + '</select></label>' +
      '<label>Mật khẩu ' + (moi ? '' : '(trống = giữ nguyên)') + '<input name="password" type="text" autocomplete="new-password"' + (moi ? ' required minlength="6"' : '') + '></label></div>' +
      '<label>Tên công ty<input name="tenCty" value="' + esc(u.tenCty || '') + '"></label>' +
      '<div class="hang2"><label>SĐT<input name="sdt" value="' + esc(u.sdt || '') + '" inputmode="tel"></label><label>Địa chỉ<input name="diaChi" value="' + esc(u.diaChi || '') + '"></label></div>' +
      '<label class="ck"><input type="checkbox" name="khoa"' + (u.khoa ? ' checked' : '') + '> Khóa tài khoản (không đăng nhập được)</label>' +
      '<div class="sh-foot" style="padding:0;margin-top:14px"><button type="button" class="btn btn-vien" style="margin:0" data-act="user-ds">← Danh sách</button><button type="submit" class="btn btn-chinh">Lưu</button></div></form>';
    $('f-user').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target, nut = f.querySelector('[type=submit]'), d = {};
      ['username', 'ten', 'role', 'password', 'tenCty', 'sdt', 'diaChi'].forEach(function (k) { d[k] = f.elements[k].value.trim(); });
      d.khoa = f.elements.khoa.checked;
      nut.disabled = true; nut.textContent = 'Đang lưu…';
      api('luuUser', d, true).then(function (res) {
        if (!res || res.status !== 'ok') throw new Error((res && res.msg) || 'lỗi');
        toast(res.msg || 'Đã lưu'); moQuanLy();
      }).catch(function (err) { nut.disabled = false; nut.textContent = 'Lưu'; toast('Không lưu được: ' + loiDeHieu(err)); });
    });
  }

  // ---------- Đăng nhập / đăng xuất ----------
  function hienDangNhap() {
    $('app').hidden = true; $('login').hidden = false; dongSheet(true);
    $('login-err').textContent = '';
    setTimeout(function () { $('inp-user').focus(); }, 50);
  }
  function hienApp() {
    $('login').hidden = true; $('app').hidden = false;
    $('top-user').textContent = S.sess ? (S.sess.name || S.sess.username) + ' · ' + TEN_VT[S.sess.role] : 'Khách · giá niêm yết';
    $('demo-bar').hidden = !DEMO;
    theoHash(); veTrang(); taiDuLieu();
  }
  function dangNhap(e) {
    e.preventDefault();
    var u = $('inp-user').value.trim(), pw = $('inp-pass').value, nut = $('btn-login');
    if (!u || !pw) { $('login-err').textContent = 'Nhập tài khoản và mật khẩu.'; return; }
    nut.disabled = true; nut.textContent = 'Đang đăng nhập…'; $('login-err').textContent = '';
    api('login', { username: u, password: pw }, true).then(function (res) {
      if (!res || res.status !== 'ok') throw new Error((res && res.msg) || 'Đăng nhập thất bại');
      S.sess = { token: res.token, role: res.role, username: res.username, name: res.name, tenCty: res.tenCty };
      LS.set('sess', S.sess); LS.del('khach'); S.ton = null; S.tonLoi = '';
      $('inp-pass').value = '';
      hienApp();
    }).catch(function (err) {
      $('login-err').textContent = loiDeHieu(err);
    }).then(function () { nut.disabled = false; nut.textContent = 'Đăng nhập'; });
  }
  function xoaPhien() {
    ['admin', 'nv', 'khachhang'].forEach(function (r) { LS.del('gia_' + r); LS.del('demo_gia_' + r); });
    LS.del('sess'); S.sess = null; S.ton = null; S.tonLoi = ''; S.items = []; S.byMa = {};
  }
  function dangXuat() {
    if (S.sess && !DEMO) api('logout').catch(function () { });
    xoaPhien(); LS.del('khach');
    history.replaceState(null, '', location.pathname + location.search);
    S.nhom = ''; S.hang = ''; S.sp = '';
    hienDangNhap();
  }
  function hetPhien() { xoaPhien(); toast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.'); hienDangNhap(); }

  function moMenu() {
    var m = $('acct-menu');
    if (!m.hidden) { m.hidden = true; return; }
    var s = S.sess;
    m.innerHTML = (s ? '<div class="who"><b>' + esc(s.name || s.username) + '</b>' + TEN_VT[s.role] + (s.tenCty ? ' · ' + esc(s.tenCty) : '') + '</div>' : '<div class="who"><b>Khách</b>Đang xem giá niêm yết</div>') +
      (s && s.role === 'admin' ? '<button type="button" data-act="quan-ly">👥 Quản lý tài khoản</button><button type="button" data-act="lam-moi-may-chu">🔄 Lấy dữ liệu mới từ Sheet</button>' : '') +
      '<button type="button" data-act="thu-lai">↻ Tải lại dữ liệu</button>' +
      (s ? '<button type="button" data-act="dang-xuat">🚪 Đăng xuất</button>' : '<button type="button" data-act="dang-nhap">🔑 Đăng nhập</button>');
    m.hidden = false;
  }

  // ---------- Bấm (một chỗ xử lý cho cả app) ----------
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act],[data-sp],[data-nhom],[data-nav],[data-hang],[data-hang-home],[data-loc],[data-anh],[data-user]');
    var menu = $('acct-menu');
    if (!menu.hidden && !e.target.closest('#acct-menu') && !(el && el.getAttribute('data-act') === 'menu')) menu.hidden = true;
    if (!el) { if (e.target.id === 'sheet-nen') dongSheet(); return; }
    var a = el.getAttribute('data-act');
    if (el.hasAttribute('data-sp')) { S.moTuApp = true; var h = docHash(); h.sp = el.getAttribute('data-sp'); ghiHash(h); return; }
    if (el.hasAttribute('data-nhom')) return diToi(el.getAttribute('data-nhom'), '');
    if (el.hasAttribute('data-nav')) { var k = el.getAttribute('data-nav'); return k ? diToi(k, '') : diToi('', ''); }
    if (el.hasAttribute('data-hang-home')) return diToi('all', el.getAttribute('data-hang-home'));
    if (el.hasAttribute('data-hang')) { S.hang = el.getAttribute('data-hang'); S.trang = 1; S.loc = {}; var hh = docHash(); hh.h = S.hang; ghiHash(hh, true); veTrang(); return; }
    if (el.hasAttribute('data-loc')) { S.loc[el.getAttribute('data-loc')] = el.getAttribute('data-v'); S.trang = 1; veTrang(); moLoc(); return; }
    if (el.hasAttribute('data-anh')) { var n = anhCua(S.sp).length; S.anhIdx = (S.anhIdx + Number(el.getAttribute('data-anh')) + n) % n; moChiTiet(true); return; }
    if (el.hasAttribute('data-user')) { formUser(dsUser[Number(el.getAttribute('data-user'))]); return; }
    switch (a) {
      case 'home': diToi('', ''); break;
      case 'menu': moMenu(); break;
      case 'dong': dongSheet(); break;
      case 'them': S.trang++; veKetQua(); break;
      case 'loc': moLoc(); break;
      case 'xoa-loc': S.loc = {}; veTrang(); moLoc(); break;
      case 'chep': chepThongTin(el.getAttribute('data-ma')); break;
      case 'thu-lai': menu.hidden = true; taiDuLieu(); break;
      case 'dang-nhap': menu.hidden = true; dongSheet(true); hienDangNhap(); break;
      case 'dang-xuat': menu.hidden = true; dangXuat(); break;
      case 'xem-khach': LS.set('khach', true); hienApp(); break;
      case 'quan-ly': menu.hidden = true; moQuanLy(); break;
      case 'user-moi': formUser(null); break;
      case 'user-ds': veQuanLy(); break;
      case 'lam-moi-may-chu':
        menu.hidden = true;
        api('clearCache').then(function (r) { if (!r || r.status !== 'ok') throw new Error(r && r.msg); toast('Đã xóa đệm máy chủ, đang tải lại…'); taiDuLieu(); })
          .catch(function (err) { toast('Không làm mới được: ' + loiDeHieu(err)); });
        break;
    }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'tk-home') { S.qHome = e.target.value; veKetQua(); }
    else if (e.target.id === 'tk-list') { S.q = e.target.value; S.trang = 1; veKetQua(); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'sort') { S.sort = e.target.value; S.trang = 1; veKetQua(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('sheet').hidden) dongSheet(); });
  window.addEventListener('popstate', theoHash);
  $('login-form').addEventListener('submit', dangNhap);

  // ---------- Thương hiệu từ config.js ----------
  function apThuongHieu() {
    var r = document.documentElement.style;
    if (CFG.MAU_CHINH) { r.setProperty('--c', CFG.MAU_CHINH); document.querySelector('meta[name=theme-color]').content = CFG.MAU_CHINH; }
    if (CFG.MAU_DAM) r.setProperty('--c2', CFG.MAU_DAM);
    var logo = CFG.LOGO ? '<img src="' + esc(CFG.LOGO) + '" alt="">' : esc(CFG.VIET_TAT || '');
    $('login-logo').innerHTML = logo; $('top-logo').innerHTML = logo;
    $('login-ten').textContent = CFG.TEN_APP || '';
    $('login-sub').textContent = CFG.KHAU_HIEU || '';
    $('top-ten').textContent = CFG.TEN_APP || '';
    document.title = (CFG.KHAU_HIEU ? 'Bảng giá ' : '') + (CFG.TEN_APP || '');
    $('login-foot').innerHTML = CFG.LIEN_HE_SDT
      ? 'Quên mật khẩu? <a href="https://zalo.me/' + esc(CFG.LIEN_HE_SDT) + '" target="_blank" rel="noopener">Liên hệ ' + esc(CFG.LIEN_HE_TEN || '') + ' · ' + esc(CFG.LIEN_HE_SDT) + '</a>'
      : (DEMO ? 'Dùng thử: tài khoản <b>admin</b>, <b>nv</b> hoặc <b>daily</b>, mật khẩu bất kỳ.' : '');
  }

  function batDau() {
    apThuongHieu();
    if (S.sess || LS.get('khach')) hienApp(); else hienDangNhap();
  }
  if (DEMO) {
    var sc = document.createElement('script');
    sc.src = 'demo-data.js?v=1'; sc.onload = batDau;
    sc.onerror = function () { document.body.innerHTML = '<p style="padding:20px">Chưa cấu hình APPS_URL trong config.js.</p>'; };
    document.head.appendChild(sc);
  } else batDau();
})();
