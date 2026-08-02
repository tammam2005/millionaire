import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Archive" };

export default function ArchivePage() {
  return (
    <ComingSoon
      overline="Past releases"
      title="Archive"
      description="Every drop that has closed. Kept on record, not for sale."
      phase="Built in Phase 6"
    />
  );
}
