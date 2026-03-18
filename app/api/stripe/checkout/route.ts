import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  return NextResponse.json({ error: "Stripe non configurato" }, { status: 503 });
}
