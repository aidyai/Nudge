// The website never talks to a model. It forwards a few allowed requests to the engine API,
// and adds the API key here, on the server, so the key never reaches the browser.

const ALLOWED = [/^calls$/, /^calls\/[0-9a-f-]{36}\/turns$/, /^speech\/transcribe$/, /^speech\/say$/, /^realtime\/tickets$/, /^borrowers$/];

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
    return reply("The engine did not answer in time. If the models were asleep they need about 10 minutes to wake. Try again in a minute.", 504);
  }

  const headers = new Headers({ "cache-control": "no-store" });
  const type = upstream.headers.get("content-type");
  if (type) headers.set("content-type", type);
  return new Response(upstream.body, { status: upstream.status, headers });
}

// For the dashboard pages, which run on the server: read something from the engine.
export async function load<T>(path: string, env: Env = process.env, fetchImpl: typeof fetch = fetch): Promise<{ data: T } | { error: string; status: number }> {
  const base = env.ENGINE_URL?.replace(/\/+$/, "");
  const key = env.ENGINE_API_KEY;
  if (!base || !key) return { error: "ENGINE_URL and ENGINE_API_KEY are not set on the server.", status: 503 };
  try {
    const r = await fetchImpl(`${base}/${path}`, { headers: { "X-API-Key": key }, cache: "no-store", signal: AbortSignal.timeout(30_000) });
    if (!r.ok) return { error: `The engine answered HTTP ${r.status}.`, status: r.status };
    return { data: (await r.json()) as T };
  } catch {
    return { error: "The engine did not answer. It may be starting up. Try again in a minute.", status: 504 };
  }
}
