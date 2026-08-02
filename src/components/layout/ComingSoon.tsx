import { Overline } from "@/components/ui/Overline";
import { Rule } from "@/components/ui/Rule";

type ComingSoonProps = {
  overline: string;
  title: string;
  description: string;
  /** Which phase actually builds this, so the placeholder is never mistaken for the plan. */
  phase: string;
};

/**
 * Honest placeholder for routes the shell links to but later phases build.
 *
 * The navigation is real from Phase 2 onward, so these routes have to resolve
 * to something. Naming the phase keeps it obvious that this is scaffolding
 * rather than a finished page nobody got around to filling in.
 */
export function ComingSoon({ overline, title, description, phase }: ComingSoonProps) {
  return (
    <main className="flex flex-1 flex-col justify-center px-(--spacing-gutter) py-(--spacing-section)">
      <div className="mx-auto w-full max-w-[1600px]">
        <Overline tone="silver">{overline}</Overline>
        <h1 className="mt-6 font-display-tracked text-(length:--text-display-lg) text-bone">
          {title}
        </h1>
        <Rule className="mt-10 mb-8 max-w-md" />
        <p className="max-w-md text-(length:--text-body-lg) text-stone">{description}</p>
        <p className="mt-10 text-[0.6875rem] tracking-[0.24em] text-ash uppercase">
          {phase}
        </p>
      </div>
    </main>
  );
}
