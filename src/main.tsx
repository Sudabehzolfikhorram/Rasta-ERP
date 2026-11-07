import React from "react";
import ReactDOM from "react-dom/client";
import { DirectionProvider } from "@radix-ui/react-direction";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DirectionProvider dir="rtl">
      <TooltipProvider delayDuration={250}>
        <App />
      </TooltipProvider>
    </DirectionProvider>
  </React.StrictMode>,
);
