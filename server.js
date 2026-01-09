const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { nanoid } = require('nanoid');

const app = express();
app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch (e) { return; }
    const { type, room, payload } = data;

    if (type === 'create') {
      const roomId = nanoid(8);
      rooms.set(roomId, { clients: [ws] });
      ws.roomId = roomId;
      ws.isCreator = true;
      ws.send(JSON.stringify({ type: 'created', room: roomId }));
      return;
    }

    if (!room) return;

    const r = rooms.get(room);
    if (!r) {
      ws.send(JSON.stringify({ type: 'error', message: 'room-not-found' }));
      return;
    }

    if (type === 'join') {
      if (r.clients.length >= 2) {
        ws.send(JSON.stringify({ type: 'error', message: 'room-full' }));
        return;
      }
      r.clients.push(ws);
      ws.roomId = room;
      ws.isCreator = false;
      r.clients.forEach((c) => {
        try {
          c.send(JSON.stringify({ type: 'peer-joined', room }));
        } catch (e) {}
      });
      return;
    }

    const peers = r.clients.filter((c) => c !== ws);
    peers.forEach((peer) => {
      try {
        peer.send(JSON.stringify({ type, room, payload }));
      } catch (e) {}
    });

    if (type === 'consumed') {
      r.clients.forEach((c) => {
        try {
          c.send(JSON.stringify({ type: 'session-ended', room }));
        } catch (e) {}
        try { c.close(); } catch (e) {}
      });
      rooms.delete(room);
    }
  });

  ws.on('close', () => {
    const rid = ws.roomId;
    if (!rid) return;
    const r = rooms.get(rid);
    if (!r) return;
    r.clients = r.clients.filter((c) => c !== ws);
    r.clients.forEach((c) => {
      try { c.send(JSON.stringify({ type: 'peer-left', room: rid })); } catch (e) {}
      try { c.close(); } catch (e) {}
    });
    rooms.delete(rid);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
