/**
 * THE MESH API Routes
 * - POST /api/message — ingest Discord/heartbeat messages
 * - GET /api/decisions — fetch active decision queue
 * - POST /api/decision — create or update decision
 * - GET /api/heartbeat — sync state with Northflank kernel
 */

export type RouteHandler = (req: any, res: any) => Promise<void> | void

const handlers: Record<string, RouteHandler> = {
  // Discord message ingestion
  'POST /message': async (req, res) => {
    const { source, principal, text, metadata } = req.body
    const msg = {
      id: `${principal}-${Date.now()}`,
      source,
      principal,
      text,
      timestamp: Date.now(),
      metadata,
    }
    // Emit to store + broadcast to connected clients
    res.json({ ok: true, message: msg })
  },

  // Decision queue fetch
  'GET /decisions': async (req, res) => {
    // Return active + pending decisions sorted by consolidation window
    res.json({
      decisions: [],
      nextWindow: null,
    })
  },

  // Decision create/update
  'POST /decision': async (req, res) => {
    const { principal, question, state, consolidationWindow } = req.body
    const decision = {
      id: `decision-${Date.now()}`,
      principal,
      question,
      state: state || 'pending',
      timestamp: Date.now(),
      consolidationWindow,
      input: [],
      output: [],
    }
    res.json({ ok: true, decision })
  },

  // Heartbeat pulse + latency measurement
  'GET /heartbeat': async (req, res) => {
    res.json({
      timestamp: Date.now(),
      kernel_status: 'green',
      channels: {
        supermemory: 'ok',
        affect: 'ok',
        dream: 'idle',
        somatic: 'ok',
        qualia: 'idle',
      },
      latency: Math.random() * 50, // ms
    })
  },
}

export default handlers
