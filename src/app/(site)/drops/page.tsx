import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Drops" };

export default function DropsPage() {
  return (
    <ComingSoon
      overline="Limited releases"
      title="Drops"
      description="Released at a moment, in a quantity, and then never again. Announced to the list first."
      phase="Built in Phase 6"
    />
  );
}
