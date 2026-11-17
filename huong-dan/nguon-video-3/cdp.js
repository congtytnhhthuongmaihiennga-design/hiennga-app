// Điều khiển Chrome chạy ngầm qua giao thức gỡ lỗi (DevTools Protocol) – không cần cài thư viện nào.
// Dùng WebSocket + fetch có sẵn trong Node 22+.
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const cho = ms => new Promise(r => setTimeout(r, ms));

async function moChrome(cong) {
  cong = cong || 9333;
  const hoSo = fs.mkdtempSync(path.join(os.tmpdir(), 'hn-video-'));
  const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + cong, '--user-data-dir=' + hoSo, '--allow-file-access-from-files',
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--force-color-profile=srgb', '--lang=vi', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 100; i++) { try { await fetch('http://127.0.0.1:' + cong + '/json/version'); break; } catch (e) { await cho(150); } }
  return {
    trang: () => trangMoi(cong),
    dong: async () => { proc.kill(); await cho(500); try { fs.rmSync(hoSo, { recursive: true, force: true }); } catch (e) { } }
  };
}

async function trangMoi(cong) {
  const t = await (await fetch('http://127.0.0.1:' + cong + '/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((ok, loi) => { ws.onopen = ok; ws.onerror = loi; });
  let id = 0; const doi = {}, nghe = {};
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && doi[m.id]) { doi[m.id](m); delete doi[m.id]; }
    else if (m.method && nghe[m.method]) nghe[m.method].forEach(f => f(m.params));
  };
  const gui = (method, params) => new Promise((ok, loi) => { const i = ++id; doi[i] = m => m.error ? loi(new Error(method + ': ' + m.error.message)) : ok(m.result); ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  const on = (ev, f) => (nghe[ev] = nghe[ev] || []).push(f);
  await gui('Page.enable'); await gui('Runtime.enable');
  on('Page.javascriptDialogOpening', p => gui('Page.handleJavaScriptDialog', { accept: true, promptText: p.defaultPrompt || '' }));
  on('Runtime.exceptionThrown', p => console.log('LỖI TRANG:', (p.exceptionDetails.exception || {}).description || p.exceptionDetails.text));
  const P = {
    async khung(w, h, tiLe, dienThoai) {
      await gui('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: tiLe || 1, mobile: !!dienThoai });
      await gui('Emulation.setTouchEmulationEnabled', { enabled: !!dienThoai });
      P.w = w; P.h = h;
    },
    async truocKhiMo(js) { await gui('Page.addScriptToEvaluateOnNewDocument', { source: js }); },
    async mo(url, them) {
      const xong = new Promise(r => { const f = () => { r(); }; on('Page.loadEventFired', f); });
      await gui('Page.navigate', { url }); await Promise.race([xong, cho(15000)]); await cho(them === undefined ? 1200 : them);
    },
    async chay(js) {
      const r = await gui('Runtime.evaluate', { expression: '(async () => {' + js + '})()', awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error('chay: ' + ((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text));
      return r.result && r.result.value;
    },
    async chup(file, vung) {
      const cuon = (await gui('Runtime.evaluate', { expression: '[scrollX, scrollY]', returnByValue: true })).result.value; // vùng chụp tính theo cả trang -> cộng vị trí cuộn
      const c = Object.assign({ x: 0, y: 0, width: P.w, height: P.h, scale: 1 }, vung || {}); c.x += cuon[0]; c.y += cuon[1];
      const r = await gui('Page.captureScreenshot', { format: 'png', clip: c });
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    },
    async dong() { try { ws.close(); } catch (e) { } }
  };
  return P;
}
module.exports = { moChrome, cho };
