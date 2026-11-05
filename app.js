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
  var MOI_TRANG = 50;
  var TEN_VT = { admin: 'Quản trị', nv: 'Nhân viên', khachhang: 'Đại lý' };
  var TEN_TIER = { nhanh: 'Có hàng ngay', mai: 'Mai có hàng', cho: 'Chờ hàng' };
  var NGAN_TIER = { nhanh: 'Có ngay', mai: 'Mai có', cho: 'Chờ hàng' };
  var COT_LOC = [['kc', 'Kích cỡ'], ['loai', 'Loại'], ['mau', 'Màu'], ['congNang', 'Công năng'], ['tinhNang', 'Tính năng'],
    ['hoaVan', 'Hoa văn'], ['men', 'Men / bề mặt'], ['dungTich', 'Dung tích']];
  var COT_NHIEU_GIA_TRI = { mau: 1, congNang: 1, tinhNang: 1 }; // ô có thể ghi "Lát nền, Ốp tường"

  // ---------- Biểu tượng nét mảnh (SVG trong code, không tải thư viện ngoài) ----------
  var IC = {
    home: '<path d="M5 12H3l9-9 9 9h-2"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/><path d="M10 21v-6h4v6"/>',
    search: '<circle cx="10" cy="10" r="7"/><path d="M21 21l-6-6"/>',
    user: '<circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>',
    gach: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    ngoi: '<path d="M3 12l9-8 9 8"/><path d="M5 10.5V20h14v-9.5"/><path d="M5 15c2.3-1.5 4.7-1.5 7 0s4.7 1.5 7 0"/>',
    tbvs: '<path d="M4 12h16a1 1 0 0 1 1 1v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2a1 1 0 0 1 1-1z"/><path d="M6 12V5a2 2 0 0 1 2-2h3v2"/><path d="M5 20l-1 1.5M19 20l1 1.5"/>',
    son: '<rect x="4" y="3" width="13" height="6" rx="2"/><path d="M17 6h2a1 1 0 0 1 1 1v2a3 3 0 0 1-3 3h-5v2"/><rect x="10" y="14" width="4" height="7" rx="1"/>',
    bep: '<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 10h20"/><path d="M9 6.5C9 5 10.3 4 12 4s3 1 3 2.5"/>',
    keo: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    khac: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    all: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    back: '<path d="M5 12h14M5 12l6 6M5 12l6-6"/>',
    loc: '<path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h11M19 18h1"/><circle cx="14" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M5 6v.01M5 12v.01M5 18v.01"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    chat: '<path d="M3 20l1.3-3.9A8.5 7.5 0 1 1 7.7 19L3 20"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    login: '<path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2"/><path d="M20 12H9m3-3l-3 3 3 3"/>',
    logout: '<path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2"/><path d="M9 12h12l-3-3m0 6l3-3"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/>',
    users: '<circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.1a4 4 0 0 1 0 7.8M21 21v-2a4 4 0 0 0-3-3.9"/>',
    refresh: '<path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/>',
    tag: '<path d="M7.5 7.5h.01"/><path d="M3 6v5.2a2 2 0 0 0 .6 1.4l8.8 8.8a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8L11.6 4.6A2 2 0 0 0 10.2 4H5a2 2 0 0 0-2 2z"/>',
    chevL: '<path d="M15 6l-6 6 6 6"/>',
    chevR: '<path d="M9 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pin: '<circle cx="12" cy="11" r="3"/><path d="M17.7 16.7L13.4 21a2 2 0 0 1-2.8 0l-4.3-4.3a8 8 0 1 1 11.4 0z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    box: '<path d="M3 9l9-5 9 5v8l-9 5-9-5z"/><path d="M3 9l9 5 9-5M12 14v8"/>',
    link: '<path d="M9 15l6-6"/><path d="M11 6l.5-.5a5 5 0 0 1 7 7l-.5.5M13 18l-.4.5a5 5 0 0 1-7-7l.4-.5"/>'
  };
  function ic(n, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || IC.khac) + '</svg>';
  }

  // ---------- Bộ nhớ trên máy (tiền tố hn_ để không lẫn app khác) ----------
  var LS = {
    get: function (k) { try { return JSON.parse(localStorage.getItem('hn_' + k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('hn_' + k, JSON.stringify(v)); } catch (e) { } },
    del: function (k) { try { localStorage.removeItem('hn_' + k); } catch (e) { } }
  };

  var S = {
    // Phiên của chế độ dùng thử không dùng được với máy chủ thật (và ngược lại).
    sess: (function (s) { return s && (s.token === 'demo') === DEMO ? s : null; })(LS.get('sess')),
    items: [], byMa: {}, anh: {}, capNhat: '', ton: null, tonLoi: '', tonDangTai: false,
    dangTai: false, loi: '', nhom: '', hang: '', q: '', qHome: '', loc: {}, sort: '', trang: 1,
    sp: '', anhIdx: 0, moTuApp: false, kieu: LS.get('kieu') === 'luoi' ? 'luoi' : 'dong'
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
  function ngay(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
  }
  function laKhach() { return !S.sess || S.sess.role === 'khachhang'; }
  function laNoiBo() { return !!S.sess && S.sess.role !== 'khachhang'; }
  function sdt() { return String(CFG.LIEN_HE_SDT || '').replace(/[^\d+]/g, ''); }
  // 0939182288 -> "093 918 22 88" (cách ghi trên trang Facebook công ty)
  function sdtDep() { var s = sdt(); return s.length === 10 ? s.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4') : s; }
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
  var NHOM_KHAC = { key: 'khac', ten: 'Hàng khác', ngan: 'Khác', icon: 'khac', alias: [] };
  var NHOM_ALL = { key: 'all', ten: 'Tất cả sản phẩm', ngan: 'Tất cả', icon: 'all' };
  var mapNhom = {};
  NHOM.forEach(function (g) { [g.key, g.ten, g.ngan].concat(g.alias || []).forEach(function (a) { mapNhom[norm(a)] = g.key; }); });
  function nhomCua(ten) {
    var k = norm(ten);
    if (!k) return 'khac';
    if (mapNhom[k]) return mapNhom[k];
    for (var i = 0; i < NHOM.length; i++) if (k.indexOf(norm(NHOM[i].ngan || NHOM[i].ten)) === 0) return NHOM[i].key;
    return 'khac';
  }
  function dsNhom() { return S.items.some(function (p) { return p._nhom === 'khac'; }) ? NHOM.concat([NHOM_KHAC]) : NHOM; }
  function nhomTheoKey(k) { return dsNhom().filter(function (g) { return g.key === k; })[0] || NHOM_ALL; }

  // ---------- Dữ liệu ----------
  // Tên vật tư từ phần mềm kho có ký hiệu phụ: "(8v/th)" (đã hiện ở Đóng gói), "@", "**", "#1".
  function tenGon(t) {
    return String(t || '').replace(/\(\s*\d+\s*v\s*\/\s*th\s*\)/gi, '').replace(/#\d+\s*$/, '')
      .replace(/[@*]+/g, '').replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trim();
  }
  function khoaDem() { return (DEMO ? 'demo_' : '') + 'gia_' + (S.sess ? S.sess.role : 'khach'); }
  function nhanGia(res) {
    S.th = {};
    Object.keys(res.thuongHieu || {}).forEach(function (h) { S.th[norm(h)] = res.thuongHieu[h]; });
    S.items = (res.data || []).map(function (p) {
      p._nhom = nhomCua(p.nhom);
      p._ten = tenGon(p.ten) || p.ma;
      var goc = String(p.tenGoc || p.ten || ''); // tên vật tư gốc (khi Sheet có cột "Tên hiển thị")
      p._cap = (goc.match(/lo[aạ]i\s*(\d)/i) || [])[1] || ''; // cấp gạch: Loại 1 / 2 / 3
      // Số viên/thùng bỏ khỏi tên nhưng vẫn hiện ở dòng nhỏ – có mã chỉ khác nhau ở điểm này.
      p._vt = (goc.match(/\(\s*(\d+)\s*v\s*\/\s*th/i) || [])[1] || '';
      p._tk = norm([p.ma, p.ten, p.tenGoc, p.hang, p.hang ? tenHang(p.hang) : '', p.kc, p.loai, p.mau, p.nhom].join(' '));
      return p;
    });
    S.byMa = {};
    S.items.forEach(function (p) { S.byMa[p.ma] = p; });
    S.anh = res.anh || {};
    S.capNhat = res.capNhat || res.luc || '';
  }
  function taiDuLieu() {
    var c = LS.get(khoaDem());
    if (c && c.data) { nhanGia(c); veLai(); }
    S.dangTai = true; S.loi = ''; capNhatTrangThai();
    api('getAll').then(function (res) {
      if (!res || res.status !== 'ok') throw new Error((res && res.msg) || 'máy chủ báo lỗi');
      if (S.sess && res.daDangNhap === false) { hetPhien(); return; }
      LS.set(khoaDem(), { data: res.data, anh: res.anh, thuongHieu: res.thuongHieu, luc: res.luc, capNhat: res.capNhat });
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
      S.ton = res.data || {}; S.tonLuc = res.luc || '';
    }).catch(function (e) {
      // Bài học Đồng Tâm: báo lỗi rõ, không treo "đang tải tồn kho".
      S.tonLoi = 'Không tải được tồn kho: ' + loiDeHieu(e);
    }).then(function () { S.tonDangTai = false; capNhatTrangThai(); veLai(); });
  }
  function capNhatTrangThai() {
    var d = $('sync');
    if (d) d.className = 'sync' + ((S.dangTai || S.tonDangTai) ? ' dang' : (S.loi || S.tonLoi ? ' loi' : ''));
    var loi = S.loi || S.tonLoi, b = $('loi-bar');
    b.hidden = !loi;
    if (loi) b.innerHTML = '<span>' + esc(loi) + '</span><button type="button" data-act="thu-lai">Thử lại</button>';
  }

  // ---------- Xem gần đây ----------
  function ganDay() { return (LS.get('ganday') || []).filter(function (m) { return S.byMa[m]; }); }
  function ghiGanDay(ma) {
    var ds = (LS.get('ganday') || []).filter(function (m) { return m !== ma; });
    ds.unshift(ma);
    LS.set('ganday', ds.slice(0, 20));
  }

  // ---------- Giá / tồn kho hiển thị ----------
  // d: thông tin tồn của mã (dvt, vt = viên/thùng, m2 = m²/thùng). Gạch: 102.8 thùng loại 5 viên = "102 thùng 4 viên".
  function soTon(n, d, kemM2) {
    var dvt = d.dvt || '';
    if (laKhach() && n > NGUONG) return NGUONG + '+' + (dvt ? ' ' + dvt : '');
    var s;
    if (d.vt) {
      var th = Math.floor(n + 1e-9), le = Math.round((n - th) * d.vt);
      if (le >= d.vt) { th++; le = 0; }
      s = [th ? th + ' thùng' : '', le ? le + ' viên' : ''].filter(String).join(' ') || '0 thùng';
    } else s = so(n) + (dvt ? ' ' + dvt : '');
    if (kemM2 && d.m2 && !(laKhach() && n > NGUONG)) s += ' ≈ ' + so(Math.round(n * d.m2 * 10) / 10) + ' m²';
    return s;
  }
  function tierChinh(d) { return d.tier.nhanh > 0 ? 'nhanh' : (d.tier.mai > 0 ? 'mai' : 'cho'); }
  function nhanTon(p) {
    if (!S.sess || !S.ton) return '';
    var d = S.ton[p.ma];
    if (!d || d.tong <= 0) return '<span class="ton het">' + (laNoiBo() ? 'Hết hàng' : 'Liên hệ') + '</span>';
    var t = tierChinh(d);
    return '<span class="ton ' + t + '">' + (t === 'nhanh' ? soTon(d.tier.nhanh, d) : NGAN_TIER[t]) + '</span>';
  }
  // Sắp xếp "tồn nhiều": ưu tiên hàng có ngay, rồi mai có, rồi chờ hàng.
  function tongTon(p) { var d = S.ton && S.ton[p.ma]; return d ? d.tier.nhanh * 1e8 + d.tier.mai * 1e4 + d.tier.cho : 0; }
  // Đã đăng nhập: giá đại lý là giá chính, giá niêm yết gạch ngang bên cạnh.
  function htmlGia(p, to) {
    var dv = p.dvt ? '<span class="dvt">/' + esc(p.dvt) + '</span>' : '';
    if (S.sess && p.dl > 0) {
      return '<span class="gia' + (to ? ' gia-to' : '') + '"><span class="nhan-dl">ĐL</span>' + tien(p.dl) + '</span>' + dv +
        (p.ny > 0 ? '<s class="ny">' + tien(p.ny) + '</s>' : '');
    }
    if (!(p.ny > 0)) return '<span class="gia-lh">Liên hệ báo giá</span>';
    return '<span class="gia' + (to ? ' gia-to' : '') + '">' + tien(p.ny) + '</span>' + dv;
  }

  // ---------- Ảnh ----------
  function anhCua(ma) { return S.anh[ma] || []; }
  // Ảnh Drive: danh sách lấy bản nhỏ (nhanh, đỡ tốn 3G), chi tiết lấy bản lớn cho nét.
  function coAnh(u, rong) { return /drive\.google\.com\/thumbnail/.test(u) ? u.replace(/([?&])sz=w\d+/, '$1sz=w' + rong) : u; }
  function iconNhom(p) { return nhomTheoKey(p._nhom).icon || 'khac'; }
  function oAnh(p, cls, idx, kemHang) {
    var a = anhCua(p.ma)[idx || 0];
    return '<div class="anh-o ' + (cls || '') + '">' +
      (a ? '<img class="anh" loading="lazy" alt="" src="' + esc(coAnh(a, 320)) + '" data-icon="' + iconNhom(p) + '">' : ic(iconNhom(p))) +
      (kemHang && p.hang ? '<span class="tag-hang">' + esc(tenHang(p.hang)) + '</span>' : '') + '</div>';
  }
  // Ảnh lỗi (Drive chưa chia sẻ công khai, link sai) -> hiện biểu tượng thay vì khung trắng.
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (img && img.classList && img.classList.contains('anh')) img.outerHTML = ic(img.getAttribute('data-icon') || 'khac');
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
    var tu = String(q || '').trim().split(/\s+/).map(norm).filter(String);
    if (!tu.length) return ds;
    return ds.filter(function (p) { return tu.every(function (w) { return p._tk.indexOf(w) >= 0; }); });
  }
  function giaSapXep(p) { return (S.sess && p.dl > 0) ? p.dl : p.ny; }
  function conHang(p) { var d = S.ton && S.ton[p.ma]; return !!d && d.tong > 0; }
  function dsHienThi() {
    var ds = timKiem(dsCoSo(), S.q);
    if (S.chiConHang && S.sess && S.ton) ds = ds.filter(conHang);
    Object.keys(S.loc).forEach(function (k) {
      var v = S.loc[k];
      if (v) ds = ds.filter(function (p) { return giaTriCot(p, k).indexOf(v) >= 0; });
    });
    if (S.sort === 'gia-tang') ds = ds.slice().sort(function (a, b) { return (giaSapXep(a) || 9e15) - (giaSapXep(b) || 9e15); });
    else if (S.sort === 'gia-giam') ds = ds.slice().sort(function (a, b) { return (giaSapXep(b) || 0) - (giaSapXep(a) || 0); });
    else if (S.sort === 'ton') ds = ds.slice().sort(function (a, b) { return tongTon(b) - tongTon(a); });
    return ds;
  }
  function soLocDangBat() { return Object.keys(S.loc).filter(function (k) { return S.loc[k]; }).length; }

  // ---------- Dòng / thẻ sản phẩm ----------
  // Tên vật tư là tiêu đề lớn; mã SP + hãng nhỏ ở dưới.
  // Logo / tên đầy đủ: tab "Thương hiệu" trên Sheet (S.th) ưu tiên hơn danh sách có sẵn trong config.js.
  var LOGO_HANG = {};
  Object.keys(CFG.LOGO_HANG || {}).forEach(function (h) { LOGO_HANG[norm(h)] = CFG.LOGO_HANG[h]; });
  function thongTinHang(h) { return (S.th && S.th[norm(h)]) || {}; }
  function tenHang(h) { return thongTinHang(h).ten || h; }
  function logoHang(h) { return thongTinHang(h).logo || LOGO_HANG[norm(h)] || LOGO_HANG[norm(tenHang(h))] || ''; }
  function nhanCap(p) { return p._cap ? '<span class="cap cap-' + p._cap + '">Loại ' + p._cap + '</span>' : ''; }
  function dongPhu(p) {
    return '<div class="row-sub"><span class="ma">' + esc(p.ma) + '</span>' + (p.hang ? ' · ' + esc(tenHang(p.hang)) : '') + (p._vt ? ' · ' + p._vt + ' viên/thùng' : '') + '</div>';
  }
  function dong(p) {
    return '<button type="button" class="row" data-sp="' + esc(p.ma) + '">' + oAnh(p) +
      '<div class="row-info"><div class="row-ten">' + esc(p._ten) + '</div>' + dongPhu(p) +
      '<div class="row-gia">' + htmlGia(p) + '</div></div>' +
      '<div class="row-ton">' + nhanCap(p) + nhanTon(p) + '</div></button>';
  }
  function the(p) {
    return '<button type="button" class="card" data-sp="' + esc(p.ma) + '">' + oAnh(p, '', 0, true) +
      '<div class="card-body"><div class="row-ten">' + esc(p._ten) + '</div>' + dongPhu(p) +
      '<div class="gia-o">' + htmlGia(p) + '</div><div class="card-ton">' + nhanCap(p) + nhanTon(p) + '</div></div></button>';
  }
  function danhSachHtml(ds, gioiHan, kieu) {
    if (!ds.length) return '<div class="trong">' + ic('search') + '<b>Không tìm thấy sản phẩm</b>Thử từ khóa khác hoặc bỏ bớt bộ lọc.</div>';
    var phan = ds.slice(0, gioiHan);
    var html = kieu === 'luoi' ? '<div class="grid">' + phan.map(the).join('') + '</div>' : '<div class="rows">' + phan.map(dong).join('') + '</div>';
    if (ds.length > gioiHan) html += '<button type="button" class="btn btn-vien them" data-act="them">Xem thêm ' + (ds.length - gioiHan) + ' mã</button>';
    return html;
  }
  function khungTai() { return '<div class="dang-tai">' + '<div class="sk"></div>'.repeat(5) + '</div>'; }
  function goiYDangNhap() {
    return S.sess ? '' : '<button type="button" class="goi-y" data-act="dang-nhap">' + ic('lock') + '<span>Đại lý đăng nhập để xem giá đại lý và tồn kho</span></button>';
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
    var nhomMoi = h.v === 'ganday' ? 'ganday' : (h.n || ''), hangMoi = h.h || '';
    if (nhomMoi !== S.nhom || hangMoi !== S.hang) {
      S.nhom = nhomMoi; S.hang = hangMoi; S.loc = {}; S.q = ''; S.trang = 1; S.sort = '';
      if (!$('app').hidden) { veTrang(); window.scrollTo(0, 0); }
    }
    S.sp = h.sp || '';
    capNhatNav();
    if (S.sp) moChiTiet(); else if ($('sheet').getAttribute('data-loai') === 'sp') dongSheet(true);
  }
  function diToi(nhom, hang) { ghiHash(nhom === 'ganday' ? { v: 'ganday' } : { n: nhom, h: hang }); }

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
    veTopbar();
    if (S.nhom === 'ganday') veGanDay();
    else if (S.nhom) veDanhSach();
    else veTrangChu();
    capNhatTrangThai();
  }
  function veKetQua() {
    if (S.nhom && S.nhom !== 'ganday') { var k = $('list-kq'); if (k) k.innerHTML = htmlKetQuaDS(); }
    else if (!S.nhom) { var h = $('home-kq'); if (h) h.innerHTML = htmlKetQuaHome(); }
  }

  // Trang chủ: nút có chữ. Trang danh sách: chỉ biểu tượng, nhường chỗ cho tên ngành hàng.
  function nutTaiKhoan(gon) {
    if (S.sess) return gon
      ? '<button type="button" class="tb-icon" data-act="menu" aria-label="Tài khoản">' + ic('user') + '</button>'
      : '<button type="button" class="tb-btn" data-act="menu" aria-label="Tài khoản">' + ic('user', 'ic-sm') + '<span>' + esc((S.sess.name || S.sess.username).split(' ').slice(-1)[0]) + '</span></button>';
    return gon
      ? '<button type="button" class="tb-icon" data-act="dang-nhap" aria-label="Đăng nhập">' + ic('login') + '</button>'
      : '<button type="button" class="tb-btn" data-act="dang-nhap">' + ic('login', 'ic-sm') + '<span>Đăng nhập</span></button>';
  }
  function veTopbar() {
    var html;
    if (!S.nhom) {
      html = '<div class="tb-row"><button type="button" class="brand" data-act="home"><span class="logo">' + logoHtml() + '</span>' +
        '<span class="brand-text"><b>' + esc(CFG.TEN_APP || '') + '</b><small>' + esc(S.sess ? TEN_VT[S.sess.role] + ' · ' + (S.sess.tenCty || S.sess.name || '') : (CFG.KHAU_HIEU || '')) + '</small></span></button>' +
        '<span class="sync" id="sync"></span>' + nutTaiKhoan() + '</div>' +
        '<label class="tb-search">' + ic('search', 'ic-sm') + '<input id="tk-home" type="search" placeholder="Tìm mã, tên, hãng, kích cỡ…" value="' + esc(S.qHome) + '"></label>';
    } else {
      var g = S.nhom === 'ganday' ? { ten: 'Xem gần đây' } : nhomTheoKey(S.nhom);
      html = '<div class="tb-row"><button type="button" class="tb-icon" data-act="home" aria-label="Về trang chủ">' + ic('back') + '</button>' +
        '<div class="tb-title">' + esc(S.hang && S.nhom === 'all' ? tenHang(S.hang) : g.ten) + '</div><span class="sync" id="sync"></span>' +
        (S.nhom !== 'ganday' ? '<button type="button" class="tb-icon" data-act="doi-kieu" aria-label="Đổi kiểu xem">' + ic(S.kieu === 'luoi' ? 'list' : 'grid') + '</button>' : '') +
        nutTaiKhoan(true) + '</div>' +
        (S.nhom !== 'ganday' ? '<label class="tb-search">' + ic('search', 'ic-sm') + '<input id="tk-list" type="search" placeholder="Tìm trong ' + esc(g.ten.toLowerCase()) + '…" value="' + esc(S.q) + '"></label>' : '');
    }
    $('topbar').innerHTML = html;
    document.documentElement.style.setProperty('--top-h', $('topbar').offsetHeight + 'px');
  }

  function veTrangChu() {
    $('main').innerHTML = '<div id="home-kq">' + htmlKetQuaHome() + '</div>';
  }
  function htmlKetQuaHome() {
    if (S.qHome.trim()) {
      var ds = timKiem(S.items, S.qHome);
      return '<div class="list-tools"><span>' + ds.length + ' kết quả cho “' + esc(S.qHome.trim()) + '”</span></div>' + danhSachHtml(ds, 60, 'dong');
    }
    var dem = {}, hang = {};
    S.items.forEach(function (p) { dem[p._nhom] = (dem[p._nhom] || 0) + 1; if (p.hang) hang[p.hang] = (hang[p.hang] || 0) + 1; });
    var html = '';
    if (S.items.length) {
      html += '<button type="button" class="banner" data-nhom="all" style="width:100%;text-align:left">' + ic('tag') + '<span><b>Bảng giá ' + esc(CFG.TEN_APP || '') + '</b><small>' +
        (S.capNhat ? 'Cập nhật ' + ngay(S.capNhat) + ' · ' : '') + S.items.length.toLocaleString('vi-VN') + ' mã · ' + Object.keys(hang).length + ' thương hiệu</small></span></button>';
    } else if (S.dangTai) html += khungTai();
    else html += '<div class="trong">' + ic('tag') + '<b>Chưa có bảng giá</b>Dữ liệu sẽ hiện khi công ty cập nhật bảng giá.</div>';
    html += theLienHe();

    html += '<div class="h2">Ngành hàng</div><div class="dm-grid">' + dsNhom().map(function (g) {
      return '<button type="button" class="dm-card" data-nhom="' + g.key + '"><span class="ic-wrap">' + ic(g.icon) + '</span><b>' + esc(g.ten) + '</b><small>' + (dem[g.key] || 0) + ' mã</small></button>';
    }).join('') + '</div>';

    // Hãng có logo: ô logo lớn; hãng chưa có logo: giữ dạng chữ.
    var dsHang = Object.keys(hang).sort(function (a, b) { return hang[b] - hang[a]; });
    var coLogo = dsHang.filter(logoHang), chuaLogo = dsHang.filter(function (h) { return !logoHang(h); });
    if (dsHang.length) html += '<div class="h2">Thương hiệu</div>' +
      (coLogo.length ? '<div class="hang-grid">' + coLogo.map(function (h) {
        return '<button type="button" class="hang-o" data-hang-home="' + esc(h) + '"><img src="' + esc(logoHang(h)) + '" alt="' + esc(tenHang(h)) + '" loading="lazy"><small>' + esc(tenHang(h)) + ' · ' + hang[h] + ' mã</small></button>';
      }).join('') + '</div>' : '') +
      (chuaLogo.length ? '<div class="chips wrap"' + (coLogo.length ? ' style="margin-top:10px"' : '') + '>' + chuaLogo.map(function (h) {
        return '<button type="button" class="chip" data-hang-home="' + esc(h) + '">' + esc(tenHang(h)) + ' <small>' + hang[h] + '</small></button>';
      }).join('') + '</div>' : '');

    var gd = ganDay();
    if (gd.length) html += '<div class="h2">Xem gần đây <button type="button" data-nav="ganday">Tất cả</button></div><div class="gan-day">' + gd.slice(0, 10).map(function (m) {
      var p = S.byMa[m];
      return '<button type="button" class="mini" data-sp="' + esc(m) + '">' + oAnh(p) + '<div class="tx"><b>' + esc(p._ten) + '</b><small>' + esc(p.ma) + '</small><span class="gia">' + tien(S.sess && p.dl > 0 ? p.dl : p.ny) + '</span></div></button>';
    }).join('') + '</div>';

    return html + thongTinCongTy();
  }
  // Thẻ "Tư vấn & đặt hàng" ngay dưới banner – đại lý thấy liền, khỏi cuộn xuống cuối.
  function theLienHe() {
    if (!sdt()) return '';
    return '<div class="lh-card"><div class="lh-info"><b>Tư vấn & đặt hàng</b><small>' + esc(CFG.LIEN_HE_TEN || '') + ' · ' + sdtDep() + '</small></div>' +
      '<a class="lh-btn lh-zalo" href="https://zalo.me/' + sdt() + '" target="_blank" rel="noopener">' + ic('chat', 'ic-sm') + 'Zalo</a>' +
      '<a class="lh-btn lh-goi" href="tel:' + sdt() + '">' + ic('phone', 'ic-sm') + 'Gọi</a></div>';
  }
  function thongTinCongTy() {
    var d = [];
    if (CFG.DIA_CHI) d.push('<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((CFG.TEN_DAY_DU || '') + ' ' + CFG.DIA_CHI) + '" target="_blank" rel="noopener">' + ic('pin', 'ic-sm') + esc(CFG.DIA_CHI) + '</a>');
    if (sdt()) d.push('<a href="tel:' + sdt() + '">' + ic('phone', 'ic-sm') + sdtDep() + '</a>');
    if (CFG.EMAIL) d.push('<a href="mailto:' + esc(CFG.EMAIL) + '">' + ic('mail', 'ic-sm') + esc(CFG.EMAIL) + '</a>');
    if (CFG.FACEBOOK) d.push('<a href="' + esc(CFG.FACEBOOK) + '" target="_blank" rel="noopener">' + ic('link', 'ic-sm') + 'Trang Facebook</a>');
    if (CFG.WEBSITE) d.push('<a href="https://' + esc(CFG.WEBSITE) + '" target="_blank" rel="noopener">' + ic('link', 'ic-sm') + esc(CFG.WEBSITE) + '</a>');
    return '<footer class="cty"><div class="cty-head"><span class="logo">' + logoHtml() + '</span><div><b>' + esc(CFG.TEN_DAY_DU || CFG.TEN_APP || '') + '</b>' +
      (CFG.NGANH_HANG ? '<small>' + esc(CFG.NGANH_HANG) + '</small>' : '') + '</div></div>' + d.join('') + '</footer>';
  }

  function veDanhSach() {
    var coSo = S.items.filter(function (p) { return S.nhom === 'all' || p._nhom === S.nhom; });
    var hang = {};
    coSo.forEach(function (p) { if (p.hang) hang[p.hang] = (hang[p.hang] || 0) + 1; });
    var dsHang = Object.keys(hang).sort(function (a, b) { return hang[b] - hang[a]; });
    var nl = soLocDangBat();
    var chips = '<button type="button" class="chip' + (nl ? ' loc-on' : '') + '" data-act="loc">' + ic('loc', 'ic-sm') + 'Lọc' + (nl ? ' (' + nl + ')' : '') + '</button>';
    // Đã đăng nhập: lọc nhanh "Còn hàng" (bỏ mã tồn ≤ 0).
    if (S.sess && S.ton) chips += '<button type="button" class="chip chip-ton' + (S.chiConHang ? ' on' : '') + '" data-act="con-hang"><span class="cham"></span>Còn hàng</button>';
    if (dsHang.length > 1) chips += '<button type="button" class="chip' + (S.hang ? '' : ' on') + '" data-hang="">Tất cả hãng</button>' +
      dsHang.map(function (h) {
        var l = logoHang(h);
        return '<button type="button" class="chip' + (l ? ' chip-logo' : '') + (S.hang === h ? ' on' : '') + '" data-hang="' + esc(h) + '">' +
          (l ? '<img src="' + esc(l) + '" alt="' + esc(h) + '">' : esc(tenHang(h))) + ' <small>' + hang[h] + '</small></button>';
      }).join('');
    $('main').innerHTML = '<div class="loc-bar"><div class="chips">' + chips + '</div></div>' + goiYDangNhap() + '<div id="list-kq">' + htmlKetQuaDS() + '</div>';
  }
  function htmlKetQuaDS() {
    if (!S.items.length) return S.dangTai ? khungTai() : '<div class="trong">' + ic('tag') + '<b>Chưa có bảng giá</b></div>';
    var ds = dsHienThi(), sx = dsSapXep().filter(function (o) { return o[0] === S.sort; })[0] || ['', 'Mặc định'];
    return '<div class="list-tools"><span>' + ds.length.toLocaleString('vi-VN') + ' sản phẩm</span>' +
      '<button type="button" class="sx" data-act="loc">Sắp xếp: <b>' + sx[1] + '</b></button></div>' +
      danhSachHtml(ds, S.trang * MOI_TRANG, S.kieu);
  }
  function dsSapXep() {
    return [['', 'Mặc định'], ['gia-tang', 'Giá thấp → cao'], ['gia-giam', 'Giá cao → thấp']].concat(S.sess && S.ton ? [['ton', 'Có hàng nhiều nhất']] : []);
  }
  function veGanDay() {
    var ds = ganDay().map(function (m) { return S.byMa[m]; });
    $('main').innerHTML = ds.length ? danhSachHtml(ds, 50, 'dong') : (S.dangTai ? khungTai() : '<div class="trong">' + ic('clock') + '<b>Chưa xem sản phẩm nào</b>Các mã anh/chị mở xem sẽ hiện ở đây.</div>');
  }

  function capNhatNav() {
    var tabs = [['', 'Trang chủ', 'home'], ['all', 'Sản phẩm', 'grid'], ['ganday', 'Gần đây', 'clock']];
    var html = tabs.map(function (t) {
      var on = S.nhom === t[0] || (t[0] === 'all' && S.nhom && S.nhom !== 'ganday');
      return '<button type="button" class="bn' + (on ? ' on' : '') + '" data-nav="' + t[0] + '">' + ic(t[2]) + '<span>' + t[1] + '</span></button>';
    }).join('');
    if (sdt()) html += '<a class="bn" href="https://zalo.me/' + sdt() + '" target="_blank" rel="noopener">' + ic('chat') + '<span>Zalo</span></a>' +
      '<a class="bn bn-goi" href="tel:' + sdt() + '">' + ic('phone') + '<span>Gọi</span></a>';
    $('bottom-nav').innerHTML = html;
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
  function dauSheet(tieuDe) {
    return '<div class="sh-head"><h3>' + tieuDe + '</h3><button type="button" class="sh-x" data-act="dong" aria-label="Đóng">' + ic('x') + '</button></div>';
  }

  // ---------- Chi tiết sản phẩm ----------
  function moChiTiet(giuAnh) {
    var p = S.byMa[S.sp];
    if (!p) {
      if (!S.items.length) return; // chờ tải xong sẽ mở
      toast('Không tìm thấy mã ' + S.sp); S.sp = ''; var h = docHash(); delete h.sp; ghiHash(h, true); return;
    }
    if (!giuAnh) { S.anhIdx = 0; ghiGanDay(p.ma); }
    var anh = anhCua(p.ma), g = nhomTheoKey(p._nhom);
    var html = dauSheet(esc(g.ten)) + '<div class="sh-body">';
    html += '<div class="anh-o anh-lon' + (anh.length ? '' : ' chua-anh') + '">' + (anh.length ? '<img class="anh" alt="" src="' + esc(coAnh(anh[S.anhIdx] || anh[0], 1200)) + '" data-icon="' + iconNhom(p) + '">' : ic(iconNhom(p))) +
      (anh.length > 1 ? '<button type="button" class="anh-nav trai" data-anh="-1" aria-label="Ảnh trước">' + ic('chevL') + '</button><button type="button" class="anh-nav phai" data-anh="1" aria-label="Ảnh sau">' + ic('chevR') + '</button><span class="anh-so">' + (S.anhIdx + 1) + '/' + anh.length + '</span>' : '') + '</div>';
    html += '<h2 class="ct-ten">' + esc(p._ten) + '</h2>' +
      '<button type="button" class="ct-ma" data-act="chep-ma" data-ma="' + esc(p.ma) + '" title="Chép mã">Mã SP: <b>' + esc(p.ma) + '</b>' + ic('copy', 'ic-sm') + '</button>' +
      '<div class="ct-tags">' + (p.hang ? (logoHang(p.hang) ? '<span class="tag hang-logo"><img src="' + esc(logoHang(p.hang)) + '" alt="' + esc(p.hang) + '"></span>' : '<span class="tag hang">' + esc(tenHang(p.hang)) + '</span>') : '') + nhanCap(p) + '<span class="tag">' + esc(g.ten) + '</span>' +
      [p.kc, p.loai].filter(String).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>';

    // Giá
    var dv = p.dvt ? '<span class="dvt"> /' + esc(p.dvt) + '</span>' : '';
    html += '<div class="sec">Giá</div><div class="box">';
    if (S.sess) {
      html += '<div class="gia-chinh"><span>Giá đại lý</span><span>' + (p.dl > 0 ? '<span class="gia">' + tien(p.dl) + '</span>' + dv : '<span class="mo">Chưa có</span>') + '</span></div>' +
        '<div class="gia-phu"><span>Giá niêm yết</span><span>' + tien(p.ny) + (p.ny > 0 && p.dvt ? ' /' + esc(p.dvt) : '') + '</span></div>';
    } else {
      html += '<div class="gia-chinh"><span>Giá niêm yết</span><span>' + (p.ny > 0 ? '<span class="gia">' + tien(p.ny) + '</span>' + dv : '<span class="gia-lh">Liên hệ báo giá</span>') + '</span></div>' +
        '<div style="margin-top:10px"><button type="button" class="lock" data-act="dang-nhap">' + ic('lock', 'ic-sm') + 'Đăng nhập để xem giá đại lý</button></div>';
    }
    html += '</div>';

    html += '<div class="sec">Tồn kho</div><div class="box">' + htmlTonKho(p) + '</div>';

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
    if (tt.length) html += '<div class="sec">Thông tin</div><div class="box"><table class="tt">' + tt.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</table></div>';
    html += '</div>';

    // Thanh hành động: hỏi Zalo (chép sẵn thông tin mã), gọi đặt hàng, sao chép.
    html += '<div class="sh-foot">' + (sdt()
      ? '<button type="button" class="btn btn-chinh" data-act="zalo" data-ma="' + esc(p.ma) + '">' + ic('chat') + 'Hỏi Zalo</button><a class="btn btn-do" href="tel:' + sdt() + '">' + ic('phone') + 'Gọi đặt</a>'
      : '') + '<button type="button" class="btn btn-vien btn-vuong" data-act="chep" data-ma="' + esc(p.ma) + '" aria-label="Sao chép báo giá">' + ic('copy') + '</button></div>';

    var cuon = giuAnh ? $('sheet').scrollTop : 0;
    moSheet(html, 'sp');
    $('sheet').scrollTop = cuon;
    var inp = $('qd-m2');
    if (inp) inp.addEventListener('input', function () {
      var m = parseFloat(String(inp.value).replace(',', '.')) || 0, thung = Math.ceil(m / qd.m2 - 1e-9);
      $('qd-kq').innerHTML = m > 0 ? ('Cần <b>' + thung + ' thùng</b> = ' + so(thung * qd.m2) + ' m²' + (qd.vien ? ' (' + thung * qd.vien + ' viên)' : '') + duKho(p, thung)) : so(qd.m2) + ' m²/thùng';
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
  // So số thùng khách cần với hàng có sẵn (đại lý chỉ biết tới 50+ nên báo "liên hệ" khi cần nhiều hơn).
  function duKho(p, thung) {
    var d = S.sess && S.ton && S.ton[p.ma];
    if (!d) return '';
    var co = d.tier.nhanh || 0;
    if (laKhach() && co > NGUONG && thung > NGUONG) return '<div class="du-kho mai">Cần nhiều hơn ' + NGUONG + ' thùng – liên hệ để kiểm tra tồn kho</div>';
    if (co >= thung) return '<div class="du-kho nhanh">✓ Kho có sẵn đủ</div>';
    if (d.tong >= thung) return '<div class="du-kho mai">Có sẵn ' + soTon(co, d) + ', phần còn lại phải chờ chuyển kho</div>';
    return '<div class="du-kho cho">Kho chỉ còn ' + soTon(d.tong, d) + ' – thiếu, cần đặt thêm</div>';
  }
  function htmlTonKho(p) {
    if (!S.sess) return '<button type="button" class="lock" data-act="dang-nhap">' + ic('lock', 'ic-sm') + 'Đăng nhập để xem tồn kho</button>';
    if (S.tonLoi && !S.ton) return '<div class="mo">' + esc(S.tonLoi) + '</div><button type="button" class="btn btn-chinh btn-nho" style="margin-top:8px" data-act="thu-lai">Thử lại</button>';
    if (!S.ton) return '<div class="mo">Đang tải tồn kho…</div>';
    var d = S.ton[p.ma], gio = S.tonLuc ? '<div class="ton-gio">' + ic('clock', 'ic-sm') + 'Tồn kho cập nhật ' + gioNgay(S.tonLuc) + '</div>' : '';
    if (!d || d.tong <= 0) return '<div class="ton-lon cho"><span class="cham"></span><div><b>Hết hàng</b><small>Liên hệ để đặt hàng / hỏi ngày về</small></div></div>' + gio;
    // Dòng lớn: lượng có sẵn (hoặc mai có / chờ hàng nếu kho gần không còn).
    var t = tierChinh(d), so1 = d.tier[t];
    var html = '<div class="ton-lon ' + t + '"><span class="cham"></span><div><b>' + soTon(so1, d) + '</b><small>' + TEN_TIER[t] +
      (d.m2 && !(laKhach() && so1 > NGUONG) ? ' · ≈ ' + so(Math.round(so1 * d.m2 * 10) / 10) + ' m²' : '') +
      (d.vt ? ' · ' + d.vt + ' viên/thùng' : '') + '</small></div></div>';
    var khac = ['nhanh', 'mai', 'cho'].filter(function (x) { return x !== t && d.tier[x] > 0; });
    if (khac.length) html += '<div class="tier">' + khac.map(function (x) {
      return '<span class="ton ' + x + '">' + TEN_TIER[x] + ': ' + soTon(d.tier[x], d, true) + '</span>';
    }).join('') + '</div>';
    // Tên kho, số lô: máy chủ chỉ gửi cho nhân viên/quản trị.
    if (laNoiBo() && d.kho && d.kho.length) html += '<div class="kho-ds">' + d.kho.map(function (k) {
      return '<div class="kho"><div class="kho-dong"><span>' + ic('box', 'ic-sm') + esc(k.ten) + '</span><span>' + soTon(k.tong, d, true) + '</span></div>' +
        (k.lo && k.lo.length ? '<div class="lo">' + k.lo.map(function (l) { return 'Lô ' + esc(l.so) + ': ' + so(l.sl); }).join(' · ') + '</div>' : '') + '</div>';
    }).join('') + '</div>';
    return html + gio;
  }
  function gioNgay(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ' ' + ngay(iso).slice(0, 5);
  }
  function baoGia(p) {
    // Báo giá gửi khách: chỉ giá niêm yết, không lộ giá đại lý.
    return [p._ten + ' (mã ' + p.ma + ')', p.hang ? 'Hãng: ' + p.hang : '', p.kc ? 'Quy cách: ' + p.kc : '',
      'Giá niêm yết: ' + tien(p.ny) + (p.ny > 0 && p.dvt ? '/' + p.dvt : ''), location.origin + location.pathname + '#sp=' + encodeURIComponent(p.ma),
      (CFG.TEN_DAY_DU || '') + (sdt() ? ' · ' + sdtDep() : '')].filter(String).join('\n');
  }
  function chep(txt, xong) {
    var ok = function () { if (xong) xong(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, function () { chepCu(txt); ok(); });
    else { chepCu(txt); ok(); }
  }
  function chepCu(txt) {
    var t = document.createElement('textarea'); t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) { } t.remove();
  }

  // ---------- Bảng lọc ----------
  function moLoc() {
    var coSo = timKiem(dsCoSo(), S.q), html = dauSheet('Lọc & sắp xếp') + '<div class="sh-body">', co = 0;
    html += '<div class="loc-nhom"><div class="sec">Sắp xếp</div><div class="chips wrap">' + dsSapXep().map(function (o) {
      return '<button type="button" class="chip' + (S.sort === o[0] ? ' on' : '') + '" data-sort="' + o[0] + '">' + o[1] + '</button>';
    }).join('') + '</div></div>';
    COT_LOC.forEach(function (c) {
      var dem = {};
      coSo.forEach(function (p) { giaTriCot(p, c[0]).forEach(function (v) { dem[v] = (dem[v] || 0) + 1; }); });
      var ds = Object.keys(dem).sort(function (a, b) { return a.localeCompare(b, 'vi', { numeric: true }); });
      if (ds.length < 2 && !S.loc[c[0]]) return;
      co++;
      html += '<div class="loc-nhom"><div class="sec">' + c[1] + '</div><div class="chips wrap">' +
        '<button type="button" class="chip' + (S.loc[c[0]] ? '' : ' on') + '" data-loc="' + c[0] + '" data-v="">Tất cả</button>' +
        ds.map(function (v) { return '<button type="button" class="chip' + (S.loc[c[0]] === v ? ' on' : '') + '" data-loc="' + c[0] + '" data-v="' + esc(v) + '">' + esc(v) + ' <small>' + dem[v] + '</small></button>'; }).join('') +
        '</div></div>';
    });
    if (!co) html += '<p class="mo" style="margin-top:14px">Nhóm này chưa có thông tin để lọc thêm (Màu, Công năng…).</p>';
    html += '</div><div class="sh-foot"><button type="button" class="btn btn-vien" data-act="xoa-loc">Bỏ lọc</button><button type="button" class="btn btn-chinh" data-act="dong">Xem ' + dsHienThi().length + ' sản phẩm</button></div>';
    var cuon = $('sheet').getAttribute('data-loai') === 'loc' ? $('sheet').scrollTop : 0;
    moSheet(html, 'loc');
    $('sheet').scrollTop = cuon;
  }

  // ---------- Quản lý tài khoản (chỉ admin; máy chủ kiểm tra lại) ----------
  var dsUser = [];
  function moQuanLy() {
    moSheet(dauSheet('Quản lý tài khoản') + '<div class="sh-body">' + khungTai() + '</div>', 'user');
    api('listUsers').then(function (res) {
      if (!res || res.status !== 'ok') throw new Error((res && res.msg) || 'lỗi');
      dsUser = res.data || [];
      veQuanLy();
    }).catch(function (e) { $('sheet').querySelector('.sh-body').innerHTML = '<div class="trong">' + esc(loiDeHieu(e)) + '</div>'; });
  }
  function veQuanLy() {
    var b = $('sheet').querySelector('.sh-body');
    if (!b) return;
    b.innerHTML = '<button type="button" class="btn btn-chinh" data-act="user-moi">' + ic('plus') + 'Thêm tài khoản</button><div class="sec">' + dsUser.length + ' tài khoản</div><div class="u-ds">' +
      dsUser.map(function (u, i) {
        return '<button type="button" class="u-dong" data-user="' + i + '"><span><b>' + esc(u.ten || u.username) + '</b><small>' + esc(u.username) + (u.tenCty ? ' · ' + esc(u.tenCty) : '') + (u.khoa ? ' · đã khóa' : '') + '</small></span><span class="vt vt-' + u.role + '">' + (TEN_VT[u.role] || '?') + '</span></button>';
      }).join('') + '</div>';
  }
  function formUser(u) {
    var moi = !u; u = u || { role: 'khachhang' };
    var b = $('sheet').querySelector('.sh-body');
    b.innerHTML = '<form class="form" id="f-user">' +
      '<label>Username<input name="username" required value="' + esc(u.username || '') + '"' + (moi ? '' : ' readonly') + ' autocapitalize="none" placeholder="dl_minhphat"></label>' +
      '<label>Họ tên<input name="ten" value="' + esc(u.ten || '') + '"></label>' +
      '<div class="hang2"><label>Vai trò<select name="role">' + ['khachhang', 'nv', 'admin'].map(function (r) { return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + TEN_VT[r] + '</option>'; }).join('') + '</select></label>' +
      '<label>Mật khẩu ' + (moi ? '' : '(trống = giữ nguyên)') + '<input name="password" type="text" autocomplete="new-password"' + (moi ? ' required minlength="6"' : '') + '></label></div>' +
      '<label>Tên công ty / cửa hàng<input name="tenCty" value="' + esc(u.tenCty || '') + '"></label>' +
      '<div class="hang2"><label>SĐT<input name="sdt" value="' + esc(u.sdt || '') + '" inputmode="tel"></label><label>Địa chỉ<input name="diaChi" value="' + esc(u.diaChi || '') + '"></label></div>' +
      '<label class="ck"><input type="checkbox" name="khoa"' + (u.khoa ? ' checked' : '') + '> Khóa tài khoản (không đăng nhập được)</label>' +
      '<div style="display:flex;gap:8px;margin-top:14px"><button type="button" class="btn btn-vien" data-act="user-ds">Danh sách</button><button type="submit" class="btn btn-chinh">Lưu</button></div></form>';
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
    $('app').hidden = true; $('login').hidden = false; dongSheet(true); $('acct-menu').hidden = true;
    $('login-err').textContent = '';
    setTimeout(function () { $('inp-user').focus(); }, 50);
  }
  function hienApp() {
    $('login').hidden = true; $('app').hidden = false;
    $('demo-bar').hidden = !DEMO;
    S.nhom = null; // buộc vẽ lại theo địa chỉ hiện tại
    theoHash(); taiDuLieu();
  }
  function dangNhap(e) {
    e.preventDefault();
    var u = $('inp-user').value.trim(), pw = $('inp-pass').value, nut = $('btn-login');
    if (!u || !pw) { $('login-err').textContent = 'Nhập tài khoản và mật khẩu.'; return; }
    nut.disabled = true; nut.textContent = 'Đang đăng nhập…'; $('login-err').textContent = '';
    api('login', { username: u, password: pw }, true).then(function (res) {
      if (!res || res.status !== 'ok') throw new Error((res && res.msg) || 'Đăng nhập thất bại');
      S.sess = { token: res.token, role: res.role, username: res.username, name: res.name, tenCty: res.tenCty };
      LS.set('sess', S.sess); S.ton = null; S.tonLoi = '';
      $('inp-pass').value = '';
      hienApp();
      toast('Xin chào ' + (res.name || res.username));
    }).catch(function (err) {
      $('login-err').textContent = loiDeHieu(err);
    }).then(function () { nut.disabled = false; nut.textContent = 'Đăng nhập'; });
  }
  function xoaPhien() {
    ['admin', 'nv', 'khachhang'].forEach(function (r) { LS.del('gia_' + r); LS.del('demo_gia_' + r); });
    LS.del('sess'); S.sess = null; S.ton = null; S.tonLoi = '';
  }
  function dangXuat() {
    if (S.sess && !DEMO) api('logout').catch(function () { });
    xoaPhien();
    toast('Đã đăng xuất');
    hienApp();
  }
  function hetPhien() { xoaPhien(); toast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.'); hienDangNhap(); }

  function moMenu() {
    var m = $('acct-menu');
    if (!m.hidden) { m.hidden = true; return; }
    var s = S.sess;
    if (!s) return;
    m.innerHTML = '<div class="who"><b>' + esc(s.name || s.username) + '</b>' + TEN_VT[s.role] + (s.tenCty ? ' · ' + esc(s.tenCty) : '') + '</div>' +
      (s.role === 'admin' ? '<button type="button" data-act="quan-ly">' + ic('users') + 'Quản lý tài khoản</button><button type="button" data-act="lam-moi-may-chu">' + ic('refresh') + 'Lấy dữ liệu mới từ Sheet</button>' : '') +
      '<button type="button" data-act="thu-lai">' + ic('refresh') + 'Tải lại dữ liệu</button>' +
      '<button type="button" data-act="dang-xuat">' + ic('logout') + 'Đăng xuất</button>';
    m.hidden = false;
  }

  // ---------- Bấm (một chỗ xử lý cho cả app) ----------
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act],[data-sp],[data-nhom],[data-nav],[data-hang],[data-hang-home],[data-loc],[data-sort],[data-anh],[data-user]');
    var menu = $('acct-menu');
    if (!menu.hidden && !e.target.closest('#acct-menu') && !(el && el.getAttribute('data-act') === 'menu')) menu.hidden = true;
    if (!el) { if (e.target.id === 'sheet-nen') dongSheet(); return; }
    var a = el.getAttribute('data-act');
    if (el.hasAttribute('data-sp')) { S.moTuApp = true; var h = docHash(); h.sp = el.getAttribute('data-sp'); ghiHash(h); return; }
    if (el.hasAttribute('data-nhom')) return diToi(el.getAttribute('data-nhom'), '');
    if (el.hasAttribute('data-nav')) return diToi(el.getAttribute('data-nav'), '');
    if (el.hasAttribute('data-hang-home')) return diToi('all', el.getAttribute('data-hang-home'));
    if (el.hasAttribute('data-hang')) { S.hang = el.getAttribute('data-hang'); S.trang = 1; S.loc = {}; var hh = docHash(); hh.h = S.hang; ghiHash(hh, true); veTrang(); return; }
    if (el.hasAttribute('data-sort')) { S.sort = el.getAttribute('data-sort'); S.trang = 1; veTrang(); moLoc(); return; }
    if (el.hasAttribute('data-loc')) { S.loc[el.getAttribute('data-loc')] = el.getAttribute('data-v'); S.trang = 1; veTrang(); moLoc(); return; }
    if (el.hasAttribute('data-anh')) { var n = anhCua(S.sp).length; S.anhIdx = (S.anhIdx + Number(el.getAttribute('data-anh')) + n) % n; moChiTiet(true); return; }
    if (el.hasAttribute('data-user')) { formUser(dsUser[Number(el.getAttribute('data-user'))]); return; }
    switch (a) {
      case 'home': S.qHome = ''; diToi('', ''); break;
      case 'menu': moMenu(); break;
      case 'dong': dongSheet(); break;
      case 'them': S.trang++; veKetQua(); break;
      case 'loc': moLoc(); break;
      case 'xoa-loc': S.loc = {}; S.chiConHang = false; veTrang(); moLoc(); break;
      case 'con-hang': S.chiConHang = !S.chiConHang; S.trang = 1; veTrang(); break;
      case 'chep-ma': chep(el.getAttribute('data-ma'), function () { toast('Đã chép mã ' + el.getAttribute('data-ma')); }); break;
      case 'doi-kieu': S.kieu = S.kieu === 'luoi' ? 'dong' : 'luoi'; LS.set('kieu', S.kieu); veTrang(); break;
      case 'chep': chep(baoGia(S.byMa[el.getAttribute('data-ma')]), function () { toast('Đã chép báo giá – dán gửi khách'); }); break;
      case 'zalo':
        // zalo.me không nhận nội dung soạn sẵn: chép thông tin mã trước, mở Zalo, anh/chị dán vào.
        chep(baoGia(S.byMa[el.getAttribute('data-ma')]), function () { toast('Đã chép thông tin mã – dán vào khung chat Zalo'); });
        window.open('https://zalo.me/' + sdt(), '_blank', 'noopener');
        break;
      case 'thu-lai': menu.hidden = true; taiDuLieu(); break;
      case 'dang-nhap': menu.hidden = true; hienDangNhap(); break;
      case 'dong-dang-nhap': hienApp(); break;
      case 'dang-xuat': menu.hidden = true; dangXuat(); break;
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
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('sheet').hidden) dongSheet(); });
  window.addEventListener('popstate', theoHash);
  window.addEventListener('resize', function () { var t = $('topbar'); if (t) document.documentElement.style.setProperty('--top-h', t.offsetHeight + 'px'); });
  $('login-form').addEventListener('submit', dangNhap);

  // ---------- Thương hiệu từ config.js ----------
  function logoHtml() { return CFG.LOGO ? '<img src="' + esc(CFG.LOGO) + '" alt="">' : esc(CFG.VIET_TAT || ''); }
  function apThuongHieu() {
    var r = document.documentElement.style;
    if (CFG.MAU_CHINH) { r.setProperty('--c', CFG.MAU_CHINH); document.querySelector('meta[name=theme-color]').content = CFG.MAU_CHINH; }
    if (CFG.MAU_DAM) r.setProperty('--c2', CFG.MAU_DAM);
    if (CFG.MAU_NHAN) r.setProperty('--do', CFG.MAU_NHAN);
    $('login-logo').innerHTML = CFG.LOGO_DAY_DU ? '<img src="' + esc(CFG.LOGO_DAY_DU) + '" alt="' + esc(CFG.TEN_DAY_DU || '') + '">' : logoHtml();
    $('login-back-ic').innerHTML = ic('back', 'ic-sm');
    $('login-ten').textContent = CFG.TEN_APP || '';
    $('login-sub').textContent = CFG.KHAU_HIEU || '';
    document.title = 'Bảng giá ' + (CFG.TEN_APP || '');
    $('login-foot').innerHTML = DEMO ? 'Dùng thử: tài khoản <b>admin</b>, <b>nv</b> hoặc <b>daily</b>, mật khẩu bất kỳ.'
      : (sdt() ? 'Chưa có tài khoản / quên mật khẩu? <a href="https://zalo.me/' + sdt() + '" target="_blank" rel="noopener">Liên hệ ' + esc(CFG.LIEN_HE_TEN || '') + ' · ' + sdtDep() + '</a>' : '');
  }

  // Điện thoại hay giữ index.html cũ (GitHub Pages đệm 10 phút, app "thêm vào màn hình chính" còn lâu hơn):
  // đọc index.html mới nhất, thấy số phiên bản app.js khác bản đang chạy thì tải lại một lần.
  function kiemTraBanMoi() {
    var dangChay = ((document.querySelector('script[src*="app.js"]') || {}).src || '').match(/v=(\d+)/);
    if (!dangChay || !window.fetch) return;
    fetch('index.html?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (html) {
      var moi = html.match(/app\.js\?v=(\d+)/);
      if (!moi || moi[1] === dangChay[1]) return;
      try { if (sessionStorage.getItem('hn_da_tai_lai') === moi[1]) return; sessionStorage.setItem('hn_da_tai_lai', moi[1]); } catch (e) { }
      location.reload();
    }).catch(function () { });
  }
  // Mở app là vào thẳng bảng giá; đăng nhập chỉ khi cần giá đại lý / tồn kho.
  function batDau() { apThuongHieu(); hienApp(); if (!DEMO) kiemTraBanMoi(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !DEMO) kiemTraBanMoi(); });
  if (DEMO) {
    var sc = document.createElement('script');
    sc.src = 'demo-data.js?v=3'; sc.onload = batDau;
    sc.onerror = function () { document.body.innerHTML = '<p style="padding:20px">Chưa cấu hình APPS_URL trong config.js.</p>'; };
    document.head.appendChild(sc);
  } else batDau();
})();
