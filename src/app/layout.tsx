import type { Metadata, Viewport } from "next";
import { GlobalChrome } from "@/components/experience/GlobalChrome";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MILLIONAIRE",
    template: "%s — MILLIONAIRE",
  },
  description: "No risk, no rich.",
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  colorScheme: "dark",
};

/**
 * Runs before first paint.
 *
 * Marks the document as already-preloaded for anyone who has seen the intro
 * this session, so the CSS hides the overlay before it is ever painted. Doing
 * this in React instead would mean the overlay renders, hydration runs, and
 * only then does it disappear — a visible flash on every navigation-triggered
 * remount.
 *
 * Wrapped in try/catch because sessionStorage throws outright in some privacy
 * modes, and an exception here would take the whole document with it.
 */
const PRELOADER_BOOTSTRAP = `try{if(sessionStorage.getItem('mn-preloaded')){document.documentElement.dataset.preloader='done'}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /*
     * `suppressHydrationWarning` is required, not incidental. The bootstrap
     * script writes `data-preloader` onto this element before React hydrates,
     * so the server HTML and the client DOM genuinely differ by that attribute
     * — by design. Without this, React reports a mismatch on every load for a
     * difference we deliberately introduced.
     *
     * It suppresses warnings for this element's own attributes only; children
     * are still fully checked.
     */
    <html lang="en" className={`${fontVariables} h-full`} suppressHydrationWarning>
      <head>
        {/*
          A raw inline script, deliberately — NOT next/script.

          `strategy="beforeInteractive"` sounds like the right tool but is not:
          it does not emit an executable tag, it pushes onto Next's
          `self.__next_s` queue, which the framework runtime drains *after*
          first paint. That is early enough for a third-party SDK and far too
          late for us — returning visitors would see the overlay flash before
          it was dismissed, which is the exact bug this script prevents.

          A synchronous inline script blocks parsing at this point in <head>,
          so the attribute is set before the overlay below is even parsed, let
          alone painted. React 19 logs a development advisory about script tags
          in component trees; it does not appear in production builds.
        */}
        <script dangerouslySetInnerHTML={{ __html: PRELOADER_BOOTSTRAP }} />

        {/*
          No-JavaScript fallback.

          Two separate failures to cover, both of which leave a blank page:

          1. The intro overlay is dismissed by script, so without one it stays
             up forever and covers everything.

          2. Scroll reveals are the bigger problem. `motion` serialises each
             element's `initial` state into the server HTML — 27 elements ship
             with `opacity:0` — so if script never runs, the content never
             becomes visible. The animation is meant to be an enhancement, but
             the hidden starting state is baked into the markup.

          Resetting inline opacity and transform is blunt, but under `noscript`
          nothing is animating anyway, so there is nothing to preserve. Content
          being visible beats content being composed.
        */}
        <noscript>
          <style>{`[data-preloader-overlay]{display:none!important}[data-wordmark-target]{opacity:1!important}main [style*="opacity:0"],main [style*="opacity: 0"]{opacity:1!important}main [style*="transform"]{transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-full flex-col">
        <GlobalChrome />
        {children}
      </body>
    </html>
  );
}
