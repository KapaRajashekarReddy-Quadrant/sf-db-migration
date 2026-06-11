// import { useState, useMemo, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Card, CardContent, CardDescription, CardHeader, CardTitle,
// } from "@/components/ui/card";
// import {
//   Table, TableBody, TableCell, TableHead,
//   TableHeader, TableRow,
// } from "@/components/ui/table";
// import {
//   Select, SelectContent, SelectItem,
//   SelectTrigger, SelectValue,
// } from "@/components/ui/select";
// import { StatusBadge } from "@/components/StatusBadge";
// import {
//   Database, Cable, User, ArrowLeft,
//   Briefcase, BookOpen, Server, ChevronLeft, ChevronRight,
//   FolderOpen, Search, X,
// } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import { ConnectDatabricksModal } from "@/components/modals/SnowflakeToDatabricks/ConnectToDatabricks";
// import { ConnectSnowflakeModal } from "@/components/modals/SnowflakeToDatabricks/ConnectSnowflakeModal";
// import DetailModal from "../../components/modals/DetailModal"
// import type { Status } from "@/types/migration";

// interface DatabricksJob {
//   id: string;
//   name: string;
//   type: "Job" | "Notebook" | "Cluster";
//   workspace: string;
//   status: Status;
// }

// interface DatabricksJobsHomeProps {
//   onMigrateFromSnowflake: (apiResponse: any) => void;
//   onBackToHub: () => void;
//   userName?: string;
// }

// export function DatabricksJobsHome({
//   onMigrateFromSnowflake,
//   onBackToHub,
//   userName = "User",
// }: DatabricksJobsHomeProps) {
//   const [isConnected, setIsConnected]           = useState(false);
//   const [jobs, setJobs]                         = useState<DatabricksJob[]>([]);
//   const [showDatabricksModal, setShowDatabricksModal] = useState(false);
//   const [showSnowflakeModal, setShowSnowflakeModal]   = useState(false);
//   const [searchQuery, setSearchQuery]           = useState("");
//   const [typeFilter, setTypeFilter]             = useState("all");
//   const [currentPage, setCurrentPage]           = useState(1);
//   const [selectedItem, setSelectedItem]         = useState<any>(null);
//   const itemsPerPage = 5;

//   const handleDatabricksConnect = (config: any, apiResponse: any) => {
//     const transformed: DatabricksJob[] = [
//       ...(apiResponse.jobs || []).map((j: any, i: number) => ({
//         id: j.job_id?.toString() || `job-${i}`,
//         name: j.settings?.name || `Job ${i + 1}`,
//         type: "Job" as const,
//         workspace: config.workspaceUrl,
//         status: "Ready" as Status,
//       })),
//       ...(apiResponse.notebooks || []).map((n: any, i: number) => ({
//         id: `nb-${i}`,
//         name: n.name || n.path?.split("/").pop() || `Notebook ${i + 1}`,
//         type: "Notebook" as const,
//         workspace: config.workspaceUrl,
//         status: "Ready" as Status,
//       })),
//       ...(apiResponse.clusters || []).map((c: any, i: number) => ({
//         id: c.cluster_id || `cl-${i}`,
//         name: c.cluster_name || `Cluster ${i + 1}`,
//         type: "Cluster" as const,
//         workspace: config.workspaceUrl,
//         status: "Ready" as Status,
//       })),
//     ];
//     setJobs(transformed);
//     setIsConnected(true);
//     setShowDatabricksModal(false);
//   };

//   const getTypeIcon = (type: string) => {
//     switch (type) {
//       case "Job":      return Briefcase;
//       case "Notebook": return BookOpen;
//       case "Cluster":  return Server;
//       default:         return FolderOpen;
//     }
//   };

//   // ── Derived counts ─────────────────────────────────────────────────────────
//   const typeCounts = useMemo(() => {
//     const counts: Record<string, number> = {};
//     jobs.forEach((job) => {
//       counts[job.type] = (counts[job.type] || 0) + 1;
//     });
//     return counts;
//   }, [jobs]);

//   const uniqueTypes = useMemo(() => Object.keys(typeCounts), [typeCounts]);

//   // ── Filtering ──────────────────────────────────────────────────────────────
//   const filteredJobs = useMemo(() =>
//     jobs.filter((job) => {
//       const matchesSearch =
//         job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         job.type.toLowerCase().includes(searchQuery.toLowerCase());
//       const matchesType = typeFilter === "all" || job.type === typeFilter;
//       return matchesSearch && matchesType;
//     }),
//     [jobs, searchQuery, typeFilter]
//   );

//   // ── Pagination ─────────────────────────────────────────────────────────────
//   const totalPages  = Math.ceil(filteredJobs.length / itemsPerPage);
//   const startIndex  = (currentPage - 1) * itemsPerPage;
//   const endIndex    = startIndex + itemsPerPage;
//   const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

//   useEffect(() => { setCurrentPage(1); }, [searchQuery, typeFilter]);

//   const hasActiveFilters = searchQuery || typeFilter !== "all";

//   const clearFilters = () => {
//     setSearchQuery("");
//     setTypeFilter("all");
//     setCurrentPage(1);
//   };

//   return (
//     <div className={`${isConnected ? "min-h-[calc(100vh-3.5rem)]" : "h-[calc(100vh-3.5rem)]"} flex flex-col bg-background ${!isConnected ? "overflow-hidden" : ""}`}>
//       <main className={`flex-1 px-6 py-4 max-w-7xl mx-auto w-full flex flex-col ${!isConnected ? "overflow-hidden" : ""}`}>

//         {/* Header */}
//         <div className="mb-3 flex-shrink-0">
//           <button
//             onClick={onBackToHub}
//             className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             Back to hub
//           </button>
//           <h1 className="text-2xl font-bold text-foreground mb-1">Databricks Migration Hub</h1>
//           <div className="flex items-center gap-4 text-sm text-muted-foreground">
//             <span className="flex items-center gap-1.5">
//               <User className="w-4 h-4" />
//               Owner: {userName}
//             </span>
//             <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
//               ● Active
//             </span>
//           </div>
//         </div>

//         {/* Quick Actions */}
//         <Card className="mb-3 flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
//           <CardContent className="py-3 flex items-center justify-between">
//             <div>
//               <h3 className="font-semibold text-foreground mb-1">Quick Actions</h3>
//               <p className="text-sm text-muted-foreground">
//                 Connect your environments to start the migration process.
//               </p>
//             </div>
//             <div className="flex gap-3">
//               {!isConnected && (
//                 <Button variant="azure-outline" onClick={() => setShowDatabricksModal(true)}>
//                   <Database className="w-4 h-4" />
//                   Connect to Databricks
//                 </Button>
//               )}
//               <Button variant="azure" onClick={() => setShowSnowflakeModal(true)}>
//                 <Cable className="w-4 h-4" />
//                 Migrate from Snowflake
//               </Button>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Jobs card */}
//         <Card className={`${isConnected ? "mb-4" : "flex-1"} flex flex-col ${!isConnected ? "overflow-hidden min-h-0" : ""}`}>
//           <CardHeader className="pb-3 flex-shrink-0">
//             <div className="flex items-center justify-between mb-3">
//               <div>
//                 <CardTitle className="text-sm">Databricks Jobs</CardTitle>
//                 <CardDescription>Monitor job status across your Databricks workspace</CardDescription>
//               </div>
      
//             </div>

//             {/* Type count tiles */}
//             {isConnected && Object.keys(typeCounts).length > 0 && (
//               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
//                 {/* All */}
//                 <Card
//                   className="cursor-pointer hover:bg-accent/50 transition-colors"
//                   onClick={() => setTypeFilter("all")}
//                 >
//                   <CardContent className="p-3">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-2xl font-bold">{jobs.length}</p>
//                         <p className="text-xs text-muted-foreground mt-1">All</p>
//                       </div>
//                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeFilter === "all" ? "bg-primary/20" : "bg-muted"}`}>
//                         <FolderOpen className={`w-5 h-5 ${typeFilter === "all" ? "text-primary" : "text-muted-foreground"}`} />
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>

//                 {/* Per-type */}
//                 {Object.entries(typeCounts).map(([type, count]) => {
//                   const Icon = getTypeIcon(type);
//                   return (
//                     <Card
//                       key={type}
//                       className="cursor-pointer hover:bg-accent/50 transition-colors"
//                       onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
//                     >
//                       <CardContent className="p-3">
//                         <div className="flex items-center justify-between">
//                           <div>
//                             <p className="text-2xl font-bold">{count}</p>
//                             <p className="text-xs text-muted-foreground mt-1 truncate">{type}</p>
//                           </div>
//                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeFilter === type ? "bg-primary/20" : "bg-muted"}`}>
//                             <Icon className={`w-5 h-5 ${typeFilter === type ? "text-primary" : "text-muted-foreground"}`} />
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   );
//                 })}
//               </div>
//             )}

//             {/* Search + filters */}
//             {isConnected && (
//               <div className="flex items-center gap-2">
//                 <div className="relative flex-1">
//                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//                   <Input
//                     placeholder="Search jobs..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="pl-9 h-9"
//                   />
//                 </div>

//                 <Select value={typeFilter} onValueChange={setTypeFilter}>
//                   <SelectTrigger className="w-36 h-9">
//                     <SelectValue placeholder="Type" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Types</SelectItem>
//                     {uniqueTypes.map((type) => (
//                       <SelectItem key={type} value={type}>{type}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>

//                 {hasActiveFilters && (
//                   <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
//                     <X className="w-4 h-4 mr-1" />
//                     Clear
//                   </Button>
//                 )}
//               </div>
//             )}
//           </CardHeader>

//           {!isConnected ? (
//             <div className="flex-1 flex items-center justify-center text-center">
//               <div className="pb-20">
//                 <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
//                   <Database className="w-8 h-8 text-muted-foreground" />
//                 </div>
//                 <h3 className="font-semibold mb-2">No Connection</h3>
//                 <p className="text-sm text-muted-foreground mb-4">
//                   Connect to Databricks to view your jobs
//                 </p>
//                 <Button variant="azure" onClick={() => setShowDatabricksModal(true)}>
//                   Connect to Databricks
//                 </Button>
//               </div>
//             </div>
//           ) : (
//             <>
//               <div className="px-6 py-4">
//                 {filteredJobs.length === 0 ? (
//                   <div className="flex items-center justify-center text-center py-8">
//                     <div>
//                       <p className="text-sm text-muted-foreground">
//                         No jobs found matching your filters
//                       </p>
//                       {hasActiveFilters && (
//                         <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
//                           Clear filters
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 ) : (
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead className="text-xs py-2 w-[240px]">JOB NAME</TableHead>
//                         <TableHead className="text-xs py-2 w-[120px]">TYPE</TableHead>
//                         <TableHead className="text-xs py-2 w-[100px]">STATUS</TableHead>
//                         <TableHead className="text-xs py-2 text-right w-[80px]">ACTIONS</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {paginatedJobs.map((job) => {
//                         const Icon = getTypeIcon(job.type);
//                         return (
//                           <TableRow key={job.id} className="hover:bg-muted/50 h-12">
//                             <TableCell>
//                               <div className="flex items-center gap-3">
//                                 <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
//                                   <Icon className="w-3.5 h-3.5 text-primary" />
//                                 </div>
//                                 <div>
//                                   <p className="text-sm font-medium leading-tight">{job.name}</p>
//                                   <p className="text-[11px] text-muted-foreground">
//                                     {job.workspace.replace("https://", "")}
//                                   </p>
//                                 </div>
//                               </div>
//                             </TableCell>
//                             <TableCell className="text-xs font-medium">{job.type}</TableCell>
//                             <TableCell><StatusBadge status={job.status} /></TableCell>
//                             <TableCell className="text-right">
//                               <Button
//                                 size="sm"
//                                 variant="outline"
//                                 onClick={() => setSelectedItem({ type: job.type, data: job })}
//                               >
//                                 View Details
//                               </Button>
//                             </TableCell>
//                           </TableRow>
//                         );
//                       })}
//                     </TableBody>
//                   </Table>
//                 )}
//               </div>

//               <div className="px-6 py-3 border-t flex items-center justify-between flex-shrink-0">
//                 <div className="text-xs text-muted-foreground">
//                   Showing {startIndex + 1}–{Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length} jobs
//                 </div>
//                 {totalPages > 1 && (
//                   <div className="flex items-center gap-2">
//                     <Button variant="outline" size="sm"
//                       onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//                       disabled={currentPage === 1}>
//                       <ChevronLeft className="w-4 h-4" />
//                     </Button>
//                     <span className="text-xs text-muted-foreground">
//                       Page {currentPage} of {totalPages}
//                     </span>
//                     <Button variant="outline" size="sm"
//                       onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//                       disabled={currentPage === totalPages}>
//                       <ChevronRight className="w-4 h-4" />
//                     </Button>
//                   </div>
//                 )}
//               </div>
//             </>
//           )}
//         </Card>
//       </main>

//       <ConnectDatabricksModal
//         open={showDatabricksModal}
//         onClose={() => setShowDatabricksModal(false)}
//         onStartMigration={handleDatabricksConnect}
//       />

//       <ConnectSnowflakeModal
//         open={showSnowflakeModal}
//         onClose={() => setShowSnowflakeModal(false)}
//         onConnect={(apiResponse) => {
//           setShowSnowflakeModal(false);
//           onMigrateFromSnowflake(apiResponse);
//         }}
//       />

//       {selectedItem && (
//         <DetailModal
//           item={selectedItem}
//           onClose={() => setSelectedItem(null)}
//         />
//       )}
//     </div>
//   );
// }

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Database, Cable, User, ArrowLeft,
  Briefcase, BookOpen, Server, ChevronLeft, ChevronRight,
  FolderOpen, Search, X, Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ConnectDatabricksModal } from "@/components/modals/SnowflakeToDatabricks/ConnectToDatabricks";
import type { DatabricksApiResponse } from "@/components/modals/SnowflakeToDatabricks/ConnectToDatabricks";
import { ConnectSnowflakeModal } from "@/components/modals/SnowflakeToDatabricks/ConnectSnowflakeModal";
import { DatabricksDetailModal } from "@/components/modals/SnowflakeToDatabricks/DatabricksDetailModal";
import type { Status } from "@/types/migration";

// ── Unified row shape ────────────────────────────────────────────────────────

type RowType = "Job" | "Notebook" | "Catalog";

interface AssetRow {
  id: string;
  name: string;
  type: RowType;
  /** Sub-label shown under the name (workspace URL for jobs, folder for notebooks, note for catalogs) */
  subLabel: string;
  status: Status;
  /** Raw object for the detail modal */
  raw: any;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DatabricksJobsHomeProps {
  onMigrateFromSnowflake: (apiResponse: any) => void;
  onBackToHub: () => void;
  userName?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DatabricksJobsHome({
  onMigrateFromSnowflake,
  onBackToHub,
  userName = "User",
}: DatabricksJobsHomeProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [rows, setRows] = useState<AssetRow[]>([]);

  const [showDatabricksModal, setShowDatabricksModal] = useState(false);
  const [showSnowflakeModal, setShowSnowflakeModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const itemsPerPage = 8;

  // ── Transform real API response into flat rows ─────────────────────────────

  const handleDatabricksConnect = (config: any, api: DatabricksApiResponse) => {
    const workspace = config.workspaceUrl as string;

    const jobRows: AssetRow[] = (api.jobs ?? []).map((j) => ({
      id: String(j.job_id),
      name: j.job_name,
      type: "Job",
      subLabel: j.created_by,
      status: "Ready",
      raw: j,
    }));

    const notebookRows: AssetRow[] = (api.migration_notebooks ?? []).map((n, i) => ({
      id: `nb-${i}`,
      name: n.name,
      type: "Notebook",
      subLabel: n.folder,
      status: "Ready",
      raw: n,
    }));

    const catalogRows: AssetRow[] = (api.catalogs ?? []).map((c, i) => ({
      id: `cat-${i}`,
      name: c.catalog_name,
      type: "Catalog",
      subLabel: c.note ?? "",
      status: "Ready",
      raw: c,
    }));

    setRows([...jobRows, ...notebookRows, ...catalogRows]);
    setIsConnected(true);
    setShowDatabricksModal(false);
  };

  // ── Icon map ───────────────────────────────────────────────────────────────

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Job":      return Briefcase;
      case "Notebook": return BookOpen;
      case "Catalog":  return Layers;
      default:         return FolderOpen;
    }
  };

  // ── Derived counts ─────────────────────────────────────────────────────────

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => { counts[r.type] = (counts[r.type] || 0) + 1; });
    return counts;
  }, [rows]);

  const uniqueTypes = useMemo(() => Object.keys(typeCounts), [typeCounts]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          r.name.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.subLabel.toLowerCase().includes(q);
        const matchesType = typeFilter === "all" || r.type === typeFilter;
        return matchesSearch && matchesType;
      }),
    [rows, searchQuery, typeFilter]
  );

  // ── Pagination ─────────────────────────────────────────────────────────────

  const totalPages  = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex  = (currentPage - 1) * itemsPerPage;
  const endIndex    = startIndex + itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, typeFilter]);

  const hasActiveFilters = searchQuery || typeFilter !== "all";
  const clearFilters = () => { setSearchQuery(""); setTypeFilter("all"); setCurrentPage(1); };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className={`${isConnected ? "min-h-[calc(100vh-3.5rem)]" : "h-[calc(100vh-3.5rem)]"} flex flex-col bg-background ${!isConnected ? "overflow-hidden" : ""}`}
    >
      <main
        className={`flex-1 px-6 py-4 max-w-7xl mx-auto w-full flex flex-col ${!isConnected ? "overflow-hidden" : ""}`}
      >
        {/* ── Header ── */}
        <div className="mb-3 flex-shrink-0">
          <button
            onClick={onBackToHub}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to hub
          </button>
          <h1 className="text-2xl font-bold text-foreground mb-1">Databricks Migration Hub</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              Owner: {userName}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
              ● Active
            </span>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <Card className="mb-3 flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardContent className="py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">
                Connect your environments to start the migration process.
              </p>
            </div>
            <div className="flex gap-3">
              {!isConnected && (
                <Button variant="azure-outline" onClick={() => setShowDatabricksModal(true)}>
                  <Database className="w-4 h-4" />
                  Connect to Databricks
                </Button>
              )}
              <Button variant="azure" onClick={() => setShowSnowflakeModal(true)}>
                <Cable className="w-4 h-4" />
                Migrate from Snowflake
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Assets card ── */}
        <Card
          className={`${isConnected ? "mb-4" : "flex-1"} flex flex-col ${!isConnected ? "overflow-hidden min-h-0" : ""}`}
        >
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <CardTitle className="text-sm">Databricks Assets</CardTitle>
                <CardDescription>
                  Jobs, notebooks, and catalogs discovered in your workspace
                </CardDescription>
              </div>
            </div>

            {/* Type count tiles */}
            {isConnected && Object.keys(typeCounts).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                {/* All */}
                <Card
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setTypeFilter("all")}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{rows.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">All</p>
                      </div>
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeFilter === "all" ? "bg-primary/20" : "bg-muted"}`}
                      >
                        <FolderOpen
                          className={`w-5 h-5 ${typeFilter === "all" ? "text-primary" : "text-muted-foreground"}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Per-type */}
                {Object.entries(typeCounts).map(([type, count]) => {
                  const Icon = getTypeIcon(type);
                  return (
                    <Card
                      key={type}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{type}</p>
                          </div>
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeFilter === type ? "bg-primary/20" : "bg-muted"}`}
                          >
                            <Icon
                              className={`w-5 h-5 ${typeFilter === type ? "text-primary" : "text-muted-foreground"}`}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Search + filters */}
            {isConnected && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-36 h-9">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            )}
          </CardHeader>

          {/* ── Empty / connected states ── */}
          {!isConnected ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div className="pb-20">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No Connection</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect to Databricks to view your assets
                </p>
                <Button variant="azure" onClick={() => setShowDatabricksModal(true)}>
                  Connect to Databricks
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 py-4">
                {filteredRows.length === 0 ? (
                  <div className="flex items-center justify-center text-center py-8">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        No assets found matching your filters
                      </p>
                      {hasActiveFilters && (
                        <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs py-2 w-[280px]">NAME</TableHead>
                        <TableHead className="text-xs py-2 w-[120px]">TYPE</TableHead>
                        <TableHead className="text-xs py-2 w-[100px]">STATUS</TableHead>
                        <TableHead className="text-xs py-2 text-right w-[80px]">ACTIONS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRows.map((row) => {
                        const Icon = getTypeIcon(row.type);
                        return (
                          <TableRow key={row.id} className="hover:bg-muted/50 h-12">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Icon className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium leading-tight truncate">{row.name}</p>
                                  {row.subLabel && (
                                    <p className="text-[11px] text-muted-foreground truncate">
                                      {row.subLabel}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-medium">{row.type}</TableCell>
                            <TableCell><StatusBadge status={row.status} /></TableCell>
                            <TableCell className="text-right">
                              {row.type === "Job" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedItem({ type: row.type, data: row.raw })}
                                >
                                  View Details
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Pagination */}
              <div className="px-6 py-3 border-t flex items-center justify-between flex-shrink-0">
                <div className="text-xs text-muted-foreground">
                  Showing {startIndex + 1}–{Math.min(endIndex, filteredRows.length)} of{" "}
                  {filteredRows.length} assets
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </main>

      {/* ── Modals ── */}
      <ConnectDatabricksModal
        open={showDatabricksModal}
        onClose={() => setShowDatabricksModal(false)}
        onStartMigration={handleDatabricksConnect}
      />

      <ConnectSnowflakeModal
        open={showSnowflakeModal}
        onClose={() => setShowSnowflakeModal(false)}
        onConnect={(apiResponse) => {
          setShowSnowflakeModal(false);
          onMigrateFromSnowflake(apiResponse);
        }}
      />

      {selectedItem && (
        <DatabricksDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}