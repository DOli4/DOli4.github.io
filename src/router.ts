import { useEffect, useState } from "react";

export type Route = "home" | "drill" | "drill-today" | "drill-artifacts" | "shake";

/** True for every view living behind the drill password gate. */
export function isDrillRoute(route: Route): boolean {
  return route === "drill" || route === "drill-today" || route === "drill-artifacts";
}

export const pageTabs: { route: Route; href: string; label: string }[] = [
  { route: "home", href: "#/", label: "CV" },
  { route: "drill", href: "#/drill", label: "DRILL" },
  { route: "shake", href: "#/shake", label: "SHAKE" },
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
  const hash = window.location.hash;
  if (!hash.startsWith("#/")) return "home";
  const slug = hash.slice(2).replace(/\/$/, "");
  if (slug === "drill" || slug === "shake") return slug;
  if (slug === "drill/today") return "drill-today";
  if (slug === "drill/artifacts") return "drill-artifacts";
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
