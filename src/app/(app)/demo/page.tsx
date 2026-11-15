import { CallDemo } from "@/components/CallDemo";
import { PageHeader } from "@/components/PageHeader";

export default function DemoPage() {
  return (
    <>
      <PageHeader title="Demo" accent="call" subtitle="Talk to the agent from your browser." />
      <CallDemo />
    </>
  );
}
