import { NextResponse } from "next/server";
import { z } from "zod";
import { generateContentPlan } from "@/lib/domain/planner";

const requestSchema = z.object({
  channelId: z.string().min(1),
  focus: z.string().min(2),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  return NextResponse.json(generateContentPlan(parsed.data));
}
