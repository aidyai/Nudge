"use client";

import { useState } from "react";
import { CallSetup } from "@/components/CallSetup";
import { LiveCall } from "@/components/LiveCall";

export function CallDemo() {
  const [borrowerId, setBorrowerId] = useState<string | null>(null);

  if (!borrowerId) return <CallSetup onReady={setBorrowerId} />;

  return <LiveCall borrowerId={borrowerId} onUnavailable={() => {}} />;
}
