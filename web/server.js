/**
 * MiniPilot Server
 * - Serves index.html
 * - Bridges UDP ↔ WebSocket (port changeable at runtime from the browser)
 */

import { createServer } from 'http'
import { readFileSync } from 'fs'
import { WebSocketServer } from 'ws'
import { createSocket } from 'dgram'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir    = dirname(fileURLToPath(import.meta.url))
const PORT_HTTP = 3000
let   PORT_UDP  = 49161

// ── HTTP ──────────────────────────────────────────────────────────────────────
const http = createServer((req, res) => {
  try {
    const html = readFileSync(join(__dir, 'index.html'))
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  } catch {
    res.writeHead(404); res.end('not found')
  }
})

// ── WebSocket ─────────────────────────────────────────────────────────────────
const wss     = new WebSocketServer({ server: http })
const clients = new Set()

wss.on('connection', (ws) => {
  ws.socket?.setNoDelay(true)
  clients.add(ws)
  console.log(`  ◉ Browser connected (${clients.size} total)`)

  // Send current UDP port to newly connected browser
  ws.send(JSON.stringify({ type: 'udp-port', port: PORT_UDP }))

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw)
      if (msg.type === 'set-udp-port') {
        const port = parseInt(msg.port)
        if (port > 1024 && port < 65535) rebindUDP(port)
      }
    } catch {}
  })

  ws.on('close', () => { clients.delete(ws); console.log(`  ○ Browser disconnected`) })
})

function broadcast(msg) {
  for (const c of clients) {
    if (c.readyState === 1) c.send(msg, { compress: false, binary: false, fin: true })
  }
}

// ── UDP ───────────────────────────────────────────────────────────────────────
let udp = null

function rebindUDP(port) {
  if (udp) {
    udp.close(() => startUDP(port))
  } else {
    startUDP(port)
  }
}

function startUDP(port) {
  PORT_UDP = port
  udp = createSocket('udp4')

  udp.on('message', (msg) => {
    const str = msg.toString().trim()
    console.log(`  ↓ UDP: "${str}"`)
    broadcast(str)
  })

  udp.on('listening', () => {
    const { address, port } = udp.address()
    console.log(`  UDP listening on ${address}:${port}`)
    // Notify all browsers of the new port
    for (const c of clients) {
      if (c.readyState === 1) c.send(JSON.stringify({ type: 'udp-port', port }))
    }
  })

  udp.on('error', (err) => {
    console.error(`  UDP error: ${err.message}`)
    broadcast(JSON.stringify({ type: 'udp-error', message: err.message }))
  })

  udp.bind(port)
}

startUDP(PORT_UDP)

// ── Start ─────────────────────────────────────────────────────────────────────
http.listen(PORT_HTTP, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  MiniPilot')
  console.log(`  Open → http://localhost:${PORT_HTTP}`)
  console.log(`  UDP port: ${PORT_UDP}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
})
