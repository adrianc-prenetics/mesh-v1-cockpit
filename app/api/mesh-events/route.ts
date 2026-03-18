export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial comment so the client knows the connection is live
      controller.enqueue(encoder.encode(": connected to mesh-events\n\n"));

      // Heartbeat every 15 s to keep the connection alive through proxies
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      // Stub: in production this would forward real-time events from the
      // Discord bridge / mesh executor via a pub-sub channel. For now
      // only the heartbeat keeps the stream open.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
