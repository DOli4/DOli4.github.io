import { useEffect, useState } from "react";

export type Route = "home" | "drill" | "drill-today" | "drill-artifacts" | "drill-mentor" | "shake";

/** True for every view living behind the drill password gate. */
export function isDrillRoute(route: Route): boolean {
  return route === "drill" || route === "drill-today" || route === "drill-artifacts" || route === "drill-mentor";
}

/**
 * Public lockdown. While true the live site is CV-only: every route resolves
 * to home and the DASHBOARD tab is hidden, so the drill dashboard and shake
 * page are unreachable (even by typing #/drill). The code still ships — flip
 * this one flag back to false to restore them.
 */
export const CV_ONLY = true;

export const pageTabs: { route: Route; href: string; label: string }[] = CV_ONLY
  ? []
  : [
      { route: "home", href: "#/", label: "CV" },
      { route: "drill", href: "#/drill", label: "DASHBOARD" },
    ];

/**
 * Hash routing, deliberately.
 *
 * GitHub Pages serves static files with no rewrite rule, so a real path like
 * /drill would 404 on refresh. Hash routes always resolve to index.html.
 *
 * "#/drill" is a route. "#about" is NOT — it's a plain fragment on the CV page,
 * so the browser's native scroll-to-id keeps working untouched.
 */
function parse(): Route {
  if (CV_ONLY) return "home";
  const hash = window.location.hash;
  if (!hash.startsWith("#/")) return "home";
  const slug = hash.slice(2).replace(/\/$/, "");
  if (slug === "drill" || slug === "shake") return slug;
  if (slug === "drill/today") return "drill-today";
  if (slug === "drill/artifacts") return "drill-artifacts";
  if (slug === "drill/mentor") return "drill-mentor";
  return "home";
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);

  useEffect(() => {
    const onHashChange = () => {
      const next = parse();
      setRoute(next);
      // Reset scroll on any page *route* change. But "#about" etc. are anchors
      // on the CV page, not routes - parse() maps them all to "home", so guard
      // on the raw hash to avoid hijacking anchor jumps.
      const isAnchor = window.location.hash && !window.location.hash.startsWith("#/");
      if (!isAnchor) window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
}
