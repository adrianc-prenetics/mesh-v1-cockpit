import React, { useEffect, useState } from 'react'

export default function HeartbeatGauge({ latency }: { latency: number }) {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => !p)
    }, 800)
    return () => clearInterval(interval)
  }, [])

  const health = latency < 50 ? 'green' : latency < 150 ? 'yellow' : 'red'
  const healthText = {
    green: 'nominal',
    yellow: 'elevated',
    red: 'degraded',
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full transition-opacity ${
            pulse ? 'opacity-100' : 'opacity-30'
          } ${
            health === 'green'
              ? 'bg-green-500'
              : health === 'yellow'
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
        />
        <div className={`text-xs font-bold text-${health}-400`}>
          {healthText[health]}
        </div>
      </div>
      <div className="text-xs text-gray-400">
        latency: <span className="text-white">{latency.toFixed(0)}ms</span>
      </div>
      <div className="w-full bg-gray-900 rounded h-1">
        <div
          className={`h-1 rounded transition-all ${
            health === 'green'
              ? 'bg-green-500'
              : health === 'yellow'
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(latency / 2, 100)}%` }}
        />
      </div>
    </div>
  )
}
