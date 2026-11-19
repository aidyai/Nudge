"use client";

import { useEffect, useRef, useState } from "react";
import { COLUMNS, EMPTY, MONTHS, PRESETS, daysIn, greeting, toPayload, validate, type Form, type Problems } from "@/lib/setup";
import { Icon } from "@/components/icons";

type Step = "profile" | "terms" | "review";
const STEPS: Step[] = ["profile", "terms", "review"];

const STEP_LABELS: Record<Step, { num: string; label: string }> = {
  profile: { num: "01", label: "Borrower Profile" },
  terms: { num: "02", label: "Verification & Terms" },
  review: { num: "03", label: "Review & Launch" },
};

async function save(form: Form): Promise<string> {
  const response = await fetch("/api/borrowers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toPayload(form)),
  });
  if (!response.ok) {
    let detail: unknown;
    try {
      detail = (await response.json()).detail;
    } catch {
      // not JSON
    }
    throw new Error(typeof detail === "string" && detail ? detail : `Could not save the details (HTTP ${response.status}).`);
  }
  return ((await response.json()) as { borrower_id: string }).borrower_id;
}

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export function CallSetup({ onReady }: { onReady: (borrowerId: string) => void }) {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [step, setStep] = useState<Step>("profile");
  const [form, setForm] = useState<Form>(PRESETS[0]?.form ?? EMPTY);
  const [problems, setProblems] = useState<Problems>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstInput = useRef<HTMLInputElement>(null);

  const currentIdx = STEPS.indexOf(step);

  useEffect(() => {
    firstInput.current?.focus();
  }, [step]);

  const setField = (key: keyof Form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setProblems((p) => ({ ...p, [key]: undefined }));
  };

  const loadPreset = (preset: (typeof PRESETS)[number]) => {
    setForm(preset.form);
    setProblems({});
    setError(null);
  };

  function validateStep(s: Step): boolean {
    const all = validate(form);
    const subset: Problems = {};
    if (s === "profile") {
      if (all.company) subset.company = all.company;
      if (all.fullName) subset.fullName = all.fullName;
      if (all.phone) subset.phone = all.phone;
    } else if (s === "terms") {
      if (all.birthMonth) subset.birthMonth = all.birthMonth;
      if (all.birthDay) subset.birthDay = all.birthDay;
      if (all.amount) subset.amount = all.amount;
      if (all.dueDate) subset.dueDate = all.dueDate;
    }
    setProblems(subset);
    return Object.keys(subset).length === 0;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    if (step === "profile") setStep("terms");
    else if (step === "terms") setStep("review");
  }

  function handleBack() {
    setError(null);
    if (step === "review") setStep("terms");
    else if (step === "terms") setStep("profile");
  }

  async function handleFinish() {
    const all = validate(form);
    setProblems(all);
    if (Object.keys(all).length > 0) {
      if (all.company || all.fullName || all.phone) setStep("profile");
      else setStep("terms");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const id = await save(form);
      onReady(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the server.");
      setSaving(false);
    }
  }

  const downloadSampleCSV = () => {
    const header = COLUMNS.map((c) => c.name).join(",");
    const sampleRow1 = "Acme Microfinance,Ada Obi,+2348030000000,14,3,25000,2026-11-21";
    const sampleRow2 = "FairMoney,Chidi Okafor,+2348021112233,22,7,85000,2026-11-25";
    const csvContent = "data:text/csv;charset=utf-8," + [header, sampleRow1, sampleRow2].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "borrowers_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthNum = Number(form.birthMonth) || 1;
  const maxDays = daysIn(monthNum);

  return (
    <div className="onboard-container">
      {/* Mode Switcher */}
      <div className="onboard-mode-bar">
        <div className="mode-toggle" role="tablist" aria-label="Dispatch Mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "single"}
            className={mode === "single" ? "mode-tab active" : "mode-tab"}
            onClick={() => setMode("single")}
          >
            Interactive Simulation
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "batch"}
            className={mode === "batch" ? "mode-tab active" : "mode-tab"}
            onClick={() => setMode("batch")}
          >
            Batch Campaign (CSV)
          </button>
        </div>

        {mode === "single" && (
          <div className="preset-shortcuts">
            <span className="caption">Quick Pre-fill:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                className="preset-pill"
                onClick={() => loadPreset(p)}
                title={`Load ${p.name} (${p.company})`}
              >
                {p.name} · {p.badge}
              </button>
            ))}
          </div>
        )}
      </div>

      {mode === "batch" ? (
        <section aria-label="Batch CSV Campaign" className="onboard-card card-tactile">
          <div className="card-inner stack" style={{ gap: "20px" }}>
            <div className="stack" style={{ gap: "6px" }}>
              <span className="caption">Automated Outbound Pipeline</span>
              <h2 className="step-title">Batch Campaign Ingestion</h2>
              <p className="step-desc">
                Add many borrowers at once from a CSV or Excel file. This is shown for planning and is not built yet.
              </p>
            </div>

            <div className="batch-schema-panel">
              <div className="schema-head">
                <span className="strong">Required CSV Columns</span>
                <button type="button" className="secondary-btn" onClick={downloadSampleCSV}>
                  <Icon name="check" size={13} /> Download Template (.csv)
                </button>
              </div>
              <div className="schema-chips">
                {COLUMNS.map((col) => (
                  <span key={col.name} className="schema-chip">
                    <code>{col.name}</code>
                    <span className="schema-chip-format">{col.format}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="batch-dropzone">
              <Icon name="grid" size={24} />
              <div className="stack" style={{ gap: "4px", alignItems: "center" }}>
                <span className="strong">Drop your borrowers file here</span>
                <span className="small muted">Accepts .csv, .xlsx up to 50MB</span>
              </div>
              <button type="button" className="secondary-btn" onClick={() => alert("Upload simulation: Template ready. Switch to Interactive Simulation to test voice engine now.")}>
                Select Local File
              </button>
            </div>

            <div className="onboard-actions" style={{ borderTop: "1px solid var(--border)", paddingTop: "18px" }}>
              <span className="small muted">Ready to test voice quality?</span>
              <button type="button" className="primary-btn" onClick={() => setMode("single")}>
                Return to Single Call Simulation
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section aria-label="New Call Setup" className="onboard-card fx fx-dots-b">
          {/* 3-Stage Linear Progress Stepper */}
          <div className="stepper-header">
            {STEPS.map((s, idx) => {
              const info = STEP_LABELS[s];
              const isActive = s === step;
              const isDone = idx < currentIdx;
              return (
                <button
                  key={s}
                  type="button"
                  className={`stepper-node ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
                  onClick={() => {
                    if (isDone || (idx === currentIdx + 1 && validateStep(step))) {
                      setStep(s);
                    }
                  }}
                  disabled={idx > currentIdx + 1}
                >
                  <span className="step-num">{info.num}</span>
                  <span className="step-label">{info.label}</span>
                </button>
              );
            })}
          </div>

          <div className="card-inner">
            {/* STAGE 1: Profile */}
            {step === "profile" && (
              <div className="step-pane stack" style={{ gap: "22px" }}>
                <div className="stack" style={{ gap: "4px" }}>
                  <span className="caption">Step 01 / 03</span>
                  <h2 className="step-title">Lending Entity & Borrower Profile</h2>
                  <p className="step-desc">
                    Specify the lending institution name and borrower contact. Idara states the institution in her introductory verification prompt.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="input-company">
                    Lending Institution Name
                  </label>
                  <input
                    ref={firstInput}
                    id="input-company"
                    className="linear-input"
                    value={form.company}
                    onChange={(e) => setField("company", e.target.value)}
                    placeholder="e.g. Acme Microfinance or FairMoney"
                    autoComplete="off"
                  />
                  {problems.company ? <span className="field-error">{problems.company}</span> : <span className="field-hint">The institution Idara speaks on behalf of.</span>}
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="input-name">
                      Borrower Full Name
                    </label>
                    <input
                      id="input-name"
                      className="linear-input"
                      value={form.fullName}
                      onChange={(e) => setField("fullName", e.target.value)}
                      placeholder="e.g. Ada Obi"
                      autoComplete="off"
                    />
                    {problems.fullName && <span className="field-error">{problems.fullName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="input-phone">
                      Borrower Mobile (International Format)
                    </label>
                    <input
                      id="input-phone"
                      className="linear-input"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      placeholder="+234 803 000 0000"
                      inputMode="tel"
                      autoComplete="off"
                    />
                    {problems.phone ? <span className="field-error">{problems.phone}</span> : <span className="field-hint">Simulation runs in browser WebRTC.</span>}
                  </div>
                </div>

                <div className="callout-box">
                  <span className="strong">Browser Audio Simulation</span>
                  <p className="small muted" style={{ marginTop: "2px" }}>
                    No cellular network charges or actual telephone calls are initiated. You will act as the borrower directly via your browser microphone.
                  </p>
                </div>

                <div className="onboard-actions">
                  <span className="spacer" />
                  <button type="button" className="primary-btn" onClick={handleNext}>
                    Continue to Verification & Terms
                    <Icon name="check" size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: Terms & Verification */}
            {step === "terms" && (
              <div className="step-pane stack" style={{ gap: "22px" }}>
                <div className="stack" style={{ gap: "4px" }}>
                  <span className="caption">Step 02 / 03</span>
                  <h2 className="step-title">Identity Verification Check & Loan Terms</h2>
                  <p className="step-desc">
                    Idara checks the birthday before she says any amount. This is a rule in the agent, enforced by code.
                  </p>
                </div>

                <div className="form-group">
                  <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <label className="form-label">Borrower Date of Birth (Security Question)</label>
                    <span className="caption">Identity check</span>
                  </div>
                  <div className="form-row-2">
                    <div>
                      <select
                        className="linear-select"
                        value={form.birthMonth}
                        onChange={(e) => {
                          const m = e.target.value;
                          setField("birthMonth", m);
                          if (Number(form.birthDay) > daysIn(Number(m))) {
                            setField("birthDay", "");
                          }
                        }}
                        aria-label="Birth Month"
                      >
                        <option value="">Select Month</option>
                        {MONTHS.map((m, i) => (
                          <option key={m} value={String(i + 1)}>
                            {m}
                          </option>
                        ))}
                      </select>
                      {problems.birthMonth && <span className="field-error">{problems.birthMonth}</span>}
                    </div>

                    <div>
                      <select
                        className="linear-select"
                        value={form.birthDay}
                        onChange={(e) => setField("birthDay", e.target.value)}
                        aria-label="Birth Day"
                      >
                        <option value="">Select Day</option>
                        {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={String(d)}>
                            Day {d}
                          </option>
                        ))}
                      </select>
                      {problems.birthDay && <span className="field-error">{problems.birthDay}</span>}
                    </div>
                  </div>
                  <span className="field-hint">
                    Idara prompts the borrower for their birth date before stating debt obligations.
                  </span>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="input-amount">
                      Outstanding Amount Due (₦)
                    </label>
                    <div className="input-prefix-box">
                      <span className="prefix-sign">₦</span>
                      <input
                        ref={firstInput}
                        id="input-amount"
                        className="linear-input prefixed"
                        value={form.amount}
                        onChange={(e) => setField("amount", e.target.value.replace(/[^0-9.]/g, ""))}
                        placeholder="25000"
                        inputMode="numeric"
                        autoComplete="off"
                      />
                    </div>
                    {problems.amount && <span className="field-error">{problems.amount}</span>}
                    <div className="quick-chips">
                      {[15000, 25000, 50000, 85000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className="chip-btn"
                          onClick={() => setField("amount", String(amt))}
                        >
                          ₦{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="input-due">
                      Repayment Due Date
                    </label>
                    <input
                      id="input-due"
                      className="linear-input"
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setField("dueDate", e.target.value)}
                    />
                    {problems.dueDate && <span className="field-error">{problems.dueDate}</span>}
                    <div className="quick-chips">
                      {[1, 3, 7, 14].map((d) => (
                        <button
                          key={d}
                          type="button"
                          className="chip-btn"
                          onClick={() => setField("dueDate", inDays(d))}
                        >
                          {d === 1 ? "Tomorrow" : `In ${d}d`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="onboard-actions">
                  <button type="button" className="secondary-btn" onClick={handleBack}>
                    Back
                  </button>
                  <span className="spacer" />
                  <button type="button" className="primary-btn" onClick={handleNext}>
                    Continue to Review
                    <Icon name="check" size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3: Review */}
            {step === "review" && (
              <div className="step-pane stack" style={{ gap: "22px" }}>
                <div className="stack" style={{ gap: "4px" }}>
                  <span className="caption">Step 03 / 03 · Final Verification</span>
                  <h2 className="step-title">Review Strategy & Launch Simulation</h2>
                  <p className="step-desc">
                    Confirm configuration parameters. Once started, Idara will initialize connection telemetry and await your voice input.
                  </p>
                </div>

                <div className="review-spec-grid">
                  <div className="spec-card">
                    <span className="caption">Lender</span>
                    <span className="strong">{form.company || "—"}</span>
                  </div>
                  <div className="spec-card">
                    <span className="caption">Borrower</span>
                    <span className="strong">{form.fullName || "—"}</span>
                    <span className="small muted mono">{form.phone || "—"}</span>
                  </div>
                  <div className="spec-card">
                    <span className="caption">Security DOB</span>
                    <span className="strong">
                      {form.birthDay} {MONTHS[Number(form.birthMonth) - 1] ?? ""}
                    </span>
                    <span className="small muted">Checked before any amount is said</span>
                  </div>
                  <div className="spec-card">
                    <span className="caption">Balance Due</span>
                    <span className="strong mono">
                      ₦{Number(form.amount || 0).toLocaleString("en-NG")}
                    </span>
                    <span className="small muted">Due on {form.dueDate || "—"}</span>
                  </div>
                </div>

                <div className="script-preview-panel">
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: "8px" }}>
                    <span className="caption">Agent Opening Hook (Generated)</span>
                    <span className="chip chip-gray">Verify first</span>
                  </div>
                  <blockquote className="script-quote">
                    “{greeting(form)}”
                  </blockquote>
                  <p className="small muted" style={{ marginTop: "10px" }}>
                    If you confirm identity, Idara then asks for your birth day and month before any financial information is disclosed.
                  </p>
                </div>

                {error && (
                  <div className="error-banner" role="alert">
                    <span className="strong">Connection Error:</span> {error}
                  </div>
                )}

                <div className="onboard-actions">
                  <button type="button" className="secondary-btn" onClick={handleBack} disabled={saving}>
                    Back
                  </button>
                  <span className="spacer" />
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={saving}
                    onClick={() => void handleFinish()}
                  >
                    {saving ? "Starting…" : "Start Voice Agent"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
