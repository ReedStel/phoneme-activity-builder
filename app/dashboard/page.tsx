import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getDashboardSummary } from "@/lib/metrics";

export const metadata: Metadata = {
  title: "Dashboard | Phoneme Activity Builder",
  description:
    "Usage and health reporting for the Phoneme Activity Builder: stored word lists and activities, generation success and failure counts, time on page and API traffic.",
};

// Always read fresh numbers: a cached dashboard would be a misleading one.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = await getDashboardSummary(14);
  return <DashboardView initial={summary} />;
}
