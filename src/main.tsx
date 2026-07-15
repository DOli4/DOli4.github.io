import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import Drill from "./pages/Drill.tsx";
import Shake from "./pages/Shake.tsx";
import SiteNav from "./components/SiteNav.tsx";
import TronCursor from "./components/TronCursor.tsx";
import { useRoute } from "./router";
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
      {route === "drill" && <Drill />}
      {route === "shake" && <Shake />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
