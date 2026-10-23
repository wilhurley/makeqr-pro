import { NextRequest, NextResponse } from "next/server";
import { redirectUrl, updateCode } from "@/lib/dynamic-qr";
import { callerFrom } from "@/lib/dynamic-caller";
import { getDynamicStore } from "@/lib/dynamic-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const store = getDynamicStore();
  if (!store) return NextResponse.json({ error: "Dynamic codes aren't set up yet." }, { status: 503 });
  const { slug } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { destination?: unknown; label?: unknown };
  const result = await updateCode(store, callerFrom(req), slug, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  const { owner: _o, ...code } = result.value;
  return NextResponse.json({ code: { ...code, url: redirectUrl(code.slug) } });
}
