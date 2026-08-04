"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Spotlight } from "@/components/experience/Spotlight";
import { Overline } from "@/components/ui/Overline";
import { EASE_SIGNATURE } from "@/lib/motion/tokens";

/**
 * The list.
 *
 * A newsletter block is where luxury sites usually give themselves away — a
 * boxed panel, a headline shouting about discounts, a button in a brand
 * colour. This one is a single line of type, a rule, and a word.
 *
 * The field has no box: just a hairline that brightens on focus, so the input
 * reads as part of the typography rather than as a form control dropped into
 * the page. The focus state is a colour change on that rule plus the standard
 * focus ring, so keyboard users are never worse off than mouse users.
 *
 * Submission is intentionally inert until Phase 6, when the drop waitlist
 * brings the same plumbing. Rather than pretend, the control reports its real
 * state — and says so in a live region, because a visual-only confirmation is
 * no confirmation at all for a screen reader.
 */
export function TheList() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "noted">("idle");

  return (
    <section className="relative overflow-hidden bg-void px-(--spacing-gutter) py-(--spacing-section)">
      <Spotlight
        reach={0.03}
        className="top-1/2 left-1/2 h-[52svh] w-[52svh] -translate-x-1/2 -translate-y-1/2"
      />

      <div className="relative mx-auto max-w-[1600px]">
        <div className="max-w-[46rem]">
          <Overline tone="silver">The List</Overline>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 1.1, ease: EASE_SIGNATURE }}
            className="mt-8 font-display text-(length:--text-display-md) leading-[1.08] tracking-[0.02em] text-bone"
          >
            Drops are announced here first,
            <br className="hidden sm:block" /> and nowhere else.
          </motion.h2>

          <form
            className="mt-16"
            onSubmit={(event) => {
              event.preventDefault();
              setStatus("noted");
            }}
          >
            <div className="flex items-end gap-6">
              <div className="flex-1">
                <label htmlFor="list-email" className="mb-4 block text-overline text-ash">
                  Email address
                </label>
                <input
                  id="list-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (status !== "idle") setStatus("idle");
                  }}
                  placeholder="you@domain.com"
                  className="w-full border-b border-graphite bg-transparent pb-4 text-(length:--text-body-lg) text-bone transition-colors duration-(--duration-micro) outline-none placeholder:text-ash focus:border-silver"
                />
              </div>

              <button
                type="submit"
                data-cursor-magnetic
                className="shrink-0 border-b border-graphite pb-4 text-overline text-silver transition-colors duration-(--duration-micro) hover:border-bone hover:text-bone"
              >
                Join
              </button>
            </div>

            <p
              role="status"
              aria-live="polite"
              className="mt-6 min-h-5 text-[0.6875rem] tracking-[0.24em] text-silver uppercase"
            >
              {status === "noted" ? "Noted — the list opens with the next drop" : ""}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
