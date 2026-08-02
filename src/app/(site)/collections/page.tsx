import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Collections" };

export default function CollectionsPage() {
  return (
    <ComingSoon
      overline="The core line"
      title="Collections"
      description="Permanent pieces, restocked rather than dropped. Available for as long as the house makes them."
      phase="Built in Phase 5"
    />
  );
}
