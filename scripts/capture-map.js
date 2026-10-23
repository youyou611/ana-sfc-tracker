const { spawn } = require('child_process');
const fs = require('fs');

async function capture() {
  const edgePath = fs.existsSync("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe")
    ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
    : "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe";

  const port = 9225;
  const edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--window-size=1280,900',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const pages = await listRes.json();
    const wsUrl = pages[0].webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const send = (method, params = {}) => new Promise(resolve => {
      const msgId = id++;
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://localhost:3009/map' });

    // 読み込み待機
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 300));
      const res = await send('Runtime.evaluate', {
        expression: "document.body.innerText.includes('路線マップ') && !document.body.innerText.includes('読み込んでいます')"
      });
      if (res?.result?.value) break;
    }
    await new Promise(r => setTimeout(r, 500));

    // 1. 路線マップ一覧ページのキャプチャ
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('routemap-page.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved routemap-page.png');

    // 2. プレビューをクリックして全画面モーダルを開く
    await send('Runtime.evaluate', {
      expression: "const btn = document.querySelector('.shared-route-map-preview'); if (btn) btn.click();"
    });
    // スプリングアニメーション待機
    await new Promise(r => setTimeout(r, 800));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('routemap-fullscreen-2d.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved routemap-fullscreen-2d.png');

    // 3. 3D地球儀モードに切り替え
    await send('Runtime.evaluate', {
      expression: "const btn3d = document.querySelectorAll('.shared-glass-segmented button')[1]; if (btn3d) btn3d.click();"
    });
    // クロスフェード待機
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('routemap-fullscreen-3d.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved routemap-fullscreen-3d.png');

    ws.close();
  } finally {
    edge.kill();
  }
}

capture().catch(console.error);
