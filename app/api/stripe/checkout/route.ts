import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: "Stripe non ancora configurato" }, { status: 503 });
}
