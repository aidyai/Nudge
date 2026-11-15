import { PageHeader } from "@/components/PageHeader";

export default function HealthPage() {
  return (
    <>
      <PageHeader title="System" accent="health" subtitle="Latency and policy stats" />
      <section className="panel">
        <p className="muted">This page fills with real latency and policy numbers once the agent is making calls. To try the models now, open the test lab.</p>
      </section>
    </>
  );
}
