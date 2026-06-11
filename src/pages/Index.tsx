import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FabricJobsHome } from "./FabricJobsHome";
import { MigrationWorkspace } from "./MigrationWorkspace";
import { DatabricksMigrationWorkspace } from "./DatabricksMigrationWorkspace";
import { MigrationReport } from "./MigrationReport";
import { DatabricksMigrationReport } from "./DatabricksMigrationReport";
import { ConnectSynapseModal } from "@/components/modals/ConnectSynapseModal";
import { ConnectDatabricksModal } from "@/components/modals/ConnectDatabricksModal";
import { useAuth } from "@/contexts/AuthContext";
import type { SynapseConnection } from "@/types/migration";

type AppView =
  | "home"
  | "synapse-workspace"
  | "databricks-workspace"
  | "synapse-migration-report"
  | "databricks-migration-report";

interface SynapseMigrationItem {
  id: string;
  name: string;
  type: "SparkPool" | "Notebook" | "Pipeline" | "LinkedService";
  status: "Success" | "Running" | "Failed" | "Ready" | "Paused" | "Skipped" | "Replaced";
  targetWorkspace?: string;
  // ✅ Added so MigrationReport can use it for the replace API call
  targetWorkspaceId?: string;
  lastModified: string;
  errorMessage?: string;
  runId?: string;
  runtimeVersion?: string;
  nodeType?: string;
  nodes?: number;
  language?: string;
  dependencies?: number;
  activities?: number;
}

interface DatabricksMigrationItem {
  id: string;
  name: string;
  type: "Job" | "Notebook" | "Cluster" | "Catalog" | "Warehouse";
  status: "Success" | "Running" | "Failed" | "Ready" | "Paused" | "Skipped" | "Replaced";
  targetWorkspace?: string;
  targetWorkspaceId?: string;
  lastModified: string;
  errorMessage?: string;
  runId?: string;
  fabricPipelineId?: string;
  schedule?: string;
  cluster?: string;
  language?: string;
  path?: string;
  runtime?: string;
  workers?: string;
}

const Index = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentView, setCurrentView] = useState<AppView>("home");
  const [showSynapseModal, setShowSynapseModal] = useState(false);
  const [showDatabricksModal, setShowDatabricksModal] = useState(false);

  const [synapseMigrationItems, setSynapseMigrationItems] = useState<SynapseMigrationItem[]>([]);
  const [databricksMigrationItems, setDatabricksMigrationItems] = useState<DatabricksMigrationItem[]>([]);

  const [synapseApiResponse, setSynapseApiResponse] = useState<any>(null);
  const [databricksApiResponse, setDatabricksApiResponse] = useState<any>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  // ✅ Store the source Synapse workspace name so MigrationReport can use it
  //    in the replace API payload (apiResponse.workspace)
  const [synapseWorkspaceName, setSynapseWorkspaceName] = useState<string>("");

  const handleLogout = () => { logout(); };
  const handleMigrateFromSynapse = () => { setShowSynapseModal(true); };
  const handleMigrateFromDatabricks = () => { setShowDatabricksModal(true); };

  const handleSynapseConnect = (connection: SynapseConnection, apiResponse: any) => {
    setSynapseApiResponse(apiResponse);
    // ✅ Capture the source Synapse workspace name from the API response
    setSynapseWorkspaceName(apiResponse.workspace || "");
    setShowSynapseModal(false);
    setCurrentView("synapse-workspace");
    navigate("/synapse-workspace");
  };

  const handleDatabricksConnect = (config: any, apiResponse: any) => {
    setDatabricksApiResponse(apiResponse);
    setShowDatabricksModal(false);
    setCurrentView("databricks-workspace");
    navigate("/databricks-workspace");
  };

  const handleSynapseMigrationComplete = (
    items: SynapseMigrationItem[] | ((prev: SynapseMigrationItem[]) => SynapseMigrationItem[])
  ) => {
    if (typeof items === "function") {
      setSynapseMigrationItems(items);
    } else {
      setSynapseMigrationItems(items);
      setCurrentView("synapse-migration-report");
      navigate("/synapse-report");
    }
  };

  // ✅ FIXED: Protect Skipped/Replaced items from being overwritten — same as Databricks
  const handleSynapseMigrationUpdate = (
    updateFn: (prev: SynapseMigrationItem[]) => SynapseMigrationItem[]
  ) => {
    setSynapseMigrationItems((prevItems) => {
      const newItems = updateFn(prevItems);
      return newItems.map((newItem) => {
        const oldItem = prevItems.find((p) => p.id === newItem.id);
        // Protect items that are already Skipped or Replaced
        if (oldItem && (oldItem.status === "Skipped" || oldItem.status === "Replaced")) {
          return oldItem;
        }
        return newItem;
      });
    });
  };

  const handleDatabricksMigrationComplete = (items: DatabricksMigrationItem[]) => {
    setDatabricksMigrationItems(items);
    setCurrentView("databricks-migration-report");
    navigate("/databricks-report");
  };

  // ✅ Only protect Skipped/Replaced, allow all other updates
  const handleDatabricksMigrationUpdate = (
    updateFn: (prev: DatabricksMigrationItem[]) => DatabricksMigrationItem[]
  ) => {
    setDatabricksMigrationItems((prevItems) => {
      const newItems = updateFn(prevItems);
      return newItems.map((newItem) => {
        const oldItem = prevItems.find((p) => p.id === newItem.id);
        if (oldItem && (oldItem.status === "Skipped" || oldItem.status === "Replaced")) {
          return oldItem;
        }
        return newItem;
      });
    });
  };

  const handleWorkspaceSelected = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
  };

  const handleBackToHome = () => {
    setCurrentView("home");
    setSynapseApiResponse(null);
    setDatabricksApiResponse(null);
    setSynapseMigrationItems([]);
    setDatabricksMigrationItems([]);
    setSelectedWorkspaceId("");
    setSynapseWorkspaceName("");
    navigate("/hub");
  };

  return (
    <>
      {currentView === "home" && (
        <FabricJobsHome
          onLogout={handleLogout}
          onMigrateFromSynapse={handleMigrateFromSynapse}
          onMigrateFromDatabricks={handleMigrateFromDatabricks}
          onBackToHub={handleBackToHome}
          userName={user?.name || "User"}
        />
      )}

      {currentView === "synapse-workspace" && synapseApiResponse && (
        <MigrationWorkspace
          onLogout={handleLogout}
          onBack={handleBackToHome}
          onMigrationComplete={handleSynapseMigrationComplete}
          onMigrationUpdate={handleSynapseMigrationUpdate}
          apiResponse={synapseApiResponse}
        />
      )}

      {currentView === "databricks-workspace" && databricksApiResponse && (
        <DatabricksMigrationWorkspace
          onLogout={handleLogout}
          onBack={handleBackToHome}
          onMigrationComplete={handleDatabricksMigrationComplete}
          onMigrationUpdate={handleDatabricksMigrationUpdate}
          onWorkspaceSelected={handleWorkspaceSelected}
          apiResponse={databricksApiResponse}
        />
      )}

      {currentView === "synapse-migration-report" && (
        <MigrationReport
          items={synapseMigrationItems}
          onLogout={handleLogout}
          onBackToHome={handleBackToHome}
          onMigrationUpdate={handleSynapseMigrationUpdate}
          synapseWorkspaceName={synapseWorkspaceName}
        />
      )}

      {currentView === "databricks-migration-report" && (
        <DatabricksMigrationReport
          items={databricksMigrationItems}
          onLogout={handleLogout}
          onBackToHome={handleBackToHome}
          targetWorkspaceId={selectedWorkspaceId}
          onMigrationUpdate={handleDatabricksMigrationUpdate}
        />
      )}

      <ConnectSynapseModal
        open={showSynapseModal}
        onClose={() => setShowSynapseModal(false)}
        onConnect={handleSynapseConnect}
      />

      <ConnectDatabricksModal
        open={showDatabricksModal}
        onClose={() => setShowDatabricksModal(false)}
        onStartMigration={handleDatabricksConnect}
      />
    </>
  );
};

export default Index;