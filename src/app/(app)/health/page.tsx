import { PageHeader } from "@/components/PageHeader";

export default function HealthPage() {
  return (
    <>
      <PageHeader title="System" accent="health" subtitle="Latency and policy stats" />
      <p className="small muted" style={{ paddingTop: "12px", borderTop: "1px solid var(--divider)" }}>
        This page fills with real latency and policy numbers once the agent is making calls.
      </p>
    </>
  );
}
