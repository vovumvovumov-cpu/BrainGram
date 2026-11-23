import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import "./style.css";
import "./telegram-classic.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl="https://vovumvovumov-cpu.github.io/BrainGram/tonconnect-manifest.json"><App /></TonConnectUIProvider>
  </React.StrictMode>
);
