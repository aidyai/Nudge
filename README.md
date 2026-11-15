# nudge

The website for Nudge, a voice agent that phones borrowers before a loan payment is due. It has a dashboard and a demo page where you can talk to the agent from your browser.

The agent itself lives in the `nudge-engine` repo. This site only talks to that engine's API.

![Architecture](docs/architecture.svg)

## Pages

- `/` Calls: recent calls. Sample data for now.
- `/calls/B001` Call detail: transcript, tool calls, rule checks and reply times. Sample data for now.
- `/demo` Demo call: start a call with the real agent and talk to it.
- `/follow-ups` and `/health`: placeholders.

On a phone the menu is one icon at the top right that opens a popup. On a desktop it is a sidebar.

## Run it on your machine

You need Node 22.

```
npm install
cp .env.example .env.local     # set ENGINE_URL and ENGINE_API_KEY
npm run dev
```

Open http://localhost:3000. The dashboard pages work on their own. The demo page needs the engine, either running locally (see the engine's README) or the one deployed on Modal.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel choose Add New, Project, and pick the repo. It is a Next.js app, so the defaults are right.
3. Add two environment variables: `ENGINE_URL` (the address of your deployed engine API) and `ENGINE_API_KEY`.
4. Deploy. Every push to `main` redeploys.

## How it works

It is a Next.js App Router app in TypeScript. The pages are in `src/app`.

One server route, `src/app/api/[...path]/route.ts`, forwards four requests to the engine (start a call, send a turn, turn speech into text, turn text into speech) and adds the API key on the server. It refuses anything else. The browser never sees the key.

On the demo page you press Record, speak, and press Stop. The recording goes to the engine to become text, the text goes to the agent, and the engine speaks the reply back. It is turn by turn, not a live call.

## Checks

```
npm run lint
npm test
npm run build
npm run typecheck
```

## Not done yet

- Real calls on the dashboard. It shows sample data.
- A login. Anyone with the URL can start a demo call, and that can start a GPU on Modal. Turn on Vercel's deployment protection, or keep the URL private.
- A live, hands-free call in the browser.
