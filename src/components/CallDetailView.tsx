"use client";

import { useState } from "react";
import { CHECKS, TOOLS, TRANSCRIPT, TURN_TIMES } from "@/lib/sample";

const TABS = [
  { key: "transcript", label: "Transcript" },
  { key: "tools", label: "Tools and checks" },
  { key: "speed", label: "Speed" },
] as const;

/** On a desktop everything is visible side by side. On a phone the right-hand cards sit behind tabs. */
export function CallDetailView() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("transcript");
  const show = (key: string) => (tab === key ? "pane shown" : "pane");
  return (
    <>
      <section aria-label="Outcome" className="panel outcome">
        <span className="muted small">Saved after the borrower said yes</span>
        <span className="strong">Promise to pay ₦25,000 by Friday, 13 November</span>
        <span className="muted small">Payment link sent by text</span>
      </section>

      <div role="group" aria-label="Call sections" className="tabs">
        {TABS.map((t) => (
          <button key={t.key} type="button" aria-pressed={tab === t.key} className={tab === t.key ? "tab active" : "tab"} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="detail-grid">
        <section aria-label="Transcript" className={`panel transcript ${show("transcript")}`}>
          <h2>Transcript</h2>
          {TRANSCRIPT.map((turn, i) => (
            <div key={i} className={turn.who === "agent" ? "bubble-row" : "bubble-row right"}>
              <div className={turn.who === "agent" ? "bubble agent" : "bubble caller"}>
                <span className="muted small">{turn.who === "agent" ? "Agent" : "Musa Bello"}</span>
                <span>{turn.text}</span>
                {turn.note ? <span className="muted small">{turn.note}</span> : null}
              </div>
            </div>
          ))}
        </section>

        <div className="side-panels">
          <section aria-label="Tool calls" className={`panel ${show("tools")}`}>
            <h2>Tool calls</h2>
            {TOOLS.map(([name, result]) => (
              <div key={name} className="kv">
                <span className="mono">{name}</span>
                <span className="muted">{result}</span>
              </div>
            ))}
          </section>
          <section aria-label="Policy checks" className={`panel ${show("tools")}`}>
            <h2>Policy checks <span className="muted small">4 passed · 0 denied</span></h2>
            {CHECKS.map((text) => (
              <p key={text} className="check"><span aria-hidden="true" className="tick">✓</span><span><strong>Passed:</strong> {text}</span></p>
            ))}
          </section>
          <section aria-label="Reply time per turn" className={`panel ${show("speed")}`}>
            <h2>Reply time per turn <span className="muted small">Target 1.5 s or less</span></h2>
            <div className="bars">
              {TURN_TIMES.map((t) => (
                <div key={t.label} className="bar-col">
                  <span className="muted small">{t.seconds.toFixed(1)} s</span>
                  <div className="bar" style={{ height: `${Math.round((t.seconds / 1.6) * 80)}px` }} />
                  <span className="muted small">{t.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
