// ============================================================
// HÀM DÙNG CHUNG: đọc tab, dò cột theo tên, bộ nhớ đệm, token.
// ============================================================

// Bỏ dấu, chữ thường, chỉ giữ chữ/số: "Giá Đại lý" -> "giadaily".
function norm(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function layTab(ten, batBuoc) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ten);
  if (!sh && batBuoc) throw new Error('Không thấy tab "' + ten + '" trong Sheet. Kiểm tra lại tên tab (không được đổi tên tab).');
  return sh;
}

// Tìm cột theo danh sách tên chấp nhận được; trả về {khoa: chỉ số cột}.
function timCot(header, dsCot) {
  var viTri = {};
  header.forEach(function (h, i) { var k = norm(h); if (k && viTri[k] === undefined) viTri[k] = i; });
  var out = {};
  Object.keys(dsCot).forEach(function (khoa) {
    var ten = dsCot[khoa];
    for (var j = 0; j < ten.length; j++) {
      var i = viTri[norm(ten[j])];
      if (i !== undefined) { out[khoa] = i; return; }
    }
  });
  return out;
}

// Dòng tiêu đề = dòng đầu tiên (trong 15 dòng) có cột mã hàng.
// File Excel dán vào hay có vài dòng tên công ty/ngày ở trên.
function timDongTieuDe(rows, tenCotMa) {
  var can = tenCotMa.map(norm);
  for (var r = 0; r < Math.min(rows.length, 15); r++) {
    for (var c = 0; c < rows[r].length; c++) {
      if (can.indexOf(norm(rows[r][c])) >= 0) return r;
    }
  }
  return -1;
}

// "258.000đ" / 258000 / "258,000" -> 258000
function soTien(v) {
  if (typeof v === 'number') return Math.round(v);
  var s = String(v || '').replace(/[^\d]/g, '');
  return s ? Number(s) : 0;
}
// Số lượng có thể lẻ: "1.234,5" hoặc 1234.5
function soLuong(v) {
  if (typeof v === 'number') return v;
  var s = String(v || '').trim();
  if (!s) return 0;
  if (/,\d{1,3}$/.test(s) && s.indexOf('.') >= 0) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  return parseFloat(s.replace(/[^\d.\-]/g, '')) || 0;
}

function chu(v) { return String(v == null ? '' : v).trim(); }

// Link ảnh Google Drive -> link ảnh hiển thị được (cần chia sẻ "Bất kỳ ai có liên kết").
function linkAnh(u) {
  u = chu(u);
  if (!u) return '';
  var m = u.match(/\/d\/([\w-]{20,})/) || u.match(/[?&]id=([\w-]{20,})/);
  if (m && /drive\.google|docs\.google/.test(u)) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1000';
  return /^https?:\/\//i.test(u) ? u : '';
}

// ---------- Bộ nhớ đệm chia mảnh (CacheService giới hạn 100KB/khóa) ----------
var MANH = 90000;
function demLay(khoa) {
  var c = CacheService.getScriptCache();
  var n = c.get(khoa + '_n');
  if (!n) return null;
  var keys = [];
  for (var i = 0; i < Number(n); i++) keys.push(khoa + '_' + i);
  var got = c.getAll(keys), s = '';
  for (var j = 0; j < keys.length; j++) { if (got[keys[j]] == null) return null; s += got[keys[j]]; }
  try { return JSON.parse(s); } catch (e) { return null; }
}
function demLuu(khoa, obj) {
  var s = JSON.stringify(obj), m = {}, n = 0;
  for (var i = 0; i < s.length; i += MANH) m[khoa + '_' + (n++)] = s.substr(i, MANH);
  if (n > 90) return; // quá lớn (~8MB) thì thôi không đệm
  m[khoa + '_n'] = String(n);
  CacheService.getScriptCache().putAll(m, CACHE_GIAY);
}
function demXoa(khoa) {
  var c = CacheService.getScriptCache();
  var n = Number(c.get(khoa + '_n') || 0), keys = [khoa + '_n'];
  for (var i = 0; i < Math.max(n, 1); i++) keys.push(khoa + '_' + i);
  c.removeAll(keys);
}
// Lấy từ đệm, không có thì tính rồi lưu. Luôn trả bản sao mới (sửa thoải mái).
function quaDem(khoa, tinh) {
  var v = demLay(khoa);
  if (v) return v;
  v = tinh();
  if (v && v.status === 'ok') demLuu(khoa, v);
  return JSON.parse(JSON.stringify(v));
}

// ---------- Mã hóa mật khẩu + token đăng nhập ----------
function muoi() {
  var p = PropertiesService.getScriptProperties();
  var s = p.getProperty('MUOI');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('MUOI', s); }
  return s;
}
function bamMatKhau(user, pw) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, user + '|' + pw + '|' + muoi(), Utilities.Charset.UTF_8);
  return b.map(function (x) { return ('0' + (x & 255).toString(16)).slice(-2); }).join('');
}

function taoToken(role, user) {
  var t = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  var het = Date.now() + TOKEN_NGAY * 86400000;
  var v = role + '|' + user + '|' + het;
  PropertiesService.getScriptProperties().setProperty('tok_' + t, v);
  CacheService.getScriptCache().put('tok_' + t, v, 21600);
  return t;
}
function xoaToken(t) {
  if (!t) return;
  PropertiesService.getScriptProperties().deleteProperty('tok_' + t);
  CacheService.getScriptCache().remove('tok_' + t);
}
// Server tự biết ai đang gọi từ token – không tin vai trò do trình duyệt gửi lên.
function tokInfo(t) {
  if (!t || !/^[a-f0-9]{64}$/.test(t)) return null;
  var v = CacheService.getScriptCache().get('tok_' + t) || PropertiesService.getScriptProperties().getProperty('tok_' + t);
  if (!v) return null;
  var a = v.split('|');
  if (Number(a[2]) < Date.now()) { xoaToken(t); return null; }
  if (dsBiKhoa().indexOf(a[1]) >= 0) return null; // tài khoản đã bị khóa
  return { role: a[0], user: a[1] };
}
// Dọn token hết hạn (gọi lúc đăng nhập, thỉnh thoảng).
function donToken() {
  var p = PropertiesService.getScriptProperties(), all = p.getProperties(), now = Date.now();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('tok_') === 0 && Number(String(all[k]).split('|')[2]) < now) p.deleteProperty(k);
  });
}
