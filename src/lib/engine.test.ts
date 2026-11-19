import { forward, isAllowed, load } from "@/lib/engine";

const ENV = { ENGINE_URL: "https://engine.example.run/", ENGINE_API_KEY: "secret-key" };
const CALL_ID = "0b0f9f0e-6d6e-4a3b-9d27-3f5f2b1d9a10";
const post = (body: string, type = "application/json") => new Request("https://site.test/api/x", { method: "POST", headers: { "content-type": type }, body });

describe("which paths may be forwarded", () => {
  it("allows the four the demo needs", () => {
    for (const path of ["calls", `calls/${CALL_ID}/turns`, "speech/transcribe", "speech/say", "realtime/tickets", "borrowers"]) expect(isAllowed(path)).toBe(true);
  });

  it("refuses everything else", () => {
    for (const path of ["", "health", "phone/calls", "calls/../phone/calls", `calls/${CALL_ID}`, `calls/${CALL_ID}/turns/extra`, "calls/not-a-uuid/turns", "speech"]) {
      expect(isAllowed(path)).toBe(false);
    }
  });
});

describe("forwarding to the engine", () => {
  it("adds the key on the server and passes the answer back", async () => {
    const fetchMock = jest.fn().mockResolvedValue(new Response('{"reply":"Hello."}', { status: 200, headers: { "content-type": "application/json", "set-cookie": "leak=1" } }));
    const response = await forward(post('{"text":"hi"}'), "calls", ENV, fetchMock);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://engine.example.run/calls");
    expect((init.headers as Record<string, string>)["X-API-Key"]).toBe("secret-key");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ reply: "Hello." });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("passes audio through with its content type", async () => {
    const fetchMock = jest.fn().mockResolvedValue(new Response("RIFF", { headers: { "content-type": "audio/wav" } }));
    const response = await forward(post("abc", "audio/webm"), "speech/transcribe", ENV, fetchMock);
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).headers).toMatchObject({ "Content-Type": "audio/webm" });
    expect(response.headers.get("content-type")).toBe("audio/wav");
  });

  it("passes the engine's errors through unchanged", async () => {
    const fetchMock = jest.fn().mockResolvedValue(Response.json({ detail: "the model is waking up" }, { status: 503 }));
    const response = await forward(post("{}"), "calls", ENV, fetchMock);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ detail: "the model is waking up" });
  });

  it("says so when the engine does not answer", async () => {
    const response = await forward(post("{}"), "calls", ENV, jest.fn().mockRejectedValue(new Error("down")));
    expect(response.status).toBe(504);
  });

  it("says which settings are missing, and calls nothing", async () => {
    const fetchMock = jest.fn();
    const response = await forward(post("{}"), "calls", {}, fetchMock);
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never lets the key into the reply", async () => {
    const response = await forward(post("{}"), "calls", ENV, jest.fn().mockResolvedValue(new Response("ok")));
    expect(JSON.stringify([...response.headers])).not.toContain("secret-key");
  });
});

describe("reading the dashboard data", () => {
  it("adds the key and returns the data", async () => {
    const fetchMock = jest.fn().mockResolvedValue(Response.json({ calls: [] }));
    expect(await load("calls", ENV, fetchMock)).toEqual({ data: { calls: [] } });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://engine.example.run/calls");
    expect((init.headers as Record<string, string>)["X-API-Key"]).toBe("secret-key");
  });

  it("keeps the status so a missing call can be a 404 page", async () => {
    const result = await load("calls/x", ENV, jest.fn().mockResolvedValue(Response.json({}, { status: 404 })));
    expect(result).toMatchObject({ status: 404 });
  });

  it("says so when the engine is down or not set up", async () => {
    expect(await load("calls", ENV, jest.fn().mockRejectedValue(new Error("down")))).toMatchObject({ status: 504 });
    expect(await load("calls", {}, jest.fn())).toMatchObject({ status: 503 });
  });
});
