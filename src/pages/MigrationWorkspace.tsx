

//24/02

// import { useState } from "react";
// import { useAzureCredentials } from "@/contexts/AzureCredentialsContext";
// import { AppHeader } from "@/components/AppHeader";
// import { MigrationSidebar } from "@/components/MigrationSidebar";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Checkbox } from "@/components/ui/checkbox";
// import { StatusBadge } from "@/components/StatusBadge";
// import { SelectTargetModal } from "@/components/modals/SelectTargetModal";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "@/components/ui/tabs";
// import {
//   FileText,
//   Search,
//   Filter,
//   Grid,
//   AlertTriangle,
//   CheckCircle2,
//   Database,
//   BookOpen,
//   GitBranch,
//   Link2,
//   ArrowRight,
//   X,
//   ChevronRight,
//   Loader2,
//   ChevronLeft,
// } from "lucide-react";
// import { useFabricCredentials } from "@/contexts/FabricCredentialsContext";
// import { ConnectFabricModal } from "@/components/modals/ConnectFabricModal";

// interface SparkPool {
//   id: string;
//   name: string;
//   runtimeVersion: string;
//   nodeType: string;
//   nodes: number;
//   libraries: string;
//   status: string;
// }

// interface Notebook {
//   id: string;
//   name: string;
//   language: string;
//   lastModified: string;
//   dependencies: number;
//   status: string;
// }

// interface Pipeline {
//   id: string;
//   name: string;
//   activities: number;
//   lastRun: string;
//   status: string;
// }

// interface LinkedService {
//   id: string;
//   name: string;
//   type: string;
//   status: string;
// }

// type TabType = "sparkPools" | "notebooks" | "pipelines" | "linkedServices";

// interface MigrationWorkspaceProps {
//   onLogout: () => void;
//   onBack: () => void;
//   onMigrationComplete: (items: any[]) => void;
//   onMigrationUpdate: (updateFn: (prev: any[]) => any[]) => void;
//   apiResponse: any;
// }

// // Helper function to format error messages from API responses
// function formatErrorMessage(error: any): string | undefined {
//   if (!error) return undefined;

//   if (typeof error === 'string') {
//     try {
//       const parsed = JSON.parse(error);
//       if (parsed.message) {
//         return parsed.message;
//       }
//     } catch {
//       return error;
//     }
//   }

//   if (typeof error === 'object' && error.message) {
//     return error.message;
//   }

//   return JSON.stringify(error);
// }

// export function MigrationWorkspace({
//   onLogout,
//   onBack,
//   onMigrationComplete,
//   onMigrationUpdate,
//   apiResponse
// }: MigrationWorkspaceProps) {
//   const { credentials } = useAzureCredentials();
//   const { credentials: fabricCredentials, setCredentials: setFabricCredentials } = useFabricCredentials();

//   const transformedData = transformApiResponse(apiResponse);

//   const [activeTab, setActiveTab] = useState<TabType>("sparkPools");
//   const [selectedItems, setSelectedItems] = useState<Record<TabType, string[]>>({
//     sparkPools: [],
//     notebooks: [],
//     pipelines: [],
//     linkedServices: [],
//   });
//   const [showReview, setShowReview] = useState(false);
//   const [showTargetModal, setShowTargetModal] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [typeFilter, setTypeFilter] = useState<string>("all");
//   const [isMigrating, setIsMigrating] = useState(false);
//   const [migrationError, setMigrationError] = useState<string | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);

//   const { sparkPools, notebooks, pipelines, linkedServices } = transformedData;

//   const stats = {
//     total: sparkPools.length + notebooks.length + pipelines.length + linkedServices.length,
//     ready: calculateReadyCount(transformedData),
//     conflicts: 0,
//   };
//   const [showFabricModal, setShowFabricModal] = useState(false);

//   const paginateData = (data: any[]) => {
//     const startIndex = (currentPage - 1) * rowsPerPage;
//     return data.slice(startIndex, startIndex + rowsPerPage);
//   };

//   const handleTabChange = (tab: TabType) => {
//     setActiveTab(tab);
//     setCurrentPage(1);
//   };

//   const filterBySearch = <T extends Record<string, any>>(items: T[]) => {
//     if (!searchQuery) return items;
//     const query = searchQuery.toLowerCase();
//     return items.filter(item =>
//       Object.values(item).some(value =>
//         value != null && String(value).toLowerCase().includes(query)
//       )
//     );
//   };

//   const filterByStatus = <T extends { status: string }>(items: T[]) => {
//     if (statusFilter === "all") return items;
//     return items.filter(item => item.status.toLowerCase() === statusFilter.toLowerCase());
//   };

//   const filterByType = (items: any[], tab: TabType) => {
//     if (typeFilter === "all") return items;

//     switch (tab) {
//       case "sparkPools":
//         return items.filter(item => item.nodeType === typeFilter);
//       case "notebooks":
//         return items.filter(item => item.language === typeFilter);
//       case "pipelines":
//         return items;
//       case "linkedServices":
//         return items.filter(item => item.type === typeFilter);
//       default:
//         return items;
//     }
//   };

//   const applyFilters = (items: any[], tab: TabType) => {
//     let filtered = filterBySearch(items);
//     filtered = filterByStatus(filtered);
//     filtered = filterByType(filtered, tab);
//     return filtered;
//   };

//   const filteredSparkPools = applyFilters(sparkPools, "sparkPools");
//   const filteredNotebooks = applyFilters(notebooks, "notebooks");
//   const filteredPipelines = applyFilters(pipelines, "pipelines");
//   const filteredLinkedServices = applyFilters(linkedServices, "linkedServices");

//   const getUniqueStatuses = () => {
//     const allStatuses = new Set<string>();
//     [...sparkPools, ...notebooks, ...pipelines, ...linkedServices]
//       .forEach(item => allStatuses.add(item.status));
//     return Array.from(allStatuses);
//   };

//   const getUniqueTypes = (tab: TabType) => {
//     switch (tab) {
//       case "sparkPools":
//         return Array.from(new Set(sparkPools.map(p => p.nodeType)));
//       case "notebooks":
//         return Array.from(new Set(notebooks.map(n => n.language)));
//       case "linkedServices":
//         return Array.from(new Set(linkedServices.map(l => l.type)));
//       default:
//         return [];
//     }
//   };

//   const toggleSelection = (tab: TabType, id: string) => {
//     setSelectedItems((prev) => ({
//       ...prev,
//       [tab]: prev[tab].includes(id)
//         ? prev[tab].filter((i) => i !== id)
//         : [...prev[tab], id],
//     }));
//   };

//   const toggleAll = (tab: TabType, items: { id: string }[]) => {
//     const allIds = items.map((i) => i.id);
//     const allSelected = allIds.every((id) => selectedItems[tab].includes(id));
//     setSelectedItems((prev) => ({
//       ...prev,
//       [tab]: allSelected ? [] : allIds,
//     }));
//   };

//   const getPlaceholderText = () => {
//     switch (activeTab) {
//       case "sparkPools": return "Filter spark pools...";
//       case "notebooks": return "Filter notebooks...";
//       case "pipelines": return "Filter pipelines...";
//       case "linkedServices": return "Filter linked services...";
//       default: return "Search...";
//     }
//   };

//   const totalSelected =
//     selectedItems.sparkPools.length +
//     selectedItems.notebooks.length +
//     selectedItems.pipelines.length +
//     selectedItems.linkedServices.length;

//   const getSelectedItemDetails = () => {
//     const items: any[] = [];
//     selectedItems.sparkPools.forEach((id) => {
//       const item = sparkPools.find((p) => p.id === id);
//       if (item) items.push({ ...item, type: "SparkPool" });
//     });
//     selectedItems.notebooks.forEach((id) => {
//       const item = notebooks.find((n) => n.id === id);
//       if (item) items.push({ ...item, type: "Notebook" });
//     });
//     selectedItems.pipelines.forEach((id) => {
//       const item = pipelines.find((p) => p.id === id);
//       if (item) items.push({ ...item, type: "Pipeline" });
//     });
//     selectedItems.linkedServices.forEach((id) => {
//       const item = linkedServices.find((l) => l.id === id);
//       if (item) items.push({ ...item, type: "LinkedService" });
//     });
//     return items;
//   };

//   const removeFromSelection = (type: string, id: string) => {
//     const tabMap: Record<string, TabType> = {
//       SparkPool: "sparkPools",
//       Notebook: "notebooks",
//       Pipeline: "pipelines",
//       LinkedService: "linkedServices",
//     };
//     const tab = tabMap[type];
//     if (tab) {
//       setSelectedItems((prev) => ({
//         ...prev,
//         [tab]: prev[tab].filter((i) => i !== id),
//       }));
//     }
//   };

//   const handleFabricConnect = (apiResponse: any) => {
//     setShowFabricModal(false);
//     setShowReview(true);
//   };

//   const handleStartMigration = async (workspace: any) => {
//     setIsMigrating(true);
//     setMigrationError(null);

//     try {
//       if (!fabricCredentials?.tenantId || !fabricCredentials?.clientId || !fabricCredentials?.clientSecret) {
//         setMigrationError("Fabric credentials not found. Please connect to Fabric.");
//         setIsMigrating(false);
//         return;
//       }

//       const selectedDetails = getSelectedItemDetails();

//       // Step 1: Create initial migration items with "Running" status
//       const initialMigrationItems = selectedDetails.map(item => ({
//         id: item.id,
//         name: item.name,
//         type: item.type,
//         status: "Running" as const,
//         targetWorkspace: workspace.name,
//         lastModified: new Date().toISOString(),
//         runtimeVersion: item.runtimeVersion,
//         nodeType: item.nodeType,
//         nodes: item.nodes,
//         language: item.language,
//         dependencies: item.dependencies,
//         activities: item.activities,
//         runId: undefined, // will be set after API responds
//       }));

//       // Step 2: Immediately navigate to report with "Running" status
//       onMigrationComplete(initialMigrationItems);

//       // Step 3: Prepare base payload
//       const basePayload = {
//         synapse: {
//           tenantId: credentials?.tenantId || "",
//           clientId: credentials?.clientId || "",
//           clientSecret: credentials?.clientSecret || "",
//           workspaceName: apiResponse.workspace || ""
//         },
//         fabric: {
//           tenantId: fabricCredentials.tenantId,
//           clientId: fabricCredentials.clientId,
//           clientSecret: fabricCredentials.clientSecret,
//           workspaceId: workspace.id || ""
//         }
//       };

//       // Step 4: Migrate Spark Pools (one at a time)
//       const selectedPools = selectedDetails.filter(item => item.type === "SparkPool");
//       for (const pool of selectedPools) {
//         const sparkPoolPayload = {
//           ...basePayload,
//           selectedPools: [pool.name],
//           migrateConfigs: true
//         };

//         try {
//           const sparkResponse = await fetch(
//             `https://48.217.233.235/SynapseSparkPoolMigration`,
//             {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify(sparkPoolPayload)
//             }
//           );

//           const sparkResult = await sparkResponse.json();
//           console.log("Spark Pool Migration Response:", sparkResult);

//           // Find item in Success or Failed arrays by name
//           const successItem = (sparkResult.Success || []).find((s: any) => s.name === pool.name);
//           const failedItem = (sparkResult.Failed || []).find((f: any) => f.name === pool.name);

//           const isSuccess = !!successItem;
//           const runId = successItem?.run_id || failedItem?.run_id;

//           onMigrationUpdate((prevItems) =>
//             prevItems.map(item =>
//               item.id === pool.id
//                 ? {
//                   ...item,
//                   status: isSuccess ? "Success" : "Failed",
//                   errorMessage: formatErrorMessage(failedItem?.message),
//                   lastModified: new Date().toISOString(),
//                   runId: runId,
//                 }
//                 : item
//             )
//           );
//         } catch (error) {
//           console.error("Spark Pool Migration Error:", error);
//           onMigrationUpdate((prevItems) =>
//             prevItems.map(item =>
//               item.id === pool.id
//                 ? {
//                   ...item,
//                   status: "Failed",
//                   errorMessage: formatErrorMessage(error instanceof Error ? error.message : error),
//                   lastModified: new Date().toISOString(),
//                 }
//                 : item
//             )
//           );
//         }
//       }

//       // Step 5: Migrate Notebooks (one at a time)
//       const selectedNotebooks = selectedDetails.filter(item => item.type === "Notebook");
//       for (const notebook of selectedNotebooks) {
//         const notebookPayload = {
//           ...basePayload,
//           notebooks: [notebook.name]
//         };

//         try {
//           const notebookResponse = await fetch(
//             `https://48.217.233.235/SynapseNotebooksMigration`,
//             {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify(notebookPayload)
//             }
//           );

//           const notebookResult = await notebookResponse.json();
//           console.log("Notebook Migration Response:", notebookResult);

//           // NEW: parse run_id from Success/Failed arrays
//           const successItem = (notebookResult.Success || []).find((s: any) => s.name === notebook.name);
//           const failedItem = (notebookResult.Failed || []).find((f: any) => f.name === notebook.name);

//           // Also handle details array (notebook endpoint uses "details")
//           const detailItem = (notebookResult.details || []).find((d: any) => d.name === notebook.name);

//           const isSuccess = !!successItem || detailItem?.status === "created" || detailItem?.status === "replaced";
//           const isReplaced = detailItem?.status === "replaced";
//           const isSkipped = detailItem?.status === "already-exists";
//           const runId = successItem?.run_id || failedItem?.run_id || detailItem?.run_id;

//           let finalStatus: string;
//           if (isReplaced) finalStatus = "Replaced";
//           else if (isSkipped) finalStatus = "Skipped";
//           else if (isSuccess) finalStatus = "Success";
//           else finalStatus = "Failed";

//           onMigrationUpdate((prevItems) =>
//             prevItems.map(item =>
//               item.id === notebook.id
//                 ? {
//                   ...item,
//                   status: finalStatus,
//                   errorMessage: formatErrorMessage(failedItem?.message),
//                   lastModified: new Date().toISOString(),
//                   runId: runId,
//                 }
//                 : item
//             )
//           );
//         } catch (error) {
//           console.error("Notebook Migration Error:", error);
//           onMigrationUpdate((prevItems) =>
//             prevItems.map(item =>
//               item.id === notebook.id
//                 ? {
//                   ...item,
//                   status: "Failed",
//                   errorMessage: formatErrorMessage(error instanceof Error ? error.message : error),
//                   lastModified: new Date().toISOString(),
//                 }
//                 : item
//             )
//           );
//         }
//       }

//       // Step 6: Migrate Pipelines (one at a time)
//       const selectedPipelines = selectedDetails.filter(item => item.type === "Pipeline");
//       for (const pipeline of selectedPipelines) {
//         const pipelinePayload = {
//           ...basePayload,
//           pipelines: [pipeline.name]
//         };

//         try {
//           const pipelineResponse = await fetch(
//             `https://48.217.233.235/SynapsePipelinesMigration`,
//             {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify(pipelinePayload)
//             }
//           );

//           const pipelineResult = await pipelineResponse.json();
//           console.log("Pipeline Migration Response:", pipelineResult);

//           // NEW: parse run_id from Success/Failed arrays
//           const successItem = (pipelineResult.Success || []).find((s: any) => s.name === pipeline.name);
//           const failedItem = (pipelineResult.Failed || []).find((f: any) => f.name === pipeline.name);

//           const isSuccess = !!successItem;
//           const runId = successItem?.run_id || failedItem?.run_id;

//           onMigrationUpdate((prevItems) =>
//             prevItems.map(item =>
//               item.id === pipeline.id
//                 ? {
//                   ...item,
//                   status: isSuccess ? "Success" : "Failed",
//                   errorMessage: formatErrorMessage(failedItem?.message),
//                   lastModified: new Date().toISOString(),
//                   runId: runId,
//                 }
//                 : item
//             )
//           );
//         } catch (error) {
//           console.error("Pipeline Migration Error:", error);
//           onMigrationUpdate((prevItems) =>
//             prevItems.map(item =>
//               item.id === pipeline.id
//                 ? {
//                   ...item,
//                   status: "Failed",
//                   errorMessage: formatErrorMessage(error instanceof Error ? error.message : error),
//                   lastModified: new Date().toISOString(),
//                 }
//                 : item
//             )
//           );
//         }
//       }

//       // Step 7: Handle Linked Services (not implemented)
//       const selectedLinkedServices = selectedDetails.filter(item => item.type === "LinkedService");
//       for (const service of selectedLinkedServices) {
//         onMigrationUpdate((prevItems) =>
//           prevItems.map(item =>
//             item.id === service.id
//               ? {
//                 ...item,
//                 status: "Failed",
//                 errorMessage: "Linked Services migration not yet implemented",
//                 lastModified: new Date().toISOString(),
//               }
//               : item
//           )
//         );
//       }

//       setIsMigrating(false);

//     } catch (error) {
//       console.error("Migration error:", error);
//       setMigrationError(error instanceof Error ? error.message : "Unknown error occurred");
//       setIsMigrating(false);
//     }
//   };

//   if (showReview) {
//     const selectedDetails = getSelectedItemDetails();
//     return (
//       <div className="min-h-screen bg-background">
//         <main className="p-6 max-w-4xl mx-auto animate-fade-in">
//           <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
//             <button onClick={() => setShowReview(false)} className="hover:text-foreground">
//               Discovery Results
//             </button>
//             <ChevronRight className="w-4 h-4" />
//             <span className="text-foreground font-medium">Review Selection</span>
//           </div>

//           <Card>
//             <CardHeader>
//               <CardTitle>Review Selected Items</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               {selectedItems.sparkPools.length > 0 && (
//                 <div>
//                   <h4 className="font-medium mb-3 flex items-center gap-2">
//                     <Database className="w-4 h-4 text-primary" />
//                     Spark Pools ({selectedItems.sparkPools.length})
//                   </h4>
//                   <div className="space-y-2">
//                     {selectedDetails
//                       .filter((i) => i.type === "SparkPool")
//                       .map((item) => (
//                         <div
//                           key={item.id}
//                           className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
//                         >
//                           <div>
//                             <p className="font-medium">{item.name}</p>
//                             <p className="text-sm text-muted-foreground">
//                               {item.runtimeVersion} • {item.nodeType}
//                             </p>
//                           </div>
//                           <Button
//                             variant="ghost"
//                             size="icon"
//                             onClick={() => removeFromSelection("SparkPool", item.id)}
//                           >
//                             <X className="w-4 h-4" />
//                           </Button>
//                         </div>
//                       ))}
//                   </div>
//                 </div>
//               )}

//               {selectedItems.notebooks.length > 0 && (
//                 <div>
//                   <h4 className="font-medium mb-3 flex items-center gap-2">
//                     <BookOpen className="w-4 h-4 text-primary" />
//                     Notebooks ({selectedItems.notebooks.length})
//                   </h4>
//                   <div className="space-y-2">
//                     {selectedDetails
//                       .filter((i) => i.type === "Notebook")
//                       .map((item) => (
//                         <div
//                           key={item.id}
//                           className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
//                         >
//                           <div>
//                             <p className="font-medium">{item.name}</p>
//                             <p className="text-sm text-muted-foreground">{item.language}</p>
//                           </div>
//                           <Button
//                             variant="ghost"
//                             size="icon"
//                             onClick={() => removeFromSelection("Notebook", item.id)}
//                           >
//                             <X className="w-4 h-4" />
//                           </Button>
//                         </div>
//                       ))}
//                   </div>
//                 </div>
//               )}

//               {selectedItems.pipelines.length > 0 && (
//                 <div>
//                   <h4 className="font-medium mb-3 flex items-center gap-2">
//                     <GitBranch className="w-4 h-4 text-primary" />
//                     Pipelines ({selectedItems.pipelines.length})
//                   </h4>
//                   <div className="space-y-2">
//                     {selectedDetails
//                       .filter((i) => i.type === "Pipeline")
//                       .map((item) => (
//                         <div
//                           key={item.id}
//                           className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
//                         >
//                           <div>
//                             <p className="font-medium">{item.name}</p>
//                             <p className="text-sm text-muted-foreground">
//                               {item.activities} activities
//                             </p>
//                           </div>
//                           <Button
//                             variant="ghost"
//                             size="icon"
//                             onClick={() => removeFromSelection("Pipeline", item.id)}
//                           >
//                             <X className="w-4 h-4" />
//                           </Button>
//                         </div>
//                       ))}
//                   </div>
//                 </div>
//               )}

//               {selectedItems.linkedServices.length > 0 && (
//                 <div>
//                   <h4 className="font-medium mb-3 flex items-center gap-2">
//                     <Link2 className="w-4 h-4 text-primary" />
//                     Linked Services ({selectedItems.linkedServices.length})
//                   </h4>
//                   <div className="space-y-2">
//                     {selectedDetails
//                       .filter((i) => i.type === "LinkedService")
//                       .map((item) => (
//                         <div
//                           key={item.id}
//                           className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
//                         >
//                           <div>
//                             <p className="font-medium">{item.name}</p>
//                             <p className="text-sm text-muted-foreground">{item.type}</p>
//                           </div>
//                           <Button
//                             variant="ghost"
//                             size="icon"
//                             onClick={() => removeFromSelection("LinkedService", item.id)}
//                           >
//                             <X className="w-4 h-4" />
//                           </Button>
//                         </div>
//                       ))}
//                   </div>
//                 </div>
//               )}

//               <div className="flex justify-between pt-4 border-t">
//                 <Button variant="outline" onClick={() => setShowReview(false)}>
//                   Back to Selection
//                 </Button>
//                 <Button
//                   variant="azure"
//                   onClick={() => setShowTargetModal(true)}
//                   disabled={totalSelected === 0 || isMigrating}
//                 >
//                   {isMigrating ? (
//                     <>
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                       Migrating...
//                     </>
//                   ) : (
//                     <>
//                       Migrate
//                       <ArrowRight className="w-4 h-4" />
//                     </>
//                   )}
//                 </Button>
//               </div>

//               {migrationError && (
//                 <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
//                   <strong>Error:</strong> {migrationError}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </main>

//         <SelectTargetModal
//           open={showTargetModal}
//           onClose={() => setShowTargetModal(false)}
//           onConfirm={handleStartMigration}
//         />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-background flex">
//       <MigrationSidebar
//         activeTab={activeTab}
//         onTabChange={(tab) => setActiveTab(tab as TabType)}
//         onBack={onBack}
//         workspaceName={apiResponse.workspace || "Synapse Workspace"}
//       />
//       <div className="flex-1">
//         <main className="p-6 animate-fade-in">
//           {/* Breadcrumb */}
//           <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
//             <span>Home</span>
//             <ChevronRight className="w-4 h-4" />
//             <span>Projects</span>
//             <ChevronRight className="w-4 h-4" />
//             <span>{apiResponse.workspace}</span>
//             <ChevronRight className="w-4 h-4" />
//             <span className="text-foreground font-medium">Discovery Results</span>
//           </div>

//           {/* Header */}
//           <div className="flex items-start justify-between mb-6">
//             <div>
//               <h1 className="text-2xl font-bold text-foreground mb-1">Discovery Results</h1>
//               <p className="text-sm text-success flex items-center gap-1.5">
//                 <CheckCircle2 className="w-4 h-4" />
//                 Scan completed successfully
//               </p>
//             </div>
//             <div className="flex gap-3">
//               <Button
//                 variant="azure"
//                 disabled={totalSelected === 0}
//                 onClick={() => {
//                   if (!fabricCredentials) {
//                     setShowFabricModal(true);
//                   } else {
//                     setShowReview(true);
//                   }
//                 }}
//               >
//                 Migrate Selected
//               </Button>
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="grid grid-cols-3 gap-4 mb-6">
//             <Card className="p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Total Assets</p>
//                   <p className="text-3xl font-bold text-foreground">{stats.total}</p>
//                 </div>
//                 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
//                   <Grid className="w-5 h-5 text-primary" />
//                 </div>
//               </div>
//             </Card>
//             <Card className="p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Ready to Migrate</p>
//                   <p className="text-3xl font-bold text-success">{stats.ready}</p>
//                 </div>
//                 <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
//                   <CheckCircle2 className="w-5 h-5 text-success" />
//                 </div>
//               </div>
//             </Card>
//             <Card className="p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Conflicts / Errors</p>
//                   <p className="text-3xl font-bold text-destructive">{stats.conflicts}</p>
//                 </div>
//                 <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
//                   <AlertTriangle className="w-5 h-5 text-destructive" />
//                 </div>
//               </div>
//             </Card>
//           </div>

//           {/* Tabs */}
//           <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as TabType)}>
//             <TabsList className="bg-muted/50 mb-4">
//               <TabsTrigger value="sparkPools" className="gap-2">
//                 <Database className="w-4 h-4" />
//                 Spark Pools
//                 <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
//                   {sparkPools.length}
//                 </span>
//               </TabsTrigger>
//               <TabsTrigger value="notebooks" className="gap-2">
//                 <BookOpen className="w-4 h-4" />
//                 Notebooks
//                 <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
//                   {notebooks.length}
//                 </span>
//               </TabsTrigger>
//               <TabsTrigger value="pipelines" className="gap-2">
//                 <GitBranch className="w-4 h-4" />
//                 Pipelines
//                 <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
//                   {pipelines.length}
//                 </span>
//               </TabsTrigger>
//               {/* <TabsTrigger value="linkedServices" className="gap-2">
//                 <Link2 className="w-4 h-4" />
//                 Linked Services
//                 <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
//                   {linkedServices.length}
//                 </span>
//               </TabsTrigger> */}
//             </TabsList>

//             {/* Search & Filters */}
//             <div className="flex items-center gap-3 mb-4">
//               <div className="relative flex-1 max-w-sm">
//                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
//                 <Input
//                   placeholder={getPlaceholderText()}
//                   className="pl-9"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                 />
//               </div>

//               <div className="relative">
//                 <select
//                   value={statusFilter}
//                   onChange={(e) => setStatusFilter(e.target.value)}
//                   className="h-9 px-3 pr-8 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground appearance-none cursor-pointer"
//                 >
//                   <option value="all">All Statuses</option>
//                   {getUniqueStatuses().map(status => (
//                     <option key={status} value={status.toLowerCase()}>{status}</option>
//                   ))}
//                 </select>
//                 <Filter className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
//               </div>

//               {(activeTab === "sparkPools" || activeTab === "notebooks" || activeTab === "linkedServices") && (
//                 <div className="relative">
//                   <select
//                     value={typeFilter}
//                     onChange={(e) => setTypeFilter(e.target.value)}
//                     className="h-9 px-3 pr-8 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground appearance-none cursor-pointer"
//                   >
//                     <option value="all">All Types</option>
//                     {getUniqueTypes(activeTab).map(type => (
//                       <option key={type} value={type}>{type}</option>
//                     ))}
//                   </select>
//                   <Filter className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
//                 </div>
//               )}

//               {(searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => {
//                     setSearchQuery("");
//                     setStatusFilter("all");
//                     setTypeFilter("all");
//                   }}
//                 >
//                   <X className="w-4 h-4 mr-1" />
//                   Clear
//                 </Button>
//               )}

//               <div className="ml-auto text-sm text-muted-foreground">
//                 {totalSelected} selected
//               </div>
//             </div>

//             <TabsContent value="sparkPools">
//               <Card>
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead className="w-12">
//                         <Checkbox
//                           checked={filteredSparkPools.length > 0 && filteredSparkPools.every((p) =>
//                             selectedItems.sparkPools.includes(p.id)
//                           )}
//                           onCheckedChange={() => toggleAll("sparkPools", filteredSparkPools)}
//                         />
//                       </TableHead>
//                       <TableHead>POOL NAME</TableHead>
//                       <TableHead>RUNTIME VER.</TableHead>
//                       <TableHead>NODE TYPE</TableHead>
//                       <TableHead>NODES</TableHead>
//                       <TableHead>STATUS</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredSparkPools.length === 0 ? (
//                       <TableRow>
//                         <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
//                           No spark pools found matching your filters
//                         </TableCell>
//                       </TableRow>
//                     ) : (
//                       paginateData(filteredSparkPools).map((pool) => (
//                         <TableRow key={pool.id} className="hover:bg-muted/50">
//                           <TableCell>
//                             <Checkbox
//                               checked={selectedItems.sparkPools.includes(pool.id)}
//                               onCheckedChange={() => toggleSelection("sparkPools", pool.id)}
//                             />
//                           </TableCell>
//                           <TableCell>
//                             <div className="flex items-center gap-2">
//                               <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
//                                 <Database className="w-3 h-3 text-primary" />
//                               </div>
//                               <span className="font-medium text-primary">{pool.name}</span>
//                             </div>
//                           </TableCell>
//                           <TableCell>{pool.runtimeVersion}</TableCell>
//                           <TableCell>{pool.nodeType}</TableCell>
//                           <TableCell>{pool.nodes}</TableCell>
//                           <TableCell>
//                             <StatusBadge status={pool.status} />
//                           </TableCell>
//                         </TableRow>
//                       ))
//                     )}
//                   </TableBody>
//                 </Table>
//               </Card>
//             </TabsContent>

//             <TabsContent value="notebooks">
//               <Card>
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead className="w-12">
//                         <Checkbox
//                           checked={filteredNotebooks.length > 0 && filteredNotebooks.every((n) =>
//                             selectedItems.notebooks.includes(n.id)
//                           )}
//                           onCheckedChange={() => toggleAll("notebooks", filteredNotebooks)}
//                         />
//                       </TableHead>
//                       <TableHead>NOTEBOOK NAME</TableHead>
//                       <TableHead>LANGUAGE</TableHead>
//                       <TableHead>STATUS</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredNotebooks.length === 0 ? (
//                       <TableRow>
//                         <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
//                           No notebooks found matching your filters
//                         </TableCell>
//                       </TableRow>
//                     ) : (
//                       paginateData(filteredNotebooks).map((notebook) => (
//                         <TableRow key={notebook.id} className="hover:bg-muted/50">
//                           <TableCell>
//                             <Checkbox
//                               checked={selectedItems.notebooks.includes(notebook.id)}
//                               onCheckedChange={() => toggleSelection("notebooks", notebook.id)}
//                             />
//                           </TableCell>
//                           <TableCell>
//                             <div className="flex items-center gap-2">
//                               <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
//                                 <BookOpen className="w-3 h-3 text-primary" />
//                               </div>
//                               <span className="font-medium text-primary">{notebook.name}</span>
//                             </div>
//                           </TableCell>
//                           <TableCell>{notebook.language}</TableCell>
//                           <TableCell>
//                             <StatusBadge status={notebook.status} />
//                           </TableCell>
//                         </TableRow>
//                       ))
//                     )}
//                   </TableBody>
//                 </Table>
//               </Card>
//             </TabsContent>

//             <TabsContent value="pipelines">
//               <Card>
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead className="w-12">
//                         <Checkbox
//                           checked={filteredPipelines.length > 0 && filteredPipelines.every((p) =>
//                             selectedItems.pipelines.includes(p.id)
//                           )}
//                           onCheckedChange={() => toggleAll("pipelines", filteredPipelines)}
//                         />
//                       </TableHead>
//                       <TableHead>PIPELINE NAME</TableHead>
//                       <TableHead>ACTIVITIES</TableHead>
//                       <TableHead>STATUS</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredPipelines.length === 0 ? (
//                       <TableRow>
//                         <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
//                           No pipelines found matching your filters
//                         </TableCell>
//                       </TableRow>
//                     ) : (
//                       paginateData(filteredPipelines).map((pipeline) => (
//                         <TableRow key={pipeline.id} className="hover:bg-muted/50">
//                           <TableCell>
//                             <Checkbox
//                               checked={selectedItems.pipelines.includes(pipeline.id)}
//                               onCheckedChange={() => toggleSelection("pipelines", pipeline.id)}
//                             />
//                           </TableCell>
//                           <TableCell>
//                             <div className="flex items-center gap-2">
//                               <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
//                                 <GitBranch className="w-3 h-3 text-primary" />
//                               </div>
//                               <span className="font-medium text-primary">{pipeline.name}</span>
//                             </div>
//                           </TableCell>
//                           <TableCell>{pipeline.activities}</TableCell>
//                           <TableCell>
//                             <StatusBadge status={pipeline.status} />
//                           </TableCell>
//                         </TableRow>
//                       ))
//                     )}
//                   </TableBody>
//                 </Table>
//               </Card>
//             </TabsContent>

//             <TabsContent value="linkedServices">
//               <Card>
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead className="w-12">
//                         <Checkbox
//                           checked={filteredLinkedServices.length > 0 && filteredLinkedServices.every((l) =>
//                             selectedItems.linkedServices.includes(l.id)
//                           )}
//                           onCheckedChange={() => toggleAll("linkedServices", filteredLinkedServices)}
//                         />
//                       </TableHead>
//                       <TableHead>SERVICE NAME</TableHead>
//                       <TableHead>TYPE</TableHead>
//                       <TableHead>STATUS</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredLinkedServices.length === 0 ? (
//                       <TableRow>
//                         <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
//                           No linked services found matching your filters
//                         </TableCell>
//                       </TableRow>
//                     ) : (
//                       paginateData(filteredLinkedServices).map((service) => (
//                         <TableRow key={service.id} className="hover:bg-muted/50">
//                           <TableCell>
//                             <Checkbox
//                               checked={selectedItems.linkedServices.includes(service.id)}
//                               onCheckedChange={() => toggleSelection("linkedServices", service.id)}
//                             />
//                           </TableCell>
//                           <TableCell>
//                             <div className="flex items-center gap-2">
//                               <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
//                                 <Link2 className="w-3 h-3 text-primary" />
//                               </div>
//                               <span className="font-medium text-primary">{service.name}</span>
//                             </div>
//                           </TableCell>
//                           <TableCell>{service.type}</TableCell>
//                           <TableCell>
//                             <StatusBadge status={service.status} />
//                           </TableCell>
//                         </TableRow>
//                       ))
//                     )}
//                   </TableBody>
//                 </Table>
//               </Card>
//             </TabsContent>
//           </Tabs>

//           {/* Pagination */}
//           <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
//             <span>
//               Showing {currentPage === 1 ? 1 : (currentPage - 1) * rowsPerPage + 1}-
//               {Math.min(currentPage * rowsPerPage,
//                 activeTab === "sparkPools" ? filteredSparkPools.length :
//                   activeTab === "notebooks" ? filteredNotebooks.length :
//                     activeTab === "pipelines" ? filteredPipelines.length :
//                       filteredLinkedServices.length
//               )} of {
//                 activeTab === "sparkPools" ? filteredSparkPools.length :
//                   activeTab === "notebooks" ? filteredNotebooks.length :
//                     activeTab === "pipelines" ? filteredPipelines.length :
//                       filteredLinkedServices.length
//               } {activeTab === "sparkPools" ? "pools" :
//                 activeTab === "notebooks" ? "notebooks" :
//                   activeTab === "pipelines" ? "pipelines" : "services"}
//             </span>

//             <div className="flex items-center gap-3">
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="h-8 w-8"
//                 onClick={() => setCurrentPage(p => p - 1)}
//                 disabled={currentPage === 1}
//               >
//                 <ChevronLeft className="w-4 h-4" />
//               </Button>

//               <span className="text-foreground">
//                 Page {currentPage} of {Math.ceil((
//                   activeTab === "sparkPools" ? filteredSparkPools.length :
//                     activeTab === "notebooks" ? filteredNotebooks.length :
//                       activeTab === "pipelines" ? filteredPipelines.length :
//                         filteredLinkedServices.length
//                 ) / rowsPerPage)}
//               </span>

//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="h-8 w-8"
//                 onClick={() => setCurrentPage(p => p + 1)}
//                 disabled={currentPage * rowsPerPage >= (
//                   activeTab === "sparkPools" ? filteredSparkPools.length :
//                     activeTab === "notebooks" ? filteredNotebooks.length :
//                       activeTab === "pipelines" ? filteredPipelines.length :
//                         filteredLinkedServices.length
//                 )}
//               >
//                 <ChevronRight className="w-4 h-4" />
//               </Button>
//             </div>
//           </div>
//         </main>

//         {/* Footer */}
//         <footer className="text-center py-4 text-sm text-muted-foreground border-t">
//           © 2023 Migration Tool v3.1.0
//         </footer>
//       </div>
//       <ConnectFabricModal
//         open={showFabricModal}
//         onClose={() => setShowFabricModal(false)}
//         onConnect={handleFabricConnect}
//       />
//     </div>
//   );
// }

// function transformApiResponse(apiResponse: any) {
//   const sparkPools: SparkPool[] = (apiResponse.sparkPools || []).map((pool: any, index: number) => ({
//     id: pool.id || `pool-${index}`,
//     name: pool.name || `Unnamed Pool ${index + 1}`,
//     runtimeVersion: `Spark ${pool.properties?.sparkVersion || 'N/A'}`,
//     nodeType: pool.properties?.nodeSizeFamily || 'General Purpose',
//     nodes: pool.properties?.nodeCount || 0,
//     libraries: 'N/A',
//     status: pool.properties?.provisioningState === 'Succeeded' ? 'Ready' : 'Pending',
//   }));

//   const notebooks: Notebook[] = (apiResponse.notebooks || []).map((notebook: any, index: number) => {
//     const language = notebook.properties?.metadata?.language_info?.name || 'python';
//     return {
//       id: notebook.id || `notebook-${index}`,
//       name: notebook.name || `Unnamed Notebook ${index + 1}`,
//       language: language.charAt(0).toUpperCase() + language.slice(1),
//       lastModified: 'N/A',
//       dependencies: 0,
//       status: 'Ready',
//     };
//   });

//   const pipelines: Pipeline[] = (apiResponse.pipelines || []).map((pipeline: any, index: number) => ({
//     id: pipeline.id || `pipeline-${index}`,
//     name: pipeline.name || `Unnamed Pipeline ${index + 1}`,
//     activities: pipeline.properties?.activities?.length || 0,
//     lastRun: 'N/A',
//     status: 'Ready',
//   }));

//   const linkedServices: LinkedService[] = (apiResponse.linkedServices || []).map((service: any, index: number) => ({
//     id: service.id || `service-${index}`,
//     name: service.name || `Unnamed Service ${index + 1}`,
//     type: service.properties?.type || 'Unknown',
//     status: 'Ready',
//   }));

//   return { sparkPools, notebooks, pipelines, linkedServices };
// }

// function calculateReadyCount(data: any) {
//   let count = 0;
//   data.sparkPools.forEach((p: any) => p.status === 'Ready' && count++);
//   data.notebooks.forEach((n: any) => n.status === 'Ready' && count++);
//   data.pipelines.forEach((p: any) => p.status === 'Success' && count++);
//   data.linkedServices.forEach((l: any) => l.status === 'Ready' && count++);
//   return count;
// }



//26/02

import { useState } from "react";
import { useAzureCredentials } from "@/contexts/AzureCredentialsContext";
import { MigrationSidebar } from "@/components/MigrationSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/StatusBadge";
import { SelectTargetModal } from "@/components/modals/SelectTargetModal";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Search, Filter, Grid, AlertTriangle, CheckCircle2,
  Database, BookOpen, GitBranch, Link2, ArrowRight,
  X, ChevronRight, Loader2, ChevronLeft,
} from "lucide-react";
import { useFabricCredentials } from "@/contexts/FabricCredentialsContext";
import { ConnectFabricModal } from "@/components/modals/ConnectFabricModal";

interface SparkPool {
  id: string; name: string; runtimeVersion: string;
  nodeType: string; nodes: number; libraries: string; status: string;
}
interface Notebook {
  id: string; name: string; language: string;
  lastModified: string; dependencies: number; status: string;
}
interface Pipeline {
  id: string; name: string; activities: number; lastRun: string; status: string;
}
interface LinkedService {
  id: string; name: string; type: string; status: string;
}

type TabType = "sparkPools" | "notebooks" | "pipelines" | "linkedServices";

interface MigrationWorkspaceProps {
  onLogout: () => void;
  onBack: () => void;
  onMigrationComplete: (items: any[]) => void;
  onMigrationUpdate: (updateFn: (prev: any[]) => any[]) => void;
  apiResponse: any;
}

function formatErrorMessage(error: any): string | undefined {
  if (!error) return undefined;
  if (typeof error === "string") {
    try { const p = JSON.parse(error); if (p.message) return p.message; } catch { return error; }
  }
  if (typeof error === "object" && error.message) return error.message;
  return JSON.stringify(error);
}

export function MigrationWorkspace({
  onLogout, onBack, onMigrationComplete, onMigrationUpdate, apiResponse,
}: MigrationWorkspaceProps) {
  const { credentials } = useAzureCredentials();
  const { credentials: fabricCredentials } = useFabricCredentials();

  const transformedData = transformApiResponse(apiResponse);
  const { sparkPools, notebooks, pipelines, linkedServices } = transformedData;

  const [activeTab, setActiveTab] = useState<TabType>("sparkPools");
  const [selectedItems, setSelectedItems] = useState<Record<TabType, string[]>>({
    sparkPools: [], notebooks: [], pipelines: [], linkedServices: [],
  });
  const [showReview, setShowReview] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [showFabricModal, setShowFabricModal] = useState(false);

  const stats = {
    total: sparkPools.length + notebooks.length + pipelines.length + linkedServices.length,
    ready: calculateReadyCount(transformedData),
    conflicts: 0,
  };

  const paginateData = (data: any[]) =>
    data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleTabChange = (tab: TabType) => { setActiveTab(tab); setCurrentPage(1); };

  const filterBySearch = <T extends Record<string, any>>(items: T[]) => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((i) => Object.values(i).some((v) => v != null && String(v).toLowerCase().includes(q)));
  };
  const filterByStatus = <T extends { status: string }>(items: T[]) =>
    statusFilter === "all" ? items : items.filter((i) => i.status.toLowerCase() === statusFilter.toLowerCase());
  const filterByType = (items: any[], tab: TabType) => {
    if (typeFilter === "all") return items;
    if (tab === "sparkPools")     return items.filter((i) => i.nodeType === typeFilter);
    if (tab === "notebooks")      return items.filter((i) => i.language === typeFilter);
    if (tab === "linkedServices") return items.filter((i) => i.type === typeFilter);
    return items;
  };
  const applyFilters = (items: any[], tab: TabType) =>
    filterByType(filterByStatus(filterBySearch(items)), tab);

  const filteredSparkPools     = applyFilters(sparkPools,      "sparkPools");
  const filteredNotebooks      = applyFilters(notebooks,       "notebooks");
  const filteredPipelines      = applyFilters(pipelines,       "pipelines");
  const filteredLinkedServices = applyFilters(linkedServices,  "linkedServices");

  const getUniqueStatuses = () => {
    const s = new Set<string>();
    [...sparkPools, ...notebooks, ...pipelines, ...linkedServices].forEach((i) => s.add(i.status));
    return Array.from(s);
  };
  const getUniqueTypes = (tab: TabType) => {
    if (tab === "sparkPools")     return Array.from(new Set(sparkPools.map((p) => p.nodeType)));
    if (tab === "notebooks")      return Array.from(new Set(notebooks.map((n) => n.language)));
    if (tab === "linkedServices") return Array.from(new Set(linkedServices.map((l) => l.type)));
    return [];
  };

  const toggleSelection = (tab: TabType, id: string) =>
    setSelectedItems((prev) => ({
      ...prev,
      [tab]: prev[tab].includes(id) ? prev[tab].filter((i) => i !== id) : [...prev[tab], id],
    }));
  const toggleAll = (tab: TabType, items: { id: string }[]) => {
    const allIds = items.map((i) => i.id);
    const allSelected = allIds.every((id) => selectedItems[tab].includes(id));
    setSelectedItems((prev) => ({ ...prev, [tab]: allSelected ? [] : allIds }));
  };

  const totalSelected =
    selectedItems.sparkPools.length + selectedItems.notebooks.length +
    selectedItems.pipelines.length + selectedItems.linkedServices.length;

  const getSelectedItemDetails = () => {
    const items: any[] = [];
    selectedItems.sparkPools.forEach((id) => { const i = sparkPools.find((p) => p.id === id); if (i) items.push({ ...i, type: "SparkPool" }); });
    selectedItems.notebooks.forEach((id) => { const i = notebooks.find((n) => n.id === id); if (i) items.push({ ...i, type: "Notebook" }); });
    selectedItems.pipelines.forEach((id) => { const i = pipelines.find((p) => p.id === id); if (i) items.push({ ...i, type: "Pipeline" }); });
    selectedItems.linkedServices.forEach((id) => { const i = linkedServices.find((l) => l.id === id); if (i) items.push({ ...i, type: "LinkedService" }); });
    return items;
  };

  const removeFromSelection = (type: string, id: string) => {
    const tabMap: Record<string, TabType> = {
      SparkPool: "sparkPools", Notebook: "notebooks",
      Pipeline: "pipelines",   LinkedService: "linkedServices",
    };
    const tab = tabMap[type];
    if (tab) setSelectedItems((prev) => ({ ...prev, [tab]: prev[tab].filter((i) => i !== id) }));
  };

  // ── Base payload builder ───────────────────────────────────────────────────
  const buildBasePayload = (workspaceId: string) => ({
    synapse: {
      tenantId:      credentials?.tenantId     || "",
      clientId:      credentials?.clientId     || "",
      clientSecret:  credentials?.clientSecret || "",
      workspaceName: apiResponse.workspace     || "",
    },
    fabric: {
      tenantId:     fabricCredentials!.tenantId,
      clientId:     fabricCredentials!.clientId,
      clientSecret: fabricCredentials!.clientSecret,
      workspaceId,
    },
  });

  // =========================================================
  // NOTEBOOK MIGRATION
  // ✅ FIXED: Now mirrors DatabricksMigrationWorkspace exactly.
  //    - "already-exists" → set status "Failed" + errorMessage "already exists"
  //    - MigrationReport detects this and shows ReplaceNotebooksDialog
  //    - No more _replaceContext passing through state
  // =========================================================
  const migrateNotebooks = async (
    workspace: any,
    notebooksToMigrate: any[],
    replaceIfExists: boolean
  ): Promise<void> => {
    const payload = {
      ...buildBasePayload(workspace.id),
      notebooks: notebooksToMigrate.map((nb) => nb.name),
      replaceIfExists,
    };

    console.log("📤 Synapse Notebook migration payload:", payload);

    try {
      const response = await fetch("https://20.106.196.248/SynapseNotebooksMigration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("📊 Synapse Notebook response:", JSON.stringify(result, null, 2));

      notebooksToMigrate.forEach((notebook) => {
        const detail = (result.details || []).find((d: any) => d.name === notebook.name);
        const runId: string | undefined = detail?.run_id;

        if (!detail) {
          onMigrationUpdate((prev) =>
            prev.map((item) =>
              item.id === notebook.id
                ? { ...item, status: "Failed", errorMessage: "Not returned in API response", runId, targetWorkspace: workspace.name }
                : item
            )
          );
          return;
        }

        let status: string = "Failed";
        let errorMessage: string | undefined;

        if (detail.status === "created") {
          status = "Success";
        } else if (detail.status === "replaced") {
          status = "Replaced";
        } else if (detail.status === "already-exists" || detail.status === "skipped") {
          // ✅ KEY FIX: Set Failed + "already exists" so MigrationReport
          //    detects it the same way DatabricksMigrationReport does
          status = "Failed";
          errorMessage = "already exists";
        } else if (detail.status === "failed" || detail.status === "export-failed") {
          status = "Failed";
          errorMessage = detail.error || "Migration failed";
        } else {
          status = "Failed";
          errorMessage = `Unknown status: ${detail.status}`;
        }

        onMigrationUpdate((prev) =>
          prev.map((item) =>
            item.id === notebook.id
              ? { ...item, status, errorMessage, runId, targetWorkspace: workspace.name }
              : item
          )
        );
      });

    } catch (error) {
      console.error("💥 Notebook migration error:", error);
      notebooksToMigrate.forEach((notebook) => {
        onMigrationUpdate((prev) =>
          prev.map((item) =>
            item.id === notebook.id
              ? { ...item, status: "Failed", errorMessage: error instanceof Error ? error.message : "Migration failed", targetWorkspace: workspace.name }
              : item
          )
        );
      });
    }
  };

  // =========================================================
  // SPARK POOL MIGRATION
  // =========================================================
  const migrateSparkPool = async (workspace: any, pool: any) => {
    try {
      const res    = await fetch("https://20.106.196.248/SynapseSparkPoolMigration", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildBasePayload(workspace.id), selectedPools: [pool.name], migrateConfigs: true }),
      });
      const result = await res.json();
      const s = (result.Success || []).find((x: any) => x.name === pool.name);
      const f = (result.Failed  || []).find((x: any) => x.name === pool.name);
      onMigrationUpdate((prev) =>
        prev.map((item) =>
          item.id === pool.id
            ? { ...item, status: s ? "Success" : "Failed", errorMessage: formatErrorMessage(f?.message), runId: s?.run_id || f?.run_id, targetWorkspace: workspace.name }
            : item
        )
      );
    } catch (error) {
      onMigrationUpdate((prev) =>
        prev.map((item) =>
          item.id === pool.id
            ? { ...item, status: "Failed", errorMessage: formatErrorMessage(error instanceof Error ? error.message : error), targetWorkspace: workspace.name }
            : item
        )
      );
    }
  };

  // =========================================================
  // PIPELINE MIGRATION
  // =========================================================
  const migratePipeline = async (workspace: any, pipeline: any) => {
    try {
      const res    = await fetch("https://20.106.196.248/SynapsePipelinesMigration", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildBasePayload(workspace.id), pipelines: [pipeline.name] }),
      });
      const result = await res.json();
      const s = (result.Success || []).find((x: any) => x.name === pipeline.name);
      const f = (result.Failed  || []).find((x: any) => x.name === pipeline.name);
      onMigrationUpdate((prev) =>
        prev.map((item) =>
          item.id === pipeline.id
            ? { ...item, status: s ? "Success" : "Failed", errorMessage: formatErrorMessage(f?.message), runId: s?.run_id || f?.run_id, targetWorkspace: workspace.name }
            : item
        )
      );
    } catch (error) {
      onMigrationUpdate((prev) =>
        prev.map((item) =>
          item.id === pipeline.id
            ? { ...item, status: "Failed", errorMessage: formatErrorMessage(error instanceof Error ? error.message : error), targetWorkspace: workspace.name }
            : item
        )
      );
    }
  };

  // =========================================================
  // MAIN MIGRATION HANDLER
  // =========================================================
  const handleStartMigration = async (workspace: any) => {
    const selectedDetails = getSelectedItemDetails();

    if (selectedDetails.length === 0) return;

    if (!fabricCredentials?.tenantId || !fabricCredentials?.clientId || !fabricCredentials?.clientSecret) {
      setMigrationError("Fabric credentials not found. Please connect to Fabric.");
      return;
    }

    setIsMigrating(true);
    setMigrationError(null);
    setShowTargetModal(false);

    // Step 1: Build initial items with "Running"
    const initialMigrationItems = selectedDetails.map((item) => ({
      id:                item.id,
      name:              item.name,
      type:              item.type,
      status:            "Running" as const,
      targetWorkspace:   workspace.name,
      // ✅ Store workspaceId so MigrationReport can use it for the replace API call
      targetWorkspaceId: workspace.id,
      lastModified:      new Date().toISOString(),
      runtimeVersion:    item.runtimeVersion,
      nodeType:          item.nodeType,
      nodes:             item.nodes,
      language:          item.language,
      dependencies:      item.dependencies,
      activities:        item.activities,
      runId:             undefined,
    }));

    // Step 2: Navigate to report immediately
    onMigrationComplete(initialMigrationItems);

    // Step 3: Fire all migrations in parallel
    const selectedPools          = selectedDetails.filter((i) => i.type === "SparkPool");
    const selectedNotebooks      = selectedDetails.filter((i) => i.type === "Notebook");
    const selectedPipelines      = selectedDetails.filter((i) => i.type === "Pipeline");
    const selectedLinkedServices = selectedDetails.filter((i) => i.type === "LinkedService");

    try {
      await Promise.all([
        Promise.allSettled(selectedPools.map((pool) => migrateSparkPool(workspace, pool))),
        Promise.allSettled(selectedPipelines.map((pl) => migratePipeline(workspace, pl))),
        selectedNotebooks.length > 0
          ? migrateNotebooks(workspace, selectedNotebooks, false)
          : Promise.resolve(),
      ]);

      // Linked Services (not yet implemented)
      selectedLinkedServices.forEach((service) => {
        onMigrationUpdate((prev) =>
          prev.map((item) =>
            item.id === service.id
              ? { ...item, status: "Failed", errorMessage: "Linked Services migration not yet implemented", targetWorkspace: workspace.name }
              : item
          )
        );
      });

    } catch (error) {
      console.error("💥 Migration error:", error);
    } finally {
      setIsMigrating(false);
    }
  };

  // =========================================================
  // REVIEW VIEW
  // =========================================================
  if (showReview) {
    const selectedDetails = getSelectedItemDetails();
    // function setShowDataMigration(arg0: boolean): void {
    //   throw new Error("Function not implemented.");
    // }

    return (
      <div className="min-h-screen bg-background">
        <main className="p-6 max-w-4xl mx-auto animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <button onClick={() => setShowReview(false)} className="hover:text-foreground">Discovery Results</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Review Selection</span>
          </div>

          <Card>
            <CardHeader><CardTitle>Review Selected Items</CardTitle></CardHeader>
            <CardContent className="space-y-6">

              {selectedItems.sparkPools.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-primary" />Spark Pools ({selectedItems.sparkPools.length})</h4>
                  <div className="space-y-2">
                    {selectedDetails.filter((i) => i.type === "SparkPool").map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">{item.runtimeVersion} • {item.nodeType}</p></div>
                        <Button variant="ghost" size="icon" onClick={() => removeFromSelection("SparkPool", item.id)}><X className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItems.notebooks.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />Notebooks ({selectedItems.notebooks.length})</h4>
                  <div className="space-y-2">
                    {selectedDetails.filter((i) => i.type === "Notebook").map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">{item.language}</p></div>
                        <Button variant="ghost" size="icon" onClick={() => removeFromSelection("Notebook", item.id)}><X className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItems.pipelines.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2"><GitBranch className="w-4 h-4 text-primary" />Pipelines ({selectedItems.pipelines.length})</h4>
                  <div className="space-y-2">
                    {selectedDetails.filter((i) => i.type === "Pipeline").map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">{item.activities} activities</p></div>
                        <Button variant="ghost" size="icon" onClick={() => removeFromSelection("Pipeline", item.id)}><X className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItems.linkedServices.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" />Linked Services ({selectedItems.linkedServices.length})</h4>
                  <div className="space-y-2">
                    {selectedDetails.filter((i) => i.type === "LinkedService").map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">{item.type}</p></div>
                        <Button variant="ghost" size="icon" onClick={() => removeFromSelection("LinkedService", item.id)}><X className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setShowReview(false)}>Back to Selection</Button>
                 <div className="flex gap-3">
                {/* New Data Migration Button */}
                {/*<Button
                  variant="azure"
                  onClick={() => setShowDataMigration(true)} // adjust handler as needed
                  disabled={isMigrating}
                >
                  Data Migration
                </Button> */}
    </div>
                <Button variant="azure" onClick={() => setShowTargetModal(true)} disabled={totalSelected === 0 || isMigrating}>
                  {isMigrating ? <><Loader2 className="w-4 h-4 animate-spin" /> Migrating...</> : <>Migrate <ArrowRight className="w-4 h-4" /></>}
                </Button>
              </div>

              {migrationError && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  <strong>Error:</strong> {migrationError}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        <SelectTargetModal
          open={showTargetModal}
          onClose={() => setShowTargetModal(false)}
          onConfirm={handleStartMigration}
        />
      </div>
    );
  }

  // =========================================================
  // MAIN INVENTORY VIEW
  // =========================================================
  return (
    <div className="min-h-screen bg-background flex">
      <MigrationSidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabType)}
        onBack={onBack}
        workspaceName={apiResponse.workspace || "Synapse Workspace"}
      />
      <div className="flex-1">
        <main className="p-6 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span>Home</span><ChevronRight className="w-4 h-4" />
            <span>Projects</span><ChevronRight className="w-4 h-4" />
            <span>{apiResponse.workspace}</span><ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Discovery Results</span>
          </div>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Discovery Results</h1>
              <p className="text-sm text-success flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />Scan completed successfully</p>
            </div>
            <Button variant="azure" disabled={totalSelected === 0} onClick={() => { if (!fabricCredentials) setShowFabricModal(true); else setShowReview(true); }}>
              Migrate Selected
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Assets", value: stats.total, icon: Grid, color: "primary" },
              { label: "Ready to Migrate", value: stats.ready, icon: CheckCircle2, color: "success" },
              { label: "Conflicts / Errors", value: stats.conflicts, icon: AlertTriangle, color: "destructive" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className={`text-3xl font-bold text-${color}`}>{value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${color}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as TabType)}>
            <TabsList className="bg-muted/50 mb-4">
              {[
                { value: "sparkPools", label: "Spark Pools", icon: Database, count: sparkPools.length },
                { value: "notebooks",  label: "Notebooks",   icon: BookOpen, count: notebooks.length },
                { value: "pipelines",  label: "Pipelines",   icon: GitBranch, count: pipelines.length },
              ].map(({ value, label, icon: Icon, count }) => (
                <TabsTrigger key={value} value={value} className="gap-2">
                  <Icon className="w-4 h-4" />{label}
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">{count}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={`Filter ${activeTab}...`} className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="relative">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 pr-8 text-sm rounded-md border border-input bg-background appearance-none cursor-pointer">
                  <option value="all">All Statuses</option>
                  {getUniqueStatuses().map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                </select>
                <Filter className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              {(activeTab === "sparkPools" || activeTab === "notebooks" || activeTab === "linkedServices") && (
                <div className="relative">
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 px-3 pr-8 text-sm rounded-md border border-input bg-background appearance-none cursor-pointer">
                    <option value="all">All Types</option>
                    {getUniqueTypes(activeTab).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <Filter className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              )}
              {(searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setTypeFilter("all"); }}>
                  <X className="w-4 h-4 mr-1" />Clear
                </Button>
              )}
              <div className="ml-auto text-sm text-muted-foreground">{totalSelected} selected</div>
            </div>

            {/* Spark Pools tab */}
            <TabsContent value="sparkPools">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"><Checkbox checked={filteredSparkPools.length > 0 && filteredSparkPools.every((p) => selectedItems.sparkPools.includes(p.id))} onCheckedChange={() => toggleAll("sparkPools", filteredSparkPools)} /></TableHead>
                      <TableHead>POOL NAME</TableHead><TableHead>RUNTIME VER.</TableHead>
                      <TableHead>NODE TYPE</TableHead><TableHead>NODES</TableHead><TableHead>STATUS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSparkPools.length === 0
                      ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No spark pools found</TableCell></TableRow>
                      : paginateData(filteredSparkPools).map((pool) => (
                        <TableRow key={pool.id} className="hover:bg-muted/50">
                          <TableCell><Checkbox checked={selectedItems.sparkPools.includes(pool.id)} onCheckedChange={() => toggleSelection("sparkPools", pool.id)} /></TableCell>
                          <TableCell><div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center"><Database className="w-3 h-3 text-primary" /></div><span className="font-medium text-primary">{pool.name}</span></div></TableCell>
                          <TableCell>{pool.runtimeVersion}</TableCell><TableCell>{pool.nodeType}</TableCell>
                          <TableCell>{pool.nodes}</TableCell><TableCell><StatusBadge status={pool.status} /></TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Notebooks tab */}
            <TabsContent value="notebooks">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"><Checkbox checked={filteredNotebooks.length > 0 && filteredNotebooks.every((n) => selectedItems.notebooks.includes(n.id))} onCheckedChange={() => toggleAll("notebooks", filteredNotebooks)} /></TableHead>
                      <TableHead>NOTEBOOK NAME</TableHead><TableHead>LANGUAGE</TableHead><TableHead>STATUS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotebooks.length === 0
                      ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No notebooks found</TableCell></TableRow>
                      : paginateData(filteredNotebooks).map((notebook) => (
                        <TableRow key={notebook.id} className="hover:bg-muted/50">
                          <TableCell><Checkbox checked={selectedItems.notebooks.includes(notebook.id)} onCheckedChange={() => toggleSelection("notebooks", notebook.id)} /></TableCell>
                          <TableCell><div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center"><BookOpen className="w-3 h-3 text-primary" /></div><span className="font-medium text-primary">{notebook.name}</span></div></TableCell>
                          <TableCell>{notebook.language}</TableCell><TableCell><StatusBadge status={notebook.status} /></TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Pipelines tab */}
            <TabsContent value="pipelines">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"><Checkbox checked={filteredPipelines.length > 0 && filteredPipelines.every((p) => selectedItems.pipelines.includes(p.id))} onCheckedChange={() => toggleAll("pipelines", filteredPipelines)} /></TableHead>
                      <TableHead>PIPELINE NAME</TableHead><TableHead>ACTIVITIES</TableHead><TableHead>STATUS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPipelines.length === 0
                      ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No pipelines found</TableCell></TableRow>
                      : paginateData(filteredPipelines).map((pipeline) => (
                        <TableRow key={pipeline.id} className="hover:bg-muted/50">
                          <TableCell><Checkbox checked={selectedItems.pipelines.includes(pipeline.id)} onCheckedChange={() => toggleSelection("pipelines", pipeline.id)} /></TableCell>
                          <TableCell><div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center"><GitBranch className="w-3 h-3 text-primary" /></div><span className="font-medium text-primary">{pipeline.name}</span></div></TableCell>
                          <TableCell>{pipeline.activities}</TableCell><TableCell><StatusBadge status={pipeline.status} /></TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>
              Showing {currentPage === 1 ? 1 : (currentPage - 1) * rowsPerPage + 1}–
              {Math.min(currentPage * rowsPerPage, activeTab === "sparkPools" ? filteredSparkPools.length : activeTab === "notebooks" ? filteredNotebooks.length : activeTab === "pipelines" ? filteredPipelines.length : filteredLinkedServices.length)} of{" "}
              {activeTab === "sparkPools" ? filteredSparkPools.length : activeTab === "notebooks" ? filteredNotebooks.length : activeTab === "pipelines" ? filteredPipelines.length : filteredLinkedServices.length}{" "}
              {activeTab === "sparkPools" ? "pools" : activeTab === "notebooks" ? "notebooks" : activeTab === "pipelines" ? "pipelines" : "services"}
            </span>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-foreground">Page {currentPage} of {Math.max(1, Math.ceil((activeTab === "sparkPools" ? filteredSparkPools.length : activeTab === "notebooks" ? filteredNotebooks.length : activeTab === "pipelines" ? filteredPipelines.length : filteredLinkedServices.length) / rowsPerPage))}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage * rowsPerPage >= (activeTab === "sparkPools" ? filteredSparkPools.length : activeTab === "notebooks" ? filteredNotebooks.length : activeTab === "pipelines" ? filteredPipelines.length : filteredLinkedServices.length)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </main>
        <footer className="text-center py-4 text-sm text-muted-foreground border-t">© 2023 Migration Tool v3.1.0</footer>
      </div>

      <ConnectFabricModal
        open={showFabricModal}
        onClose={() => setShowFabricModal(false)}
        onConnect={() => { setShowFabricModal(false); setShowReview(true); }}
      />
    </div>
  );
}

function transformApiResponse(apiResponse: any) {
  const sparkPools: SparkPool[] = (apiResponse.sparkPools || []).map((pool: any, i: number) => ({
    id: pool.id || `pool-${i}`, name: pool.name || `Unnamed Pool ${i + 1}`,
    runtimeVersion: `Spark ${pool.properties?.sparkVersion || "N/A"}`,
    nodeType: pool.properties?.nodeSizeFamily || "General Purpose",
    nodes: pool.properties?.nodeCount || 0, libraries: "N/A",
    status: pool.properties?.provisioningState === "Succeeded" ? "Ready" : "Pending",
  }));
  const notebooks: Notebook[] = (apiResponse.notebooks || []).map((nb: any, i: number) => {
    const lang = nb.properties?.metadata?.language_info?.name || "python";
    return { id: nb.id || `notebook-${i}`, name: nb.name || `Unnamed Notebook ${i + 1}`, language: lang.charAt(0).toUpperCase() + lang.slice(1), lastModified: "N/A", dependencies: 0, status: "Ready" };
  });
  const pipelines: Pipeline[] = (apiResponse.pipelines || []).map((pl: any, i: number) => ({
    id: pl.id || `pipeline-${i}`, name: pl.name || `Unnamed Pipeline ${i + 1}`,
    activities: pl.properties?.activities?.length || 0, lastRun: "N/A", status: "Ready",
  }));
  const linkedServices: LinkedService[] = (apiResponse.linkedServices || []).map((svc: any, i: number) => ({
    id: svc.id || `service-${i}`, name: svc.name || `Unnamed Service ${i + 1}`,
    type: svc.properties?.type || "Unknown", status: "Ready",
  }));
  return { sparkPools, notebooks, pipelines, linkedServices };
}

function calculateReadyCount(data: any) {
  let count = 0;
  data.sparkPools.forEach((p: any) => p.status === "Ready" && count++);
  data.notebooks.forEach((n: any) => n.status === "Ready" && count++);
  data.pipelines.forEach((p: any) => p.status === "Success" && count++);
  data.linkedServices.forEach((l: any) => l.status === "Ready" && count++);
  return count;
}