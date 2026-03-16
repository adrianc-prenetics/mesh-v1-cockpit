import React from 'react'
import { Message } from '../lib/state'

const principalColor = {
  adrian: 'text-blue-400',
  kev: 'text-green-400',
  claude: 'text-purple-400',
}

export default function MessageStream({ messages }: { messages: Message[] }) {
  return (
    <div className="space-y-2">
      {messages.length === 0 ? (
        <div className="text-gray-600 text-xs">waiting for signal...</div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className="border-l border-gray-700 pl-2 py-1 text-xs">
            <div className={`font-bold ${principalColor[msg.principal]}`}>
              {msg.principal}
            </div>
            <div className="text-gray-300 break-words text-xs mt-1">
              {msg.text}
            </div>
            <div className="text-gray-600 text-xs mt-1">
              {new Date(msg.timestamp).toLocaleTimeString()} · {msg.source}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
