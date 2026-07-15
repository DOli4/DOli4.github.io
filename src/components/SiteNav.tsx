import { pageTabs, type Route } from "../router";

/**
 * Fixed top chrome, shared by every page.
 *
 * The section anchors (About/Work/Contact) only exist on the CV page — they
 * scroll, they don't navigate. The page tabs on the right are the real router.
 */
export default function SiteNav({ route }: { route: Route }) {
  return (
    <nav className="hud-top">
      <a className="hud-mark" href="#/" aria-label="Home">
        ⟠
      </a>

      {route === "home" ? (
        <div className="hud-links">
          <a href="#about" data-hover>
            About
          </a>
          <a href="#work" data-hover>
            Work
          </a>
          <a href="#contact" data-hover>
            Contact
          </a>
        </div>
      ) : (
        <span />
      )}

      <div className="page-tabs" role="tablist" aria-label="Pages">
        {pageTabs.map((tab) => (
          <a
            key={tab.route}
            href={tab.href}
            role="tab"
            aria-selected={route === tab.route}
            className={`page-tab${route === tab.route ? " is-on" : ""}`}
            data-hover
          >
            {tab.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
