import { NextResponse } from "next/server";

// Stub: in production this would forward the resume command to the
// Discord bridge so the target agent continues its paused task.

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { taskId } = body as { taskId?: string };

  if (!taskId) {
    return NextResponse.json(
      { error: "taskId is required" },
      { status: 400 },
    );
  }

  console.log(`[resume] taskId=${taskId}`);

  return NextResponse.json({ ok: true, taskId });
}
