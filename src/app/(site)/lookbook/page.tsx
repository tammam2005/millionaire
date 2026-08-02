import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Lookbook" };

export default function LookbookPage() {
  return (
    <ComingSoon
      overline="Campaign"
      title="Lookbook"
      description="The season photographed in full. Figures without faces, shot against nothing."
      phase="Built in Phase 5"
    />
  );
}
