import { NextResponse } from "next/server";
import { createStrategyReport } from "@/lib/report";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const report = await createStrategyReport(isRecord(payload) ? payload : {});
    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to generate strategy report."
      },
      { status: 500 }
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
