import { CallDemo } from "@/components/CallDemo";
import { PageHeader } from "@/components/PageHeader";

export default function DemoPage() {
  return (
    <>
      <PageHeader title="New" accent="call" subtitle="Tell nudge-finance who to call, then take the call yourself from the browser." />
      <CallDemo />
    </>
  );
}
