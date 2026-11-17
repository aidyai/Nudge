"use client";

import { useState } from "react";
import { CHECKS, TOOLS, TRANSCRIPT, TURN_TIMES } from "@/lib/sample";
import { Icon } from "@/components/icons";

const TABS = [
  { key: "transcript", label: "Conversation" },
  { key: "tools", label: "Audit Trace" },
  { key: "speed", label: "Latency SLA" },
] as const;

export function CallDetailView() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("transcript");

  return (
    <div className="stack" style={{ gap: "24px" }}>
      {/* 1. Structured Resolution Card (Linear Issue Hero Pattern) */}
      <section aria-label="Resolution Summary" className="resolution-card">
        <div className="resolution-top-bar">
          <div className="row" style={{ gap: "10px" }}>
            <span className="chip chip-green">Promise to Pay Captured</span>
            <span className="small muted mono">Call ID: B001</span>
          </div>

          <div className="row" style={{ gap: "8px" }}>
            <span className="chip chip-gray">Duration: 2m 05s</span>
            <span className="chip chip-gray">Model: Modal</span>
          </div>
        </div>

        <div className="resolution-hero-num">₦25,000</div>

        <div className="resolution-meta-grid">
          <div className="meta-field">
            <span className="label">Committed Repayment Date</span>
            <span className="val">Friday, 13 November 2026</span>
          </div>

          <div className="meta-field">
            <span className="label">Borrower Record</span>
            <span className="val">Musa Bello · +234 802 ••• 4491</span>
          </div>

          <div className="meta-field">
            <span className="label">Dispatched Action</span>
            <span className="val" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon name="check" size={14} />
              SMS Payment Link Sent
            </span>
          </div>
        </div>
      </section>

      {/* Mobile Tab Segment Selector */}
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

      {/* 2. Structured Two-Column Detail Grid */}
      <div className="detail-grid-layout">
        {/* Left Column: Structured Transcript Feed */}
        <section
          aria-label="Verbatim Transcript"
          className="detail-panel"
          style={{ display: tab === "transcript" ? "block" : undefined }}
        >
          <div className="panel-header">
            <span className="title">Conversation Transcript</span>
            <span className="small muted mono">{TRANSCRIPT.length} Turns Exchanged</span>
          </div>

          <div className="transcript-feed">
            {TRANSCRIPT.map((turn, i) => (
              <div key={i} className="turn-entry">
                <div className="turn-meta">
                  <div className="turn-speaker">
                    <span>{turn.who === "agent" ? "Nudge Agent" : "Musa Bello (Borrower)"}</span>
                    <span className="turn-tag">{turn.who === "agent" ? "AI AGENT" : "BORROWER"}</span>
                  </div>
                  {turn.note && (
                    <span className="small muted mono" style={{ fontSize: "12px" }}>
                      {turn.note}
                    </span>
                  )}
                </div>
                <div className="turn-text">{turn.text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Structured Telemetry & Compliance Sidebar */}
        <div
          className="stack"
          style={{
            gap: "24px",
            display: tab !== "transcript" ? "flex" : undefined,
          }}
        >
          {/* Panel 1: Deterministic Engine Invocations */}
          {(tab === "tools" || typeof window === "undefined") && (
            <section aria-label="Tool Executions" className="detail-panel">
              <div className="panel-header">
                <span className="title">Tool Executions</span>
                <span className="small muted mono">Deterministic</span>
              </div>
              <div className="audit-table">
                {TOOLS.map(([name, result]) => (
                  <div key={name} className="audit-row">
                    <span className="fn">{name}()</span>
                    <span className="small muted mono">{result}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Panel 2: Policy Compliance Verification */}
          {(tab === "tools" || typeof window === "undefined") && (
            <section aria-label="Policy Compliance" className="detail-panel">
              <div className="panel-header">
                <span className="title">Compliance Verification</span>
                <span className="chip chip-green">4/4 Passed</span>
              </div>
              <div className="compliance-list">
                {CHECKS.map((text) => (
                  <div key={text} className="compliance-row">
                    <span className="check-icon">
                      <Icon name="check" size={14} />
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>{text}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Panel 3: Latency SLA Telemetry */}
          {(tab === "speed" || typeof window === "undefined") && (
            <section aria-label="Latency SLA Tracking" className="detail-panel">
              <div className="panel-header">
                <span className="title">Response Speed (SLA)</span>
                <span className="small muted mono">Target &le; 1.5s</span>
              </div>
              <div className="latency-container">
                {TURN_TIMES.map((t) => {
                  const pct = Math.min(100, Math.round((t.seconds / 1.8) * 100));
                  return (
                    <div key={t.label} className="latency-row">
                      <div className="latency-labels">
                        <span className="strong">{t.label}</span>
                        <span className="mono muted">{t.seconds.toFixed(1)}s</span>
                      </div>
                      <div className="latency-track" role="progressbar" aria-valuenow={t.seconds} aria-valuemin={0} aria-valuemax={1.8}>
                        <div className="latency-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
