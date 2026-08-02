import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <ComingSoon
      overline="The house"
      title="About"
      description="Who makes it, how it is made, and why none of it is announced twice."
      phase="Built in Phase 7"
    />
  );
}
