import type { ReactNode } from "react";
import { PageTransition } from "@/components/experience/PageTransition";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/**
 * The storefront shell.
 *
 * Applies to every customer-facing route. The styleguide sits outside this
 * group on purpose — it documents the pieces, so wrapping it in the very
 * chrome it documents would make it harder to read, not easier.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <PageTransition>{children}</PageTransition>
      <Footer />
    </>
  );
}
