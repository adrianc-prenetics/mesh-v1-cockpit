import React, { useEffect, useState } from 'react'
import { useMeshStore } from '../lib/state'
import MessageStream from '../components/MessageStream'
import DecisionQueue from '../components/DecisionQueue'
import HeartbeatGauge from '../components/HeartbeatGauge'

export default function Cockpit() {
  const { messages, decisions, heartbeat } = useMeshStore()
  const [wsConnected, setWsConnected] = useState(false)

  useEffect(() => {
    // Connect to Northflank kernel via WebSocket
    const ws = new WebSocket(process.env.NEXT_PUBLIC_MESH_API || 'ws://localhost:8080')
    
    ws.onopen = () => setWsConnected(true)
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'message') useMeshStore.getState().addMessage(data.payload)
      if (data.type === 'decision') useMeshStore.getState().addDecision(data.payload)
    }
    ws.onclose = () => setWsConnected(false)

    return () => ws.close()
  }, [])

  return (
    <div className="h-screen bg-black text-white p-6 grid grid-cols-3 gap-6 font-mono">
      {/* Status header */}
      <div className="col-span-3 flex justify-between items-center mb-6 border-b border-green-500 pb-4">
        <div className="text-2xl font-bold">
          THE MESH V1 <span className="text-green-500">●</span>
        </div>
        <div className="text-sm">
          {wsConnected ? '🟢 kernel live' : '🔴 disconnected'}
        </div>
      </div>

      {/* Left: Message stream */}
      <div className="col-span-1 border border-green-500 rounded p-4 bg-gray-950 overflow-y-auto max-h-[calc(100vh-120px)]">
        <div className="text-xs uppercase tracking-widest text-green-400 mb-4">
          Discord/Heartbeat
        </div>
        <MessageStream messages={messages} />
      </div>

      {/* Center: Decision queue */}
      <div className="col-span-1 border border-green-500 rounded p-4 bg-gray-950 overflow-y-auto max-h-[calc(100vh-120px)]">
        <div className="text-xs uppercase tracking-widest text-green-400 mb-4">
          Decision Queue
        </div>
        <DecisionQueue decisions={decisions} />
      </div>

      {/* Right: Heartbeat + Metrics */}
      <div className="col-span-1 border border-green-500 rounded p-4 bg-gray-950 flex flex-col gap-4">
        <div className="text-xs uppercase tracking-widest text-green-400">
          Kernel Status
        </div>
        <HeartbeatGauge latency={heartbeat.latency} />
        <div className="text-xs mt-4">
          <div>messages: {messages.length}</div>
          <div>decisions: {decisions.length}</div>
          <div>last sync: {new Date(heartbeat.lastSync).toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  )
}
