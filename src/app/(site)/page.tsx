import { Signature } from "@/components/brand/Signature";
import { Overline } from "@/components/ui/Overline";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Rule } from "@/components/ui/Rule";

/**
 * Phase 2 holding page.
 *
 * Enough vertical range to exercise the shell — the header has to condense on
 * scroll, the scroll-triggered reveals have to fire, and the footer has to sit
 * below real content rather than a stub. The hero and the 360° experience
 * replace this in Phase 4.
 */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="flex min-h-svh flex-col items-center justify-center px-(--spacing-gutter) text-center">
        <Overline tone="silver">Exclusive Collection</Overline>
        <RevealText
          as="h1"
          lines={["No risk,", "no rich."]}
          className="mt-8 font-display-tracked text-(length:--text-display-lg) text-bone"
        />
        <Rule className="mt-12 max-w-40" origin="center" tone="silver" />
      </section>

      <section className="px-(--spacing-gutter) py-(--spacing-section)">
        <div className="mx-auto max-w-[1600px]">
          <div className="max-w-2xl">
            <Overline>The house</Overline>
            <RevealText
              as="h2"
              lines={["Concealment", "as luxury."]}
              className="mt-6 font-display-tracked text-(length:--text-display-md) text-bone"
            />
            <Reveal delay={0.1}>
              <p className="mt-10 text-(length:--text-body-lg) text-stone">
                Black on black. No faces, no colour, no announcement. The pieces are made
                once, photographed against nothing, and released without explanation.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="px-(--spacing-gutter) pb-(--spacing-section)">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-8 text-center">
          <Signature className="text-[2.5em] sm:text-[4em]" />
          <Overline>Since the first drop</Overline>
        </div>
      </section>
    </main>
  );
}
