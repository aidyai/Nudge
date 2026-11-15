import { forward, isAllowed } from "@/lib/engine";

export const maxDuration = 60;
const MAX_BODY_BYTES = 4_000_000; // hosting platforms refuse bigger request bodies anyway

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  if (!isAllowed(path)) return Response.json({ detail: "Not found." }, { status: 404 });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return Response.json({ detail: "That upload is too large." }, { status: 413 });
  }
  return forward(request, path);
}
