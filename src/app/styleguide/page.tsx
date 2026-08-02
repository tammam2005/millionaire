import Image from "next/image";
import type { Metadata } from "next";
import { Monogram } from "@/components/brand/Monogram";
import { Signature } from "@/components/brand/Signature";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Marquee } from "@/components/ui/Marquee";
import { Overline } from "@/components/ui/Overline";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Rule } from "@/components/ui/Rule";
import { millionaireSetTurnaround } from "@/lib/media/assets";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

const PALETTE = [
  { token: "void", value: "#08080A", note: "Primary ground", className: "bg-void" },
  { token: "ink", value: "#131315", note: "Raised surfaces", className: "bg-ink" },
  {
    token: "graphite",
    value: "#1E1E21",
    note: "Hairlines on dark",
    className: "bg-graphite",
  },
  { token: "ash", value: "#55555A", note: "Dividers, disabled", className: "bg-ash" },
  { token: "stone", value: "#8A8A86", note: "Secondary text", className: "bg-stone" },
  {
    token: "silver",
    value: "#B4B2AC",
    note: "Accent — measured print",
    className: "bg-silver",
  },
  { token: "bone", value: "#E8E8E6", note: "Primary text on void", className: "bg-bone" },
];

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-(--spacing-gutter) py-20">
      <div className="mx-auto max-w-6xl">
        <Overline>{label}</Overline>
        <h2 className="mt-3 font-display-tracked text-(length:--text-heading) text-bone">
          {title}
        </h2>
        <Rule className="mt-6 mb-12" />
        {children}
      </div>
    </section>
  );
}

export default function StyleguidePage() {
  return (
    <main className="flex-1">
      <header className="px-(--spacing-gutter) pt-24 pb-10">
        <div className="mx-auto max-w-6xl">
          <Overline tone="silver">Internal — not indexed</Overline>
          <h1 className="mt-4 font-display-tracked text-(length:--text-display-md) text-bone">
            Design System
          </h1>
          <p className="mt-6 max-w-xl text-(length:--text-body-lg) text-stone">
            Every colour below was measured off the brand renders rather than chosen by
            eye. The garment print reads neutral, so the accent is a silver — not the
            champagne this started as.
          </p>
        </div>
      </header>

      <Section label="01" title="Palette">
        <ul className="grid grid-cols-2 gap-px sm:grid-cols-4 lg:grid-cols-7">
          {PALETTE.map((swatch) => (
            <li key={swatch.token}>
              <div className={`${swatch.className} h-28 border border-graphite`} />
              <p className="mt-3 text-(length:--text-caption) text-bone">
                {swatch.token}
              </p>
              <p className="font-mono text-[0.6875rem] text-stone">{swatch.value}</p>
              <p className="mt-1 text-[0.6875rem] text-ash">{swatch.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section label="02" title="Brand marks">
        <div className="grid gap-16 lg:grid-cols-3">
          <div>
            <Overline>Wordmark</Overline>
            <div className="mt-6">
              <Wordmark size="medium" />
            </div>
            <p className="mt-6 max-w-xs text-(length:--text-caption) text-ash">
              Real text, not an outline — selectable, fluidly scaled, and splittable
              per-letter for the preloader.
            </p>
          </div>

          <div>
            <Overline>Crest</Overline>
            <div className="mt-6 flex items-end gap-8">
              <Monogram size={96} label="MILLIONAIRE crest" />
              <Monogram size={48} />
              <Monogram size={24} />
            </div>
            <p className="mt-6 max-w-xs text-(length:--text-caption) text-ash">
              Stroked, not filled. The hairline holds at every size because the stroke
              does not scale with the mark.
            </p>
          </div>

          <div>
            <Overline>Signature</Overline>
            <div className="mt-6">
              <Signature />
            </div>
            <p className="mt-8 max-w-xs text-(length:--text-caption) text-ash">
              The tagline carried on the back of the garment, set in a calligraphic face
              rather than approximated as bezier paths.
            </p>
          </div>
        </div>
      </Section>

      <Section label="03" title="Typography">
        <div className="space-y-12">
          <div>
            <Overline>Display XL — hero and preloader only</Overline>
            <p className="mt-4 font-display-tracked text-(length:--text-display-xl) text-bone">
              Aa
            </p>
          </div>
          <div>
            <Overline>Display LG</Overline>
            <p className="mt-4 font-display-tracked text-(length:--text-display-lg) text-bone">
              Concealment
            </p>
          </div>
          <div>
            <Overline>Display MD</Overline>
            <p className="mt-4 font-display-tracked text-(length:--text-display-md) text-bone">
              Exclusive Collection
            </p>
          </div>
          <div>
            <Overline>Body — interface grotesque</Overline>
            <p className="mt-4 max-w-2xl text-(length:--text-body-lg) text-stone">
              The display face is a Didone with hairline serifs. It is never asked to set
              below roughly 24px, because at small sizes those hairlines break up and the
              type starts to shimmer. Everything functional is set in the grotesque
              instead.
            </p>
          </div>
        </div>
      </Section>

      <Section label="04" title="Motion">
        <div className="space-y-14">
          <div>
            <Overline>Masked line reveal — scroll to trigger</Overline>
            <RevealText
              as="h3"
              lines={["No risk,", "no rich."]}
              className="mt-4 font-display-tracked text-(length:--text-display-lg) text-bone"
            />
          </div>

          <div>
            <Overline>Block rise</Overline>
            <div className="mt-4 grid gap-px sm:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <Reveal key={index} delay={index * 0.06}>
                  <div className="flex h-32 items-center justify-center border border-graphite bg-ink text-(length:--text-caption) text-stone">
                    {index + 1}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div>
            <Overline>Marquee</Overline>
            <Marquee
              className="mt-4"
              items={[
                "No Risk No Rich",
                "Exclusive Collection",
                "Concealment",
                "ARCX MFTA",
              ]}
            />
          </div>
        </div>
      </Section>

      <Section label="05" title="Controls">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="solid">Add to bag</Button>
          <Button variant="outline">Notify me</Button>
          <Button variant="quiet">View details</Button>
          <ButtonLink href="/" variant="outline">
            Back to home
          </ButtonLink>
          <Button variant="outline" disabled>
            Sold out
          </Button>
        </div>
        <p className="mt-8 max-w-lg text-(length:--text-caption) text-ash">
          No radii anywhere. Square corners and tracked uppercase type make a control read
          as signage rather than as an app widget. Every control is magnetic to the
          cursor.
        </p>
      </Section>

      <Section label="06" title="Cursor contexts">
        <div className="grid gap-px sm:grid-cols-3">
          {(["drag", "view", "add"] as const).map((mode) => (
            <div
              key={mode}
              data-cursor={mode}
              data-cursor-magnetic
              className="flex h-40 items-center justify-center border border-graphite bg-ink"
            >
              <span className="text-overline text-stone">hover — {mode}</span>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-lg text-(length:--text-caption) text-ash">
          Three labels, and no more. A cursor that narrates every hover stops being
          minimal. Absent entirely on touch devices and under reduced motion.
        </p>
      </Section>

      <Section label="07" title="Studio ground">
        <p className="mb-8 max-w-2xl text-(length:--text-body-lg) text-stone">
          The renders carry their own cyclorama — a vignette that brightens toward the
          floor, sampled at #CDCDCF in the upper corners and #E6E6E6 at the base. The
          section ground below reconstructs it as a gradient, so the image edges disappear
          and the garment stands in the page rather than in a box.
        </p>
        <div className="bg-studio flex items-end justify-center gap-4 overflow-hidden">
          {millionaireSetTurnaround.frames
            .filter((frame) => !frame.mirrored)
            .map((frame) => (
              <div key={frame.angle} className="relative">
                <Image
                  src={frame.src}
                  alt=""
                  width={260}
                  height={260}
                  className="h-auto w-[160px] sm:w-[240px]"
                  placeholder="blur"
                />
                <span className="absolute top-3 left-3 text-overline text-[#55555a]">
                  {frame.angle}°
                </span>
              </div>
            ))}
        </div>
      </Section>

      <footer className="px-(--spacing-gutter) py-24">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Monogram size={32} />
          <Wordmark size="small" />
        </div>
      </footer>
    </main>
  );
}
