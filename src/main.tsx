import { createRoot } from "react-dom/client";
import { AzureCredentialsProvider } from "@/contexts/AzureCredentialsContext";
import App from "./App";
import "./index.css";
import { DatabricksCredentialsProvider } from "./contexts/DatabricksCredentialsContext";
import { FabricCredentialsProvider } from "./contexts/FabricCredentialsContext";
import { SnowflakeCredentialsProvider } from "./contexts/SnowflakeCredentialsContext";

createRoot(document.getElementById("root")!).render(
  <AzureCredentialsProvider>
    <DatabricksCredentialsProvider>
      <FabricCredentialsProvider >
        <SnowflakeCredentialsProvider>
            <App />
        </SnowflakeCredentialsProvider>
      </FabricCredentialsProvider>
    </DatabricksCredentialsProvider>
  </AzureCredentialsProvider>
);
