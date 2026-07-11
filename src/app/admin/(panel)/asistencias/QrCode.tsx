'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'

export default function QrCode({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 inline-block">
        <QRCodeSVG value={url} size={192} level="M" />
      </div>
      <button
        onClick={handleCopy}
        className="text-xs font-body text-navy/50 hover:text-navy transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-navy/5"
      >
        <span className="truncate max-w-[200px]">{url}</span>
        <span>{copied ? '✓' : '⎘'}</span>
      </button>
    </div>
  )
}
