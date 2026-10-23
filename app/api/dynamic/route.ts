import { NextRequest, NextResponse } from "next/server";
import { createCode, redirectUrl } from "@/lib/dynamic-qr";
import { callerFrom } from "@/lib/dynamic-caller";
import { getDynamicStore } from "@/lib/dynamic-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unavailable = () => NextResponse.json({ error: "Dynamic codes aren't set up yet." }, { status: 503 });

/** List my codes. Allowed after Pro lapses (read-only), as long as the cookie still names the customer. */
export async function GET(req: NextRequest) {
  const store = getDynamicStore();
  if (!store) return unavailable();
  const caller = callerFrom(req);
  if (!caller.owner) return NextResponse.json({ pro: false, codes: [] }, { status: 401 });
  const codes = await store.listByOwner(caller.owner);
  return NextResponse.json({
    pro: caller.pro,
    codes: codes.map(({ owner: _o, ...c }) => ({ ...c, url: redirectUrl(c.slug) })),
  });
}

export async function POST(req: NextRequest) {
  const store = getDynamicStore();
  if (!store) return unavailable();
  const body = (await req.json().catch(() => ({}))) as { destination?: unknown; label?: unknown };
  const result = await createCode(store, callerFrom(req), body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  const { owner: _o, ...code } = result.value;
  return NextResponse.json({ code: { ...code, url: redirectUrl(code.slug) } }, { status: 201 });
}
