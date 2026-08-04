import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";
import { Marquee } from "@/components/ui/Marquee";
import { Overline } from "@/components/ui/Overline";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/navigation";

const CLIENT_SERVICES = [
  { href: "/about", label: "Contact" },
  { href: "/about", label: "Shipping" },
  { href: "/about", label: "Returns" },
  { href: "/about", label: "Sizing" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-graphite">
      <Marquee
        className="border-b border-graphite py-6"
        items={["No Risk No Rich", "Exclusive Collection", "Concealment", "ARCX MFTA"]}
      />

      <div className="mx-auto max-w-[1600px] px-(--spacing-gutter) py-20">
        <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Monogram size={40} />
            <p className="mt-6 max-w-[24ch] text-(length:--text-caption) text-stone">
              A house built on concealment. Nothing is announced twice.
            </p>
          </div>

          <nav aria-label="Footer — browse">
            <Overline className="mb-5">Browse</Overline>
            <ul className="space-y-3">
              {PRIMARY_NAV.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-(length:--text-caption) text-stone transition-colors duration-(--duration-micro) hover:text-bone"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Footer — client services">
            <Overline className="mb-5">Client services</Overline>
            <ul className="space-y-3">
              {CLIENT_SERVICES.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-(length:--text-caption) text-stone transition-colors duration-(--duration-micro) hover:text-bone"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <Overline className="mb-5">The list</Overline>
            <p className="mb-5 text-(length:--text-caption) text-stone">
              Drops are announced to the list first, and to nobody else.
            </p>
            {/* Wired to a real subscription endpoint in Phase 6 alongside the
                drop waitlist, which needs the same plumbing. */}
            <form className="flex items-center gap-3" aria-label="Join the list">
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                required
                placeholder="Email"
                className="w-full border-b border-line bg-transparent py-2 text-(length:--text-caption) text-bone transition-colors outline-none placeholder:text-ash focus:border-bone"
              />
              <button
                type="submit"
                data-cursor-magnetic
                className="shrink-0 text-overline text-silver transition-colors duration-(--duration-micro) hover:text-bone"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-graphite pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.6875rem] text-ash">
            © {year} MILLIONAIRE. All rights reserved.
          </p>
          <ul className="flex gap-6">
            {SECONDARY_NAV.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[0.6875rem] text-ash transition-colors duration-(--duration-micro) hover:text-stone"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
