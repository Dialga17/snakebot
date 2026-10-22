import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';
import { publicGifts, findGift } from './gifts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const USERNAME = (process.env.TIKTOK_USERNAME || '').replace(/^@/, '');

const app = express();
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, 'public')));

const wss = new WebSocketServer({ server });

let tiktokStatus = USERNAME ? 'disconnected' : 'username_kosong';
let repeatEnd = false;
let reconnectAttempt = 0;
let scheduleTimer = null;
let tiktokConn = null;

function schedule() {
  if (scheduleTimer) return;
  const delay = Math.min(5000 * Math.pow(1.5, reconnectAttempt), 60000);
  scheduleTimer = setTimeout(() => {
    scheduleTimer = null;
    reconnectAttempt += 1;
    connectTikTok().catch(() => {});
  }, delay);
}

async function connectTikTok() {
  try {
    if (tiktokConn) {
      try { await tiktokConn.disconnect(); } catch (e) {}
    }
    tiktokConn = new TikTokLiveConnection(USERNAME);
    tiktokConn.on(WebcastEvent.GIFT, onGift);
    tiktokConn.on(ControlEvent.DISCONNECTED, () => {
      tiktokStatus = 'disconnected';
      wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'status', tiktok: tiktokStatus }));
        }
      });
      schedule();
    });
    tiktokConn.on(ControlEvent.ERROR, () => {
      tiktokStatus = 'error';
      wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'status', tiktok: tiktokStatus }));
        }
      });
      schedule();
    });
    await tiktokConn.connect();
    tiktokStatus = 'connected';
    reconnectAttempt = 0;
  } catch (err) {
    tiktokStatus = 'gagal';
    schedule();
  }
}

function onGift(d) {
  const giftType = d.giftType ?? d.giftDetails?.giftType;
  if (giftType === 1 && !repeatEnd) return;
  const giftName = d.giftName || d.giftDetails?.giftName || '';
  const uniqueId = d.uniqueId || d.user?.uniqueId || d.nickname || d.user?.nickname || 'penonton';
  const count = Math.min(Math.max(d.repeatCount || 1, 1), 500);
  const id = findGift(giftName);
  console.log('Gift:', giftName, 'by', uniqueId, 'count:', count);
  if (id) {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'gift', gift: id, count, user: uniqueId }));
      }
    });
  }
}

function pingAll() {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      ws.terminate();
    } else {
      ws.isAlive = false;
      ws.ping();
    }
  });
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.send(JSON.stringify({ type: 'status', tiktok: tiktokStatus }));
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

setInterval(pingAll, 25000);

app.get('/health', (req, res) => {
  res.json({ ok: true, tiktok: tiktokStatus });
});

app.get('/api/gifts', (req, res) => {
  res.json(publicGifts());
});

if (USERNAME) {
  connectTikTok();
}

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
