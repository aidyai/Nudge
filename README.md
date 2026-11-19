# nudge-finance

The website for nudge-finance, a voice agent that phones borrowers before a loan payment is due. It has a dashboard and a page where a company types in who to call and then takes the call from the browser.

The agent itself lives in the `nudge-engine` repo. This site only talks to that engine's API.

![Architecture](docs/architecture.svg)

## Pages

- `/` Calls: every call the agent has made, read from the database, with totals and filters.
- `/calls/<id>` Call detail: the transcript, tool calls, rule checks and model reply times of one call, read from the database.
- `/demo` New call: type the company, the person and the loan (a spreadsheet upload is shown but not built), then take the call with the real agent. It shows up on the Calls page straight away.
- `/follow-ups` and `/health`: placeholders.

On a phone the menu is one icon at the top right that opens a popup. On a desktop it is a sidebar.

## Run it on your machine

You need Node 22.

```
npm install
cp .env.example .env.local     # set ENGINE_URL and ENGINE_API_KEY
npm run dev
```

Open http://localhost:3000. The dashboard pages work on their own. The demo page needs the engine.

To talk to the agent from your browser:
1. Wake the models on Modal (the `SETUP` cell in the engine's Colab notebook). They take about 10 minutes.
2. In `.env.local` set `ENGINE_URL` to the engine API address (`API_URL` in the engine's `.env`) and `ENGINE_API_KEY` to its `API_KEY`.
3. Open http://localhost:3000/demo, fill in the form (or press Fill an example), press Start call, allow the microphone, and talk. Tap the pills to interrupt. There is nothing to press: it hears when you stop.
4. When you finish, run the `STOP` cell, or the models keep billing.

The Calls pages only read the database, so they work even when the models are asleep. Running the engine's evals resets the database and clears this list.

If the models are asleep, the demo shows "The engine did not answer in time". Wait and try again.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel choose Add New, Project, and pick the repo. It is a Next.js app, so the defaults are right.
3. Add two environment variables: `ENGINE_URL` (the address of your deployed engine API) and `ENGINE_API_KEY`.
4. Deploy. Every push to `main` redeploys.

## How it works

It is a Next.js App Router app in TypeScript. The pages are in `src/app`.

One server route, `src/app/api/[...path]/route.ts`, forwards a few requests to the engine (ask for a live-call ticket, and for the classic call: start a call, send a turn, turn speech into text, turn text into speech) and adds the API key on the server. It refuses anything else. The browser never sees the key.

The demo page is a live call. The page asks the engine for a ticket (through that route, so the key stays on the server), then opens a websocket straight to the engine and streams the microphone (`public/pcm-worklet.js`, `src/lib/use-live-call.ts`). The engine does the listening and turn-taking (Silero and smart-turn-v3 in a Pipecat pipeline) and streams its voice back, so there is nothing to press and you can talk over the agent. The four pills move with your voice and with the agent's, and shows Thinking while the models work.

If the live connection cannot start, the page falls back to the classic call (`src/components/ClassicCall.tsx`): the browser listens for you to stop (`src/lib/vad.ts`, a loudness check, no model) and sends one recording per sentence. It is slower, and it needs only plain HTTP.

## Checks

```
npm run lint
npm test
npm run build
npm run typecheck
```

## Not done yet

- A login. Anyone with the URL can start a demo call, and that can start a GPU on Modal. Turn on Vercel's deployment protection, or keep the URL private.
- Backchannels (a spoken "mm-hm" should not interrupt the agent) and a voice that streams. Both are in the engine's to-do list.
