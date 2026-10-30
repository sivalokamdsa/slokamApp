"use client";

import dynamic from "next/dynamic";

// The logs UI uses today's date from the browser clock, so it renders only
// in the browser. The static page shell is still prerendered at build time.
const LogsView = dynamic(() => import("@/components/logs-view"), { ssr: false });

export default function LogsPage() {
  return <LogsView />;
}
