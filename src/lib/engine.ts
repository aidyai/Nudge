// The website never talks to a model. It forwards a few allowed requests to the engine API,
// and adds the API key here, on the server, so the key never reaches the browser.

const ALLOWED = [/^calls$/, /^calls\/[0-9a-f-]{36}\/turns$/, /^speech\/transcribe$/, /^speech\/say$/];

export function isAllowed(path: string): boolean {
  return ALLOWED.some((pattern) => pattern.test(path));
}

type Env = Record<string, string | undefined>;

function reply(detail: string, status: number): Response {
  return Response.json({ detail }, { status });
}

export async function forward(request: Request, path: string, env: Env = process.env, fetchImpl: typeof fetch = fetch): Promise<Response> {
  const base = env.ENGINE_URL?.replace(/\/+$/, "");
  const key = env.ENGINE_API_KEY;
  if (!base || !key) return reply("ENGINE_URL and ENGINE_API_KEY are not set on the server.", 503);

  let upstream: Response;
  try {
    upstream = await fetchImpl(`${base}/${path}`, {
      method: "POST",
      headers: { "X-API-Key": key, "Content-Type": request.headers.get("content-type") ?? "application/json" },
      body: await request.arrayBuffer(),
      cache: "no-store",
      signal: AbortSignal.timeout(55_000),
    });
  } catch {
    return reply("The engine did not answer in time.", 504);
  }

  const headers = new Headers({ "cache-control": "no-store" });
  const type = upstream.headers.get("content-type");
  if (type) headers.set("content-type", type);
  return new Response(upstream.body, { status: upstream.status, headers });
}
