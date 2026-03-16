import React from 'react'
import { Decision } from '../lib/state'

const stateColor = {
  pending: 'text-yellow-400',
  active: 'text-blue-400',
  resolved: 'text-green-400',
  archived: 'text-gray-600',
}

export default function DecisionQueue({ decisions }: { decisions: Decision[] }) {
  const active = decisions.filter((d) => d.state === 'active' || d.state === 'pending')

  return (
    <div className="space-y-3">
      {active.length === 0 ? (
        <div className="text-gray-600 text-xs">no active decisions</div>
      ) : (
        active.map((decision) => (
          <div key={decision.id} className="border-l border-blue-500 pl-2 py-1">
            <div className="flex justify-between items-start">
              <div className="text-xs font-bold">{decision.principal}</div>
              <div className={`text-xs ${stateColor[decision.state]}`}>
                {decision.state}
              </div>
            </div>
            <div className="text-xs mt-1 text-gray-300">
              {decision.question}
            </div>
            {decision.consolidationWindow && (
              <div className="text-xs text-gray-500 mt-2">
                window: {Math.round(
                  (decision.consolidationWindow.endMs - Date.now()) / 1000
                )}s
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
