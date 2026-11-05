// ============================================================
// TÀI KHOẢN: đăng nhập, danh sách, thêm/sửa (chỉ admin).
// Tạo admin đầu tiên: gõ Username + "Mật khẩu mới" + Vai trò = admin
// vào tab Users. Lần đăng nhập đầu, máy chủ tự mã hóa rồi xóa ô mật khẩu.
// ============================================================

function tabUsers() {
  var sh = layTab(TAB.users, false);
  if (!sh) { khoiTaoTab(TAB.users, TIEU_DE.users); sh = layTab(TAB.users, true); }
  var rows = sh.getDataRange().getValues();
  var c = timCot(rows[0] || [], {
    user: ['Username'], ten: ['Họ tên', 'Name'], role: ['Vai trò', 'Role'], moi: ['Mật khẩu mới'],
    hash: ['PasswordHash'], cty: ['Tên công ty'], sdt: ['SĐT'], dc: ['Địa chỉ'], khoa: ['Khóa']
  });
  if (c.user === undefined || c.hash === undefined || c.role === undefined) {
    throw new Error('Tab "' + TAB.users + '" thiếu cột Username / Vai trò / PasswordHash.');
  }
  return { sh: sh, rows: rows, c: c };
}
function laKhoa(v) { var k = norm(v); return k === 'co' || k === 'x' || k === 'khoa' || k === 'true' || k === '1'; }
function vaiTro(v) { var k = norm(v); return VAI_TRO.indexOf(k) >= 0 ? k : (k === 'nhanvien' ? 'nv' : (k === 'daily' ? 'khachhang' : '')); }

function dsBiKhoa() {
  var c = CacheService.getScriptCache(), s = c.get('ds_khoa');
  if (s != null) return JSON.parse(s);
  var ds = [];
  try {
    var u = tabUsers();
    for (var i = 1; i < u.rows.length; i++) {
      var r = u.rows[i];
      if (u.c.khoa !== undefined && laKhoa(r[u.c.khoa])) ds.push(chu(r[u.c.user]).toLowerCase());
    }
  } catch (e) { }
  c.put('ds_khoa', JSON.stringify(ds), 3600);
  return ds;
}

function login(p) {
  var user = chu(p.username).toLowerCase(), pw = String(p.password || '');
  if (!user || !pw) return { status: 'error', msg: 'Nhập tài khoản và mật khẩu.' };
  // Chống dò mật khẩu: sai 6 lần thì khóa tạm 10 phút.
  var cache = CacheService.getScriptCache(), kSai = 'sai_' + user, soSai = Number(cache.get(kSai) || 0);
  if (soSai >= 6) return { status: 'error', msg: 'Sai quá nhiều lần. Thử lại sau 10 phút.' };

  var u = tabUsers(), c = u.c;
  for (var i = 1; i < u.rows.length; i++) {
    var r = u.rows[i];
    if (chu(r[c.user]).toLowerCase() !== user) continue;
    if (c.khoa !== undefined && laKhoa(r[c.khoa])) return { status: 'error', msg: 'Tài khoản đã bị khóa.' };
    var hash = chu(r[c.hash]);
    if (c.moi !== undefined && chu(r[c.moi])) {
      hash = bamMatKhau(user, chu(r[c.moi]));
      u.sh.getRange(i + 1, c.hash + 1).setValue(hash);
      u.sh.getRange(i + 1, c.moi + 1).setValue('');
    }
    if (!hash || bamMatKhau(user, pw) !== hash) break;
    var role = vaiTro(r[c.role]);
    if (!role) return { status: 'error', msg: 'Tài khoản chưa có vai trò hợp lệ (admin / nv / khachhang).' };
    cache.remove(kSai);
    if (Math.random() < 0.1) donToken();
    function o(k) { return c[k] === undefined ? '' : chu(r[c[k]]); }
    return { status: 'ok', token: taoToken(role, user), role: role, username: user, name: o('ten') || user, tenCty: o('cty'), sdt: o('sdt') };
  }
  cache.put(kSai, String(soSai + 1), 600);
  return { status: 'error', msg: 'Sai tài khoản hoặc mật khẩu.' };
}

function listUsers() {
  var u = tabUsers(), c = u.c, ds = [];
  function o(r, k) { return c[k] === undefined ? '' : chu(r[c[k]]); }
  for (var i = 1; i < u.rows.length; i++) {
    var r = u.rows[i];
    if (!o(r, 'user')) continue;
    ds.push({ username: o(r, 'user'), ten: o(r, 'ten'), role: vaiTro(r[c.role]), tenCty: o(r, 'cty'),
      sdt: o(r, 'sdt'), diaChi: o(r, 'dc'), khoa: c.khoa !== undefined && laKhoa(r[c.khoa]), coMatKhau: !!(o(r, 'hash') || o(r, 'moi')) });
  }
  return { status: 'ok', data: ds };
}

// Thêm mới hoặc sửa (theo Username). Mật khẩu để trống = giữ nguyên.
function luuUser(p) {
  var user = chu(p.username).toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(user)) return { status: 'error', msg: 'Username 3–40 ký tự, chỉ chữ không dấu, số, dấu . _ -' };
  var role = vaiTro(p.role);
  if (!role) return { status: 'error', msg: 'Vai trò phải là admin, nv hoặc khachhang.' };
  var u = tabUsers(), c = u.c, dong = -1;
  for (var i = 1; i < u.rows.length; i++) if (chu(u.rows[i][c.user]).toLowerCase() === user) { dong = i; break; }
  var pw = String(p.password || '');
  if (dong < 0 && pw.length < 6) return { status: 'error', msg: 'Tài khoản mới cần mật khẩu từ 6 ký tự.' };
  if (pw && pw.length < 6) return { status: 'error', msg: 'Mật khẩu từ 6 ký tự.' };

  var r = dong >= 0 ? u.rows[dong].slice() : u.rows[0].map(function () { return ''; });
  function dat(k, v) { if (c[k] !== undefined) r[c[k]] = v; }
  dat('user', user); dat('ten', chu(p.ten)); dat('role', role);
  dat('cty', chu(p.tenCty)); dat('sdt', chu(p.sdt)); dat('dc', chu(p.diaChi));
  dat('khoa', p.khoa === true || p.khoa === 'true' ? 'Có' : '');
  if (pw) { dat('hash', bamMatKhau(user, pw)); dat('moi', ''); }
  if (dong >= 0) u.sh.getRange(dong + 1, 1, 1, r.length).setValues([r]);
  else u.sh.appendRow(r);
  CacheService.getScriptCache().remove('ds_khoa');
  return { status: 'ok', msg: dong >= 0 ? 'Đã cập nhật ' + user : 'Đã tạo ' + user };
}
