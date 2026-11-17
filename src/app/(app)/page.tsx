import Link from "next/link";
import { OutcomeChip } from "@/components/Chip";
import { PageHeader } from "@/components/PageHeader";
import { CALLS, FILTERS, matchesFilter } from "@/lib/sample";
import { Icon } from "@/components/icons";

export default async function CallsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "all" } = await searchParams;
  const calls = CALLS.filter((call) => matchesFilter(call, filter));

  return (
    <>
      <PageHeader
        title="Calls"
        accent="Telemetry"
        subtitle="Automated borrower reminder and promise-to-pay logs"
        action={
          <Link href="/demo" className="primary-btn">
            <Icon name="phone" size={14} />
            Launch Voice Demo
          </Link>
        }
      />

      {/* Structured Linear KPI Bar */}
      <section aria-label="Collections Overview" className="stats-bar">
        <Stat label="Total Calls Placed" value="38" note="26 connected (68%)" />
        <Stat label="Promises Secured" value="14" note="₦412,500 total value" />
        <Stat label="Human Escalations" value="5" note="3 pending review" />
        <Stat label="Median Response Speed" value="1.1s" note="Target SLA: 1.5s" />
      </section>

      {/* Linear Filter Tabs */}
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

      {/* Structured Linear Data Table Panel */}
      <section aria-label="Recent calls" className="table-panel">
        <div style={{ overflowX: "auto" }}>
          <table className="linear-table">
            <thead>
              <tr>
                <th scope="col">Borrower</th>
                <th scope="col">Outcome</th>
                <th scope="col">Amount Due</th>
                <th scope="col">Latency</th>
                <th scope="col">Engine</th>
                <th scope="col">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr key={call.id}>
                  <td data-label="Borrower">
                    <div className="stack" style={{ gap: "2px" }}>
                      {call.hasDetail ? (
                        <Link href={`/calls/${call.id}`} className="row-link strong">
                          {call.name}
                        </Link>
                      ) : (
                        <span className="strong">{call.name}</span>
                      )}
                      <span className="small muted mono">{call.id}</span>
                    </div>
                  </td>
                  <td data-label="Outcome">
                    <OutcomeChip tone={call.tone}>{call.outcome}</OutcomeChip>
                  </td>
                  <td data-label="Amount Due">
                    <span className="mono strong">{call.amount}</span>
                  </td>
                  <td data-label="Latency">
                    <span className="mono muted">{call.reply}</span>
                  </td>
                  <td data-label="Engine">
                    <span className="mono muted">{call.model}</span>
                  </td>
                  <td data-label="Timestamp">
                    <span className="muted small mono">{call.time}</span>
                  </td>
                </tr>
              ))}
              {calls.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-muted)" }}>
                    No recorded calls match this filter.
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
