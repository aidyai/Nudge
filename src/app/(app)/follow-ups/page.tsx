import { PageHeader } from "@/components/PageHeader";

export default function FollowUpsPage() {
  return (
    <>
      <PageHeader title="Follow-" accent="ups" subtitle="Promises and human handoffs" />
      <p className="small muted" style={{ paddingTop: "12px", borderTop: "1px solid var(--divider)" }}>
        This page fills with real promises and handoffs once the agent is making calls.
      </p>
    </>
  );
}
