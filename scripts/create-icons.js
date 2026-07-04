const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

const table = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  table[i] = c
}
function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const byte of buf) crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

// Draw a simple icon: cream background (#FAF7F2) with navy blue (#0D1B2A) "K"
// Using a pixel-art K shape scaled to size
function createIcon(size) {
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // bit depth 8, RGB

  // Background: cream #FAF7F2
  const bg = [0xFA, 0xF7, 0xF2]
  // Letter color: navy #0D1B2A
  const fg = [0x0D, 0x1B, 0x2A]

  // Define K shape as normalized coordinates [0..1]
  // We'll draw K using column/row logic
  const pixels = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size  // 0..1
      const ny = y / size  // 0..1
      // padding 20% on all sides
      const pad = 0.20
      const innerX = (nx - pad) / (1 - 2*pad) // 0..1 within content area
      const innerY = (ny - pad) / (1 - 2*pad)
      let isLetter = false
      if (innerX >= 0 && innerX <= 1 && innerY >= 0 && innerY <= 1) {
        // Vertical stroke of K: left 30% of content
        if (innerX >= 0 && innerX < 0.30) {
          isLetter = true
        }
        // Upper diagonal of K: from (0.30, 0) to (1.0, 0) going down to center
        if (innerX >= 0.28 && innerY <= 0.50) {
          // upper arm: line from (0.28, 0.50) to (1.0, 0)
          const threshold = 0.50 - (innerX - 0.28) / (1.0 - 0.28) * 0.50
          const stroke = 0.10
          if (innerY >= threshold - stroke && innerY <= threshold + stroke) {
            isLetter = true
          }
        }
        // Lower diagonal of K: from center to bottom-right
        if (innerX >= 0.28 && innerY >= 0.50) {
          // lower arm: line from (0.28, 0.50) to (1.0, 1.0)
          const threshold = 0.50 + (innerX - 0.28) / (1.0 - 0.28) * 0.50
          const stroke = 0.10
          if (innerY >= threshold - stroke && innerY <= threshold + stroke) {
            isLetter = true
          }
        }
      }
      const color = isLetter ? fg : bg
      pixels.push(color[0], color[1], color[2])
    }
  }

  const rows = []
  for (let y = 0; y < size; y++) {
    rows.push(0) // filter byte
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 3
      rows.push(pixels[i], pixels[i+1], pixels[i+2])
    }
  }
  const raw = Buffer.from(rows)
  const compressed = zlib.deflateSync(raw)

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

const publicDir = path.join(__dirname, '..', 'public')
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createIcon(192))
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createIcon(512))
console.log('Icons created: icon-192.png, icon-512.png')
