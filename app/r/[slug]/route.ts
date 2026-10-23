import { NextRequest, NextResponse } from "next/server";
import { resolveRedirect } from "@/lib/dynamic-qr";
import { getDynamicStore } from "@/lib/dynamic-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" };

/** Public redirect for dynamic codes. Works whether or not the owner still has Pro. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const store = getDynamicStore();
  let target: string | null = null;
  try {
    target = store ? await resolveRedirect(store, slug) : null;
  } catch (err) {
    console.error("dynamic redirect failed", err instanceof Error ? err.message : "unknown");
    return new NextResponse("This code is temporarily unavailable. Please try again in a minute.", { status: 503, headers: NO_STORE });
  }
  if (!target) {
    return new NextResponse("This QR code isn't active. If you printed it, check with whoever made it.", {
      status: 404,
      headers: { ...NO_STORE, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  // 302, not 301: browsers and Cloudflare must not cache the destination.
  return NextResponse.redirect(target, { status: 302, headers: NO_STORE });
}
