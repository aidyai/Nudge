"use client";

import { useState } from "react";
import { type Detail, duration, naira, outcome, seconds, summarise } from "@/lib/calls";
import { Icon } from "@/components/icons";

const TABS = [
  { key: "transcript", label: "Conversation" },
  { key: "telemetry", label: "Audits & Speed" },
] as const;

const LONG_DATE = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function CallDetailView({ call }: { call: Detail }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("transcript");
  const o = outcome(call.outcome);
  const replies = call.transcript.filter((t) => t.who === "agent" && t.reply_ms);
  const slowest = Math.max(1.8, ...replies.map((t) => (t.reply_ms ?? 0) / 1000));
  const passed = call.checks.filter((c) => c.allowed).length;
  const amount = call.promise?.amount_ngn ?? call.amount_due_ngn;
  const date = call.promise?.promise_date ? LONG_DATE.format(new Date(`${call.promise.promise_date}T00:00:00Z`)) : "—";

  return (
    <div className="stack" style={{ gap: "24px" }}>
      <section aria-label="Resolution Summary" className="resolution-card">
        <div className="resolution-top-bar">
          <div className="row" style={{ gap: "10px" }}>
            <span className={`chip chip-${o.tone}`}>{o.label}</span>
            <span className="small muted mono">Call ID: {call.id.slice(0, 8)}</span>
          </div>

          <div className="row" style={{ gap: "8px" }}>
            <span className="chip chip-gray">Duration: {duration(call.started_at, call.ended_at)}</span>
            <span className="chip chip-gray">Engine: {call.llm_backend ?? "—"}</span>
          </div>
        </div>

        <div className="resolution-hero-num">{naira(amount)}</div>

        <div className="resolution-meta-grid">
          <div className="meta-field">
            <span className="label">{call.promise ? "Committed Repayment Date" : "Agreed Date"}</span>
            <span className="val">{date}</span>
          </div>

          <div className="meta-field">
            <span className="label">Borrower Record</span>
            <span className="val">
              {call.name} · {call.phone}
            </span>
          </div>

          <div className="meta-field">
            <span className="label">{call.handoff ? "Handed To A Human" : "Dispatched Action"}</span>
            <span className="val" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {call.handoff ? (
                call.handoff.reason.replaceAll("_", " ")
              ) : call.payment_link_sent ? (
                <>
                  <Icon name="check" size={14} />
                  Payment Link Queued
                </>
              ) : (
                "None"
              )}
            </span>
          </div>
        </div>
      </section>

      <div role="tablist" aria-label="Call Sections" className="mobile-segment-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? "segment-btn active" : "segment-btn"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="detail-grid-layout">
        <section aria-label="Verbatim Transcript" className={`detail-panel detail-col-transcript ${tab !== "transcript" ? "mobile-hidden" : ""}`}>
          <div className="panel-header">
            <span className="title">Conversation Transcript</span>
            <span className="small muted mono">{call.transcript.length} Turns Exchanged</span>
          </div>

          <div className="transcript-feed">
            {call.transcript.map((turn, i) => (
              <div key={i} className="turn-entry">
                <div className="turn-meta">
                  <div className="turn-speaker">
                    <span>{turn.who === "agent" ? "Idara (agent)" : `${call.name} (Borrower)`}</span>
                    <span className="turn-tag">{turn.who === "agent" ? "AI AGENT" : "BORROWER"}</span>
                  </div>
                  {turn.reply_ms ? (
                    <span className="small muted mono" style={{ fontSize: "12px" }}>
                      Model reply {seconds(turn.reply_ms)}
                    </span>
                  ) : null}
                </div>
                <div className="turn-text">{turn.text}</div>
              </div>
            ))}
            {call.transcript.length === 0 && <div className="turn-text muted">Nothing was said on this call.</div>}
          </div>
        </section>

        <div className={`stack detail-col-telemetry ${tab !== "telemetry" ? "mobile-hidden" : ""}`} style={{ gap: "24px" }}>
          <section aria-label="Tool Executions" className="detail-panel">
            <div className="panel-header">
              <span className="title">Tool Executions</span>
              <span className="small muted mono">{call.tools.length} calls</span>
            </div>
            <div className="audit-table">
              {call.tools.map((t, i) => (
                <div key={i} className="audit-row">
                  <span className="fn">{t.name}()</span>
                  <span className="small muted mono">{summarise(t.result)}</span>
                </div>
              ))}
              {call.tools.length === 0 && <div className="audit-row small muted">No tools were used.</div>}
            </div>
          </section>

          <section aria-label="Rule Checks" className="detail-panel">
            <div className="panel-header">
              <span className="title">Rule Checks</span>
              <span className={passed === call.checks.length ? "chip chip-green" : "chip chip-amber"}>
                {passed}/{call.checks.length} Passed
              </span>
            </div>
            <div className="compliance-list">
              {call.checks.map((c, i) => (
                <div key={i} className="compliance-row">
                  <span className="check-icon">
                    <Icon name={c.allowed ? "check" : "pause"} size={14} />
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    {c.rule.replaceAll("_", " ").toLowerCase()}: {c.reason.replaceAll("_", " ")}
                  </span>
                </div>
              ))}
              {call.checks.length === 0 && <div className="compliance-row small muted">No rules were checked on this call.</div>}
            </div>
          </section>

          <section aria-label="Model Speed" className="detail-panel">
            <div className="panel-header">
              <span className="title">Model Reply Time</span>
              <span className="small muted mono">the brain only</span>
            </div>
            <div className="latency-container">
              {replies.map((t, i) => {
                const s = (t.reply_ms ?? 0) / 1000;
                return (
                  <div key={i} className="latency-row">
                    <div className="latency-labels">
                      <span className="strong">Reply {i + 1}</span>
                      <span className="mono muted">{s.toFixed(1)}s</span>
                    </div>
                    <div className="latency-track" role="progressbar" aria-valuenow={s} aria-valuemin={0} aria-valuemax={slowest}>
                      <div className="latency-fill" style={{ width: `${Math.min(100, Math.round((s / slowest) * 100))}%` }} />
                    </div>
                  </div>
                );
              })}
              {replies.length === 0 && <div className="latency-row small muted">No timed replies on this call.</div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
