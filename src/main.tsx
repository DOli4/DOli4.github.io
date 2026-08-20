import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import SiteNav from "./components/SiteNav.tsx";
import TronCursor from "./components/TronCursor.tsx";
import Themer from "./components/Themer.tsx";
import { isDrillRoute, useRoute } from "./router";
import { initTheme } from "./lib/theme";
import "./styles/tailwind.css";
import "./styles/dark.css";
import "./styles/layout.css";

// The CV is the only page that loads eagerly. The drill dashboard (heavy —
// @xyflow/react etc.), shake, and the studio page are code-split so the public
// CV downloads far less JavaScript up front.
const DrillArea = lazy(() => import("./pages/drill/DrillArea.tsx"));
const Shake = lazy(() => import("./pages/Shake.tsx"));
const Studio = lazy(() => import("./pages/Studio.tsx"));

// restore the saved theme before first paint so there's no default-colour flash
initTheme();

function Root() {
  const route = useRoute();

  return (
    <>
      {/* body sets `cursor: none`, so every page needs a cursor of its own.
          Shake and the studio page are their own worlds — they hide the dark
          site chrome (HUD nav, theme menu, custom cursor) entirely. */}
      {route !== "shake" && route !== "studio" && <TronCursor />}
      {route !== "studio" && <SiteNav route={route} />}
      {route !== "studio" && <Themer />}
      {route === "home" && <App />}
      <Suspense fallback={null}>
        {isDrillRoute(route) && <DrillArea route={route} />}
        {route === "shake" && <Shake />}
        {route === "studio" && <Studio />}
      </Suspense>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
