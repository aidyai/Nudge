import Link from "next/link";
import { notFound } from "next/navigation";
import { OutcomeChip } from "@/components/Chip";
import { CallDetailView } from "@/components/CallDetailView";
import { PageHeader } from "@/components/PageHeader";
import { CALLS } from "@/lib/sample";
import { Icon } from "@/components/icons";

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const call = CALLS.find((c) => c.id === id && c.hasDetail);
  if (!call) notFound();

  return (
    <>
      <div>
        <Link href="/" className="back">
          <Icon name="arrow-left" size={13} />
          Back to Calls
        </Link>
      </div>

      <PageHeader
        title="Call"
        accent={`· ${call.name}`}
        subtitle={`${call.id} · Recorded Saturday, ${call.time} · Duration: 2m 05s · Engine: ${call.model}`}
        action={<OutcomeChip tone={call.tone}>{call.outcome}</OutcomeChip>}
      />

      <CallDetailView />
    </>
  );
}
