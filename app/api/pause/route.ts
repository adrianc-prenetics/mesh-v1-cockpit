import { NextResponse } from "next/server";

// Stub: in production this would forward the pause command to the
// Discord bridge so the target agent halts its current task.

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { taskId, source } = body as { taskId?: string; source?: string };

  if (!taskId) {
    return NextResponse.json(
      { error: "taskId is required" },
      { status: 400 },
    );
  }

  console.log(`[pause] taskId=${taskId} source=${source ?? "unknown"}`);

  return NextResponse.json({ ok: true, taskId });
}
