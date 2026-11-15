import Link from "next/link";
import { notFound } from "next/navigation";
import { OutcomeChip } from "@/components/Chip";
import { CallDetailView } from "@/components/CallDetailView";
import { PageHeader } from "@/components/PageHeader";
import { CALLS } from "@/lib/sample";

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const call = CALLS.find((c) => c.id === id && c.hasDetail);
  if (!call) notFound();
  return (
    <>
      <Link href="/" className="back">← Calls</Link>
      <PageHeader title="Call with" accent={call.name} subtitle={`${call.id} · Saturday, ${call.time} · 2 min 05 s · Model: ${call.model}`} action={<OutcomeChip tone={call.tone}>{call.outcome}</OutcomeChip>} />
      <CallDetailView />
    </>
  );
}
