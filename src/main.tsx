import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import DrillArea from "./pages/drill/DrillArea.tsx";
import Shake from "./pages/Shake.tsx";
import SiteNav from "./components/SiteNav.tsx";
import TronCursor from "./components/TronCursor.tsx";
import { isDrillRoute, useRoute } from "./router";
import "./styles/tailwind.css";
import "./styles/dark.css";
import "./styles/layout.css";

function Root() {
  const route = useRoute();

  return (
    <>
      {/* body sets `cursor: none`, so every page needs a cursor of its own.
          Shake is the exception - the pointer trails sparkles there instead. */}
      {route !== "shake" && <TronCursor />}
      <SiteNav route={route} />
      {route === "home" && <App />}
      {isDrillRoute(route) && <DrillArea route={route} />}
      {route === "shake" && <Shake />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
