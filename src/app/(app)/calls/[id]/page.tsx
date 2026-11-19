import Link from "next/link";
import { notFound } from "next/navigation";
import { OutcomeChip } from "@/components/Chip";
import { CallDetailView } from "@/components/CallDetailView";
import { PageHeader } from "@/components/PageHeader";
import { type Detail, duration, outcome, when } from "@/lib/calls";
import { load } from "@/lib/engine";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await load<Detail>(`calls/${encodeURIComponent(id)}`);
  if ("error" in result && result.status === 404) notFound();
  const o = "data" in result ? outcome(result.data.outcome) : null;

  return (
    <>
      <div>
        <Link href="/" className="back">
          <Icon name="arrow-left" size={13} />
          Back to Calls
        </Link>
      </div>

      {"error" in result ? (
        <p className="small" role="alert">
          {result.error}
        </p>
      ) : (
        <>
          <PageHeader
            title="Call"
            accent={`· ${result.data.name}`}
            subtitle={`${result.data.borrower_id} · ${when(result.data.started_at)} · Duration: ${duration(result.data.started_at, result.data.ended_at)} · Engine: ${result.data.llm_backend ?? "—"}`}
            action={o && <OutcomeChip tone={o.tone}>{o.label}</OutcomeChip>}
          />
          <CallDetailView call={result.data} />
        </>
      )}
    </>
  );
}
