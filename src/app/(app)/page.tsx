import Link from "next/link";
import { OutcomeChip } from "@/components/Chip";
import { PageHeader } from "@/components/PageHeader";
import { type CallRow, FILTERS, matchesFilter, naira, outcome, seconds, type Stats, when } from "@/lib/calls";
import { load } from "@/lib/engine";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic"; // read the database on every visit

export default async function CallsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "all" } = await searchParams;
  const result = await load<{ stats: Stats; calls: CallRow[] }>("calls");
  const stats = "data" in result ? result.data.stats : null;
  const calls = "data" in result ? result.data.calls.filter((call) => matchesFilter(call, filter)) : [];

  return (
    <>
      <PageHeader
        title="Calls"
        accent="Telemetry"
        subtitle="Every call the agent has made, read from the database"
        action={
          <Link href="/demo" className="primary-btn">
            <Icon name="phone" size={14} />
            New call
          </Link>
        }
      />

      {"error" in result && (
        <p className="small" role="alert">
          {result.error}
        </p>
      )}

      {stats && (
        <section aria-label="Collections Overview" className="stats-bar fx fx-weave-a">
          <Stat label="Calls Made" value={String(stats.calls)} note="since the last reset" />
          <Stat label="Promises Saved" value={String(stats.promises)} note={`${naira(stats.promised_ngn)} in total`} />
          <Stat label="Human Hand-offs" value={String(stats.handoffs)} note={`${stats.open_handoffs} still open`} />
          <Stat label="Median Model Reply" value={seconds(stats.reply_ms)} note="the brain only, not the voice" />
        </section>
      )}

      <div role="tablist" aria-label="Filter calls" className="filters-bar">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/" : `/?filter=${f.key}`}
            role="tab"
            aria-selected={filter === f.key}
            className={filter === f.key ? "filter-tab active" : "filter-tab"}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <section aria-label="Recent calls" className="table-panel">
        <div style={{ overflowX: "auto" }}>
          <table className="linear-table">
            <thead>
              <tr>
                <th scope="col">Borrower</th>
                <th scope="col">Outcome</th>
                <th scope="col">Amount Due</th>
                <th scope="col">Model Reply</th>
                <th scope="col">Engine</th>
                <th scope="col">Started</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => {
                const o = outcome(call.outcome);
                return (
                  <tr key={call.id}>
                    <td data-label="Borrower">
                      <div className="stack" style={{ gap: "2px" }}>
                        <Link href={`/calls/${call.id}`} className="row-link strong">
                          {call.name}
                        </Link>
                        <span className="small muted mono">{call.borrower_id}</span>
                      </div>
                    </td>
                    <td data-label="Outcome">
                      <OutcomeChip tone={o.tone}>{o.label}</OutcomeChip>
                    </td>
                    <td data-label="Amount Due">
                      <span className="mono strong">{naira(call.amount_due_ngn)}</span>
                    </td>
                    <td data-label="Model Reply">
                      <span className="mono muted">{seconds(call.reply_ms)}</span>
                    </td>
                    <td data-label="Engine">
                      <span className="mono muted">{call.llm_backend ?? "—"}</span>
                    </td>
                    <td data-label="Started">
                      <span className="muted small mono">{when(call.started_at)}</span>
                    </td>
                  </tr>
                );
              })}
              {calls.length === 0 && !("error" in result) && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-muted)" }}>
                    No calls yet. Press New call and it will show up here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="stat-item">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-note">{note}</span>
    </div>
  );
}
