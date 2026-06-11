// import { useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { StatusBadge } from "@/components/StatusBadge";
// import { Progress } from "@/components/ui/progress";
// import { Checkbox } from "@/components/ui/checkbox";
// import {
//   Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
// } from "@/components/ui/table";
// import {
//   Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
// } from "@/components/ui/select";
// import {
//   Search, Filter, Download, CheckCircle2, XCircle, Loader2,
//   Home, ChevronRight, AlertTriangle, List, Minus, RefreshCw,
//   ExternalLink,
// } from "lucide-react";

// // ─── Types ────────────────────────────────────────────────────────────────────

// export type SnowflakeMigrationItemType =
//   | "Notebook"
//   | "SQLWorksheet"
//   | "StoredProc"
//   | "Task"
//   | "Data";

// export type SnowflakeMigrationStatus =
//   | "Success"
//   | "Running"
//   | "Failed"
//   | "Skipped"
//   | "Replaced"
//   | "Warning";

// export interface SnowflakeMigrationItem {
//   id:                string;
//   name:              string;
//   type:              SnowflakeMigrationItemType;
//   status:            SnowflakeMigrationStatus;
//   targetWorkspace?:  string;
//   errorMessage?:     string;
//   warningMessage?:   string;
//   databricksNotebook?: string;
// }

// interface SnowflakeMigrationReportProps {
//   items:               SnowflakeMigrationItem[];
//   onBackToHome:        () => void;
//   onMigrationUpdate:   (updateFn: (prev: SnowflakeMigrationItem[]) => SnowflakeMigrationItem[]) => void;
// }

// // ─── Label maps ──────────────────────────────────────────────────────────────

// const TYPE_LABELS: Record<SnowflakeMigrationItemType, string> = {
//   Notebook:     "Notebook",
//   SQLWorksheet: "SQL Worksheet",
//   StoredProc:   "Stored Proc",
//   Task:         "Task",
//   Data:         "Database",
// };

// const TYPE_OPTIONS: { value: string; label: string }[] = [
//   { value: "all",          label: "All Types"     },
//   { value: "Notebook",     label: "Notebook"      },
//   { value: "SQLWorksheet", label: "SQL Worksheet" },
//   { value: "StoredProc",   label: "Stored Proc"   },
//   { value: "Task",         label: "Task"          },
//   { value: "Data",         label: "Database"      },
// ];

// // ─── Component ────────────────────────────────────────────────────────────────

// export function SnowflakeMigrationReport({
//   items,
//   onBackToHome,
//   onMigrationUpdate,
// }: SnowflakeMigrationReportProps) {
//   const [statusFilter,   setStatusFilter]   = useState("all");
//   const [typeFilter,     setTypeFilter]     = useState("all");
//   const [searchQuery,    setSearchQuery]    = useState("");
//   const [selectedItems,  setSelectedItems]  = useState<Set<string>>(new Set());

//   // ── Stats ─────────────────────────────────────────────────────────────────
//   const stats = {
//     total:    items.length,
//     success:  items.filter((i) => i.status === "Success").length,
//     running:  items.filter((i) => i.status === "Running").length,
//     failed:   items.filter((i) => i.status === "Failed").length,
//     skipped:  items.filter((i) => i.status === "Skipped").length,
//     replaced: items.filter((i) => i.status === "Replaced").length,
//     warning:  items.filter((i) => i.status === "Warning").length,
//   };

//   const hasRunningItems = stats.running > 0;
//   const progress =
//     stats.total > 0
//       ? ((stats.success + stats.failed + stats.replaced + stats.skipped + stats.warning) / stats.total) * 100
//       : 0;

//   // ── Filtering ─────────────────────────────────────────────────────────────
//   const filteredItems = items.filter((item) => {
//     const matchesStatus = statusFilter === "all" || item.status === statusFilter;
//     const matchesType   = typeFilter   === "all" || item.type   === typeFilter;
//     const matchesSearch =
//       searchQuery === "" ||
//       item.name.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchesStatus && matchesType && matchesSearch;
//   });

//   // ── Selection ─────────────────────────────────────────────────────────────
//   const toggleItem = (id: string) => {
//     setSelectedItems((prev) => {
//       const next = new Set(prev);
//       next.has(id) ? next.delete(id) : next.add(id);
//       return next;
//     });
//   };
//   const toggleAll = () => {
//     if (selectedItems.size === filteredItems.length) setSelectedItems(new Set());
//     else setSelectedItems(new Set(filteredItems.map((i) => i.id)));
//   };
//   const allFilteredSelected =
//     filteredItems.length > 0 && selectedItems.size === filteredItems.length;

//   // ── Export ────────────────────────────────────────────────────────────────
//   const handleExport = () => {
//     const toExport =
//       selectedItems.size > 0
//         ? items.filter((i) => selectedItems.has(i.id))
//         : items;

//     const report = {
//       metadata: {
//         exportDate:    new Date().toISOString(),
//         source:        "Snowflake",
//         target:        "Databricks",
//         itemsExported: toExport.length,
//       },
//       summary: {
//         total:      toExport.length,
//         successful: toExport.filter((i) => i.status === "Success").length,
//         warning:    toExport.filter((i) => i.status === "Warning").length,
//         running:    toExport.filter((i) => i.status === "Running").length,
//         failed:     toExport.filter((i) => i.status === "Failed").length,
//         skipped:    toExport.filter((i) => i.status === "Skipped").length,
//         replaced:   toExport.filter((i) => i.status === "Replaced").length,
//       },
//       items: toExport.map((item) => ({
//         id:                  item.id,
//         name:                item.name,
//         type:                TYPE_LABELS[item.type] ?? item.type,
//         status:              item.status,
//         targetWorkspace:     item.targetWorkspace    ?? "N/A",
//         databricksNotebook:  item.databricksNotebook ?? null,
//         errorMessage:        item.errorMessage       ?? null,
//         warningMessage:      item.warningMessage     ?? null,
//       })),
//     };

//     const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
//     const url  = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href  = url;
//     link.download = `snowflake-migration-report-${new Date().toISOString().slice(0, 10)}.json`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
//   };

//   // ── Render ────────────────────────────────────────────────────────────────
//   return (
//     <div className="min-h-screen bg-background">
//       <main className="p-6 max-w-7xl mx-auto animate-fade-in">

//         {/* Breadcrumb */}
//         <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
//           <button
//             onClick={onBackToHome}
//             className="hover:text-foreground flex items-center gap-1"
//           >
//             <Home className="w-4 h-4" />
//             Home
//           </button>
//           <ChevronRight className="w-4 h-4" />
//           <span className="text-foreground font-medium">Snowflake Migration Report</span>
//         </div>

//         {/* Header */}
//         <div className="flex items-start justify-between mb-6">
//           <div>
//             <h1 className="text-2xl font-bold text-foreground mb-1">
//               Snowflake Migration Report
//             </h1>
//             <p className="text-sm text-muted-foreground">
//               Track the progress of your Snowflake to Databricks migration
//             </p>
//           </div>
//           <div className="flex gap-3">
//             <Button
//               variant="outline"
//               onClick={handleExport}
//               disabled={hasRunningItems}
//               title={hasRunningItems ? "Wait for all items to complete" : "Export migration report"}
//             >
//               <Download className="w-4 h-4" />
//               Export Report {selectedItems.size > 0 && `(${selectedItems.size})`}
//             </Button>
//             <Button variant="azure" onClick={onBackToHome}>
//               <Home className="w-4 h-4" />
//               Back to Home
//             </Button>
//           </div>
//         </div>

//         {/* Progress card */}
//         <Card className="mb-6">
//           <CardContent className="py-5">
//             <div className="flex items-center justify-between mb-3">
//               <h3 className="font-medium text-foreground">Overall Migration Progress</h3>
//               <span className="text-sm text-muted-foreground">
//                 {stats.success + stats.replaced + stats.skipped + stats.failed + stats.warning} of {stats.total} completed
//               </span>
//             </div>
//             <Progress value={progress} className="h-3" />
//             <div className="flex flex-wrap gap-6 mt-4">
//               {[
//                 { color: "bg-success",     label: `Created: ${stats.success}`,   pulse: false },
//                 { color: "bg-running",     label: `Running: ${stats.running}`,   pulse: stats.running > 0 },
//                 { color: "bg-destructive", label: `Failed: ${stats.failed}`,     pulse: false },
//                 { color: "bg-yellow-500",  label: `Warning: ${stats.warning}`,   pulse: false },
//                 { color: "bg-blue-600",    label: `Replaced: ${stats.replaced}`, pulse: false },
//                 { color: "bg-gray-500",    label: `Skipped: ${stats.skipped}`,   pulse: false },
//               ].map(({ color, label, pulse }) => (
//                 <div key={label} className="flex items-center gap-2">
//                   <div className={`w-3 h-3 rounded-full ${color} ${pulse ? "animate-pulse" : ""}`} />
//                   <span className="text-sm text-muted-foreground">{label}</span>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>

//         {/* Stat cards */}
//         <div className="grid grid-cols-7 gap-3 mb-6">
//           <Card className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs text-muted-foreground">Total Items</p>
//                 <p className="text-2xl font-bold text-foreground">{stats.total}</p>
//               </div>
//               <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
//                 <List className="w-4 h-4 text-primary" />
//               </div>
//             </div>
//           </Card>

//           <Card className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs text-muted-foreground">Created</p>
//                 <p className="text-2xl font-bold text-success">{stats.success}</p>
//               </div>
//               <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
//                 <CheckCircle2 className="w-4 h-4 text-success" />
//               </div>
//             </div>
//           </Card>

//           <Card className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs text-muted-foreground">Running</p>
//                 <p className="text-2xl font-bold text-running">{stats.running}</p>
//               </div>
//               <div className="w-9 h-9 rounded-lg bg-running/10 flex items-center justify-center">
//                 <Loader2 className={`w-4 h-4 text-running ${stats.running > 0 ? "animate-spin" : ""}`} />
//               </div>
//             </div>
//           </Card>

//           <Card className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs text-muted-foreground">Failed</p>
//                 <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
//               </div>
//               <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
//                 <XCircle className="w-4 h-4 text-destructive" />
//               </div>
//             </div>
//           </Card>

//           <Card className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs text-muted-foreground">Warning</p>
//                 <p className="text-2xl font-bold text-yellow-500">{stats.warning}</p>
//               </div>
//               <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
//                 <AlertTriangle className="w-4 h-4 text-yellow-500" />
//               </div>
//             </div>
//           </Card>

//           <Card className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs text-muted-foreground">Replaced</p>
//                 <p className="text-2xl font-bold text-blue-600">{stats.replaced}</p>
//               </div>
//               <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
//                 <RefreshCw className="w-4 h-4 text-blue-600" />
//               </div>
//             </div>
//           </Card>

//           <Card className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs text-muted-foreground">Skipped</p>
//                 <p className="text-2xl font-bold text-gray-500">{stats.skipped}</p>
//               </div>
//               <div className="w-9 h-9 rounded-lg bg-gray-500/10 flex items-center justify-center">
//                 <Minus className="w-4 h-4 text-gray-500" />
//               </div>
//             </div>
//           </Card>
//         </div>

//         {/* Filters */}
//         <div className="flex items-center gap-3 mb-4">
//           <div className="relative flex-1 max-w-sm">
//             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
//             <Input
//               placeholder="Search items..."
//               className="pl-9"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>

//           <Select value={statusFilter} onValueChange={setStatusFilter}>
//             <SelectTrigger className="w-40">
//               <Filter className="w-4 h-4 mr-2" />
//               <SelectValue placeholder="Status" />
//             </SelectTrigger>
//             <SelectContent className="bg-popover">
//               <SelectItem value="all">All Status</SelectItem>
//               <SelectItem value="Success">Created</SelectItem>
//               <SelectItem value="Running">Running</SelectItem>
//               <SelectItem value="Failed">Failed</SelectItem>
//               <SelectItem value="Warning">Warning</SelectItem>
//               <SelectItem value="Replaced">Replaced</SelectItem>
//               <SelectItem value="Skipped">Skipped</SelectItem>
//             </SelectContent>
//           </Select>

//           <Select value={typeFilter} onValueChange={setTypeFilter}>
//             <SelectTrigger className="w-44">
//               <SelectValue placeholder="Type" />
//             </SelectTrigger>
//             <SelectContent className="bg-popover">
//               {TYPE_OPTIONS.map((t) => (
//                 <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         {/* Table */}
//         <Card>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead className="w-[50px]">
//                   <Checkbox
//                     checked={allFilteredSelected}
//                     onCheckedChange={toggleAll}
//                     aria-label="Select all"
//                   />
//                 </TableHead>
//                 <TableHead className="w-[200px]">ITEM NAME</TableHead>
//                 <TableHead>TYPE</TableHead>
//                 <TableHead>DATABRICKS NOTEBOOK</TableHead>
//                 <TableHead>STATUS</TableHead>
//                 <TableHead>MESSAGE</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredItems.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
//                     No items match your filters
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 filteredItems.map((item) => (
//                   <TableRow key={item.id} className="hover:bg-muted/50">
//                     <TableCell>
//                       <Checkbox
//                         checked={selectedItems.has(item.id)}
//                         onCheckedChange={() => toggleItem(item.id)}
//                         aria-label={`Select ${item.name}`}
//                       />
//                     </TableCell>
//                     <TableCell className="font-medium">{item.name}</TableCell>
//                     <TableCell>
//                       <span className="px-2 py-1 rounded bg-muted text-xs">
//                         {TYPE_LABELS[item.type] ?? item.type}
//                       </span>
//                     </TableCell>
//                     {/* Databricks Notebook column */}
//                     <TableCell>
//                       {item.databricksNotebook ? (
//                         <div className="flex items-center gap-1.5 text-sm">
//                           <ExternalLink className="w-3.5 h-3.5 text-primary flex-shrink-0" />
//                           <span
//                             className="text-primary font-mono text-xs truncate max-w-[220px]"
//                             title={item.databricksNotebook}
//                           >
//                             {item.databricksNotebook}
//                           </span>
//                         </div>
//                       ) : (
//                         <span className="text-muted-foreground text-sm">-</span>
//                       )}
//                     </TableCell>
//                     <TableCell>
//                       <StatusBadge status={item.status} />
//                     </TableCell>
//                     {/* Unified message column: error takes precedence over warning */}
//                     <TableCell>
//                       {item.errorMessage ? (
//                         <div className="flex items-center gap-2 text-sm">
//                           <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
//                           <span className="text-destructive">{item.errorMessage}</span>
//                         </div>
//                       ) : item.warningMessage ? (
//                         <div className="flex items-center gap-2 text-sm">
//                           <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
//                           <span className="text-yellow-600 dark:text-yellow-400">{item.warningMessage}</span>
//                         </div>
//                       ) : (
//                         <span className="text-muted-foreground">-</span>
//                       )}
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </Card>

//       </main>
//     </div>
//   );
// }
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, Download, CheckCircle2, XCircle, Loader2,
  Home, ChevronRight, AlertTriangle, List, Minus, RefreshCw,
  ExternalLink, BookOpen, Code2, Cog, Clock, Database, Table2
} from "lucide-react";
import { SnowflakeMigrationReportPreview } from "@/components/modals/SnowflakeToDatabricks/SnowflakeMigrationReportPreview";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SnowflakeMigrationItemType =
  | "Notebook"
  | "SQLWorksheet"
  | "StoredProc"
  | "Task"
  | "Data";

export type SnowflakeMigrationStatus =
  | "Success"
  | "Running"
  | "Failed"
  | "Skipped"
  | "Replaced"
  | "Warning";

export interface SnowflakeMigrationItem {
  id: string;
  name: string;
  type: SnowflakeMigrationItemType;
  status: SnowflakeMigrationStatus;
  targetWorkspace?: string;
  errorMessage?: string;
  warningMessage?: string;
  databricksNotebook?: string;
  dataLevel?: "database" | "schema" | "table";
}

interface SnowflakeMigrationReportProps {
  items: SnowflakeMigrationItem[];
  onBackToHome: () => void;
  onMigrationUpdate: (updateFn: (prev: SnowflakeMigrationItem[]) => SnowflakeMigrationItem[]) => void;
}

// ─── Label / icon maps ────────────────────────────────────────────────────────

const TYPE_LABELS: Record<SnowflakeMigrationItemType, string> = {
  Notebook: "Notebook",
  SQLWorksheet: "SQL Worksheet",
  StoredProc: "Stored Proc",
  Task: "Task",
  Data: "Database",
};

const TYPE_ICONS: Record<SnowflakeMigrationItemType, React.ElementType> = {
  Notebook: BookOpen,
  SQLWorksheet: Code2,
  StoredProc: Cog,
  Task: Clock,
  Data: Database,
};

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "Notebook", label: "Notebook" },
  { value: "SQLWorksheet", label: "SQL Worksheet" },
  { value: "StoredProc", label: "Stored Proc" },
  { value: "Task", label: "Task" },
  { value: "Data", label: "Database" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function SnowflakeMigrationReport({
  items,
  onBackToHome,
  onMigrationUpdate,
}: SnowflakeMigrationReportProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total: items.length,
    success: items.filter((i) => i.status === "Success").length,
    running: items.filter((i) => i.status === "Running").length,
    failed: items.filter((i) => i.status === "Failed").length,
    skipped: items.filter((i) => i.status === "Skipped").length,
    replaced: items.filter((i) => i.status === "Replaced").length,
    warning: items.filter((i) => i.status === "Warning").length,
  };

  const [showPreview, setShowPreview] = useState(false);

  const handleExport = () => setShowPreview(true);

  const hasRunningItems = stats.running > 0;
  const progress =
    stats.total > 0
      ? ((stats.success + stats.failed + stats.replaced + stats.skipped + stats.warning) / stats.total) * 100
      : 0;

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.databricksNotebook ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleItem = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedItems.size === filteredItems.length) setSelectedItems(new Set());
    else setSelectedItems(new Set(filteredItems.map((i) => i.id)));
  };

  const allFilteredSelected =
    filteredItems.length > 0 && selectedItems.size === filteredItems.length;


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <main className="p-6 max-w-7xl mx-auto animate-fade-in">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <button onClick={onBackToHome} className="hover:text-foreground flex items-center gap-1">
            <Home className="w-4 h-4" />Home
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Snowflake Migration Report</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Snowflake Migration Report</h1>
            <p className="text-sm text-muted-foreground">
              Track the progress of your Snowflake to Databricks migration
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={hasRunningItems}
              title={hasRunningItems ? "Wait for all items to complete" : "Export migration report"}
            >
              <Download className="w-4 h-4" />
              Export Report {selectedItems.size > 0 && `(${selectedItems.size})`}
            </Button>
            <Button variant="azure" onClick={onBackToHome}>
              <Home className="w-4 h-4" />Back to Home
            </Button>
          </div>
        </div>

        {/* Progress card */}
        <Card className="mb-6">
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">Overall Migration Progress</h3>
              <span className="text-sm text-muted-foreground">
                {stats.success + stats.replaced + stats.skipped + stats.failed + stats.warning} of {stats.total} completed
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex flex-wrap gap-6 mt-4">
              {[
                { color: "bg-success", label: `Created: ${stats.success}`, pulse: false },
                { color: "bg-running", label: `Running: ${stats.running}`, pulse: stats.running > 0 },
                { color: "bg-destructive", label: `Failed: ${stats.failed}`, pulse: false },
                { color: "bg-yellow-500", label: `Warning: ${stats.warning}`, pulse: false },
                { color: "bg-blue-600", label: `Replaced: ${stats.replaced}`, pulse: false },
                { color: "bg-gray-500", label: `Skipped: ${stats.skipped}`, pulse: false },
              ].map(({ color, label, pulse }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color} ${pulse ? "animate-pulse" : ""}`} />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stat cards */}
        <div className="grid grid-cols-7 gap-3 mb-6">
          {[
            { label: "Total Items", value: stats.total, color: "primary", Icon: List, extra: "" },
            { label: "Created", value: stats.success, color: "success", Icon: CheckCircle2, extra: "" },
            { label: "Running", value: stats.running, color: "running", Icon: Loader2, extra: stats.running > 0 ? "animate-spin" : "" },
            { label: "Failed", value: stats.failed, color: "destructive", Icon: XCircle, extra: "" },
            { label: "Warning", value: stats.warning, color: "yellow-500", Icon: AlertTriangle, extra: "" },
            { label: "Replaced", value: stats.replaced, color: "blue-600", Icon: RefreshCw, extra: "" },
            { label: "Skipped", value: stats.skipped, color: "gray-500", Icon: Minus, extra: "" },
          ].map(({ label, value, color, Icon, extra }) => (
            <Card key={label} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold text-${color}`}>{value}</p>
                </div>
                <div className={`w-9 h-9 rounded-lg bg-${color}/10 flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 text-${color} ${extra}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or notebook path..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Success">Created</SelectItem>
              <SelectItem value="Running">Running</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
              <SelectItem value="Warning">Warning</SelectItem>
              <SelectItem value="Replaced">Replaced</SelectItem>
              <SelectItem value="Skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* live filter summary */}
          <span className="ml-auto text-sm text-muted-foreground">
            {filteredItems.length} of {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[46px]">
                  <Checkbox checked={allFilteredSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                </TableHead>
                <TableHead>ITEM</TableHead>
                <TableHead className="w-[120px]">TYPE</TableHead>
                <TableHead>DATABRICKS PATH</TableHead>
                <TableHead className="w-[110px]">STATUS</TableHead>
                <TableHead>MESSAGE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No items match your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const TypeIcon = TYPE_ICONS[item.type] ?? List;
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50">

                      {/* Checkbox */}
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                          aria-label={`Select ${item.name}`}
                        />
                      </TableCell>

                      {/* Item name + type icon */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <TypeIcon className="w-3 h-3 text-primary" />
                          </div>
                          <span className="font-medium text-sm truncate max-w-[180px]" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                      </TableCell>

                      {/* Type badge */}
                      {/* Type badge */}
                      <TableCell>
                        {item.type === "Data" && item.dataLevel ? (
                          <div className="flex flex-col gap-1">
                            <span className="px-2 py-1 rounded bg-muted text-xs whitespace-nowrap">
                              {TYPE_LABELS[item.type] ?? item.type}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide w-fit ${item.dataLevel === "database"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              : item.dataLevel === "schema"
                                ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
                                : "bg-primary/10 text-primary border-primary/20"
                              }`}>
                              {item.dataLevel === "database" ? <Database className="w-2.5 h-2.5" />
                                : item.dataLevel === "schema" ? <Code2 className="w-2.5 h-2.5" />
                                  : <Table2 className="w-2.5 h-2.5" />}
                              {item.dataLevel}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-1 rounded bg-muted text-xs whitespace-nowrap">
                            {TYPE_LABELS[item.type] ?? item.type}
                          </span>
                        )}
                      </TableCell>

                      {/* Databricks path */}
                      <TableCell>
                        {item.databricksNotebook ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <span
                              className="text-primary font-mono text-xs truncate max-w-[220px]"
                              title={item.databricksNotebook}
                            >
                              {item.databricksNotebook}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>

                      {/* Message — error takes precedence over warning */}
                      <TableCell>
                        {item.errorMessage ? (
                          <div className="flex items-start gap-2 text-sm">
                            <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                            <span className="text-destructive leading-snug">{item.errorMessage}</span>
                          </div>
                        ) : item.warningMessage ? (
                          <div className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <span className="text-yellow-600 dark:text-yellow-400 leading-snug">{item.warningMessage}</span>
                          </div>
                        ) : item.status === "Success" ? (
                          <span className="text-muted-foreground text-sm">—</span>
                        ) : item.status === "Running" ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>In progress…</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

      </main>
      {showPreview && (
        <SnowflakeMigrationReportPreview
          items={
            selectedItems.size > 0
              ? items.filter((i) => selectedItems.has(i.id))
              : items
          }
          allItems={items}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}





