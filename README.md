# Ephemeral P2P Image (webrtc-image-ephemeral)

Minimal demo: a small signaling server and a front-end that implement end-to-end encrypted (ECDH + AES-GCM) peer-to-peer image transfer via WebRTC DataChannel. Images are encrypted in the browser and transferred directly between peers; the server only relays signaling and does not store images or keys.

## Quick start (local)

Requirements: Node.js 16+ (recommended 18+), npm

```bash
# clone
git clone git@github.com:gqh5166/dify.git
cd dify

# install and run
npm install
npm start

# open in browser
http://localhost:3000
```

Open two browser contexts (normal + incognito or another device). Create a session in one, join from the other with the room ID, then send an image. The receiving side will render the image in a canvas with a watermark and an automatic countdown; after viewing the session will be cleaned up locally and the signaling server will be notified to delete the room.

## Docker

Build and run with Docker:

```bash
# build image
docker build -t webrtc-ephemeral .

# run container
docker run -p 3000:3000 --rm --name webrtc-ephemeral webrtc-ephemeral
```

Or with docker-compose:

```bash
docker-compose up --build
```

## Configuration

- Default HTTP port: 3000 (environment variable PORT)
- The server serves static files from the `public/` directory and provides a WebSocket-based signaling endpoint for exchange of SDP/ICE and ECDH public keys.

## Security & Limitations

- The server is zero-knowledge: it only forwards signaling messages and does not persist images or encryption keys.
- E2EE is provided by ephemeral ECDH key exchange (P-256) and AES-GCM encryption; however, browsers cannot prevent screenshots or external photography.
- If both peers are behind symmetric NAT, a TURN server may be needed for reliable P2P connectivity. Using a TURN server will relay data through the TURN server (i.e. traffic will traverse that server).

## Files in this repo

- server.js — minimal signaling server (Express + ws)
- public/index.html — single-file demo client (HTML/JS/CSS)
- package.json — dependency list and start script
- Dockerfile, docker-compose.yml — containerization files
- .github/workflows/ci.yml — simple CI to validate install

## Production notes

- Use HTTPS/WSS in production (use a reverse proxy such as nginx or a platform that provides TLS). Example nginx configuration is provided in `nginx.conf`.
- Consider adding monitoring, rate-limiting, and authentication for production deployments.

## License

MIT — see LICENSE
