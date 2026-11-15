import Link from "next/link";
import { OutcomeChip } from "@/components/Chip";
import { PageHeader } from "@/components/PageHeader";
import { CALLS, FILTERS, matchesFilter } from "@/lib/sample";

export default async function CallsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "all" } = await searchParams;
  const calls = CALLS.filter((call) => matchesFilter(call, filter));
  return (
    <>
      <PageHeader
        title="Calls"
        accent="today"
        subtitle="Saturday, 7 November · sample data"
        action={
          <Link href="/demo" className="primary">
            Start a demo call
          </Link>
        }
      />

      <section aria-label="Summary" className="stats">
        <Stat label="Calls" value="38" note="26 connected" />
        <Stat label="Promises captured" value="14" note="₦412,500 promised" />
        <Stat label="Handed to a human" value="5" note="3 waiting for review" />
        <Stat label="Reply time (median)" value="1.1 s" note="95th percentile 1.4 s" />
      </section>

      <div role="group" aria-label="Filter calls" className="filters">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key === "all" ? "/" : `/?filter=${f.key}`} aria-current={filter === f.key ? "true" : undefined} className={filter === f.key ? "filter active" : "filter"}>
            {f.label}
          </Link>
        ))}
      </div>

      <section aria-label="Recent calls" className="panel table-panel">
        <div className="table" role="table" aria-label="Recent calls">
          <div className="table-row table-head" role="row">
            <span role="columnheader">Borrower</span>
            <span role="columnheader">Outcome</span>
            <span role="columnheader">Amount</span>
            <span role="columnheader">Reply time</span>
            <span role="columnheader">Model</span>
            <span role="columnheader">Time</span>
          </div>
          {calls.map((call) => (
            <div key={call.id} className="table-row" role="row">
              <span role="cell" className="stack">
                {call.hasDetail ? <Link href={`/calls/${call.id}`} className="strong">{call.name}</Link> : <span className="strong">{call.name}</span>}
                <span className="muted small">{call.id}</span>
              </span>
              <span role="cell"><OutcomeChip tone={call.tone}>{call.outcome}</OutcomeChip></span>
              <span role="cell">{call.amount}</span>
              <span role="cell">{call.reply}</span>
              <span role="cell">{call.model}</span>
              <span role="cell" className="muted">{call.time}</span>
            </div>
          ))}
        </div>

        <ul className="cards">
          {calls.map((call) => (
            <li key={call.id} className="card">
              <div className="card-top">
                <span className="stack">
                  {call.hasDetail ? <Link href={`/calls/${call.id}`} className="strong">{call.name}</Link> : <span className="strong">{call.name}</span>}
                  <span className="muted small">{call.id} · {call.time}</span>
                </span>
                <OutcomeChip tone={call.tone}>{call.outcome}</OutcomeChip>
              </div>
              <div className="card-bottom muted small">
                <span>{call.amount}</span>
                <span>Reply {call.reply} · {call.model}</span>
              </div>
            </li>
          ))}
        </ul>
        {calls.length === 0 ? <p className="empty muted">No calls match this filter.</p> : null}
      </section>
    </>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="stat">
      <span className="muted small">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="muted small">{note}</span>
    </div>
  );
}
