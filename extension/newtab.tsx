import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Desktop } from "@/components/desktop/Desktop";
import "../src/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Desktop className="h-screen w-screen" />
  </StrictMode>,
);
