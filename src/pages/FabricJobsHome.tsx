import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { ConnectFabricModal } from "@/components/modals/ConnectFabricModal";
import {
  Database,
  ArrowRightLeft,
  Sparkles,
  MoreVertical,
  Calendar,
  User,
  Cable,
  Search,
  X,
  FileText,
  Workflow,
  Zap,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Icon,
  Cpu, ArrowLeft
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { FabricJob, FabricApiResponse, Workspace } from "@/types/migration";
import DetailModal from "../components/modals/DetailModal";
import type { FabricWorkspace } from "@/types/migration";
import { useFabricCredentials } from "@/contexts/FabricCredentialsContext";

interface FabricJobsHomeProps {
  onLogout: () => void;
  onMigrateFromSynapse: () => void;
  onMigrateFromDatabricks: () => void;
  onBackToHub: () => void;
  userName?: string;
}

export function FabricJobsHome({
  onLogout,
  onMigrateFromSynapse,
  onMigrateFromDatabricks,
  onBackToHub,
  userName = "User",
}: FabricJobsHomeProps) {
  const [showFabricModal, setShowFabricModal] = useState(false);
  const [isFabricConnected, setIsFabricConnected] = useState(false);
  const { credentials: fabricCredentials, apiResponse: fabricApiResponse } = useFabricCredentials();
  const [jobs, setJobs] = useState<FabricJob[]>([]);
  const [workspaces, setWorkspaces] = useState<FabricWorkspace[]>([]);
  const [apiResponse, setApiResponse] = useState<FabricApiResponse | null>(null); // Store original API response
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("all");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [selectedItem, setSelectedItem] = useState(null);

  // Transform API response to job format
  const transformApiResponseToJobs = (apiData: FabricApiResponse): FabricJob[] => {
    const transformedJobs: FabricJob[] = [];

    apiData.workspaces.forEach((workspace) => {
      workspace.notebooks.forEach((notebook) => {
        transformedJobs.push({
          id: notebook.id,
          name: notebook.displayName,
          type: "Notebook",
          workspace: workspace.workspaceName,
          lastModified: "N/A",
          status: "Success",
          workspaceId: workspace.workspaceId,
        });
      });

      workspace.pipelines.forEach((pipeline) => {
        transformedJobs.push({
          id: pipeline.id,
          name: pipeline.displayName,
          type: "Pipeline",
          workspace: workspace.workspaceName,
          lastModified: "N/A",
          status: "Success",
          workspaceId: workspace.workspaceId,
        });
      });

      workspace.lakehouses.forEach((lakehouse) => {
        transformedJobs.push({
          id: lakehouse.id,
          name: lakehouse.displayName,
          type: "Lakehouse",
          workspace: workspace.workspaceName,
          lastModified: "N/A",
          status: "Success",
          workspaceId: workspace.workspaceId,
        });
      });

      workspace.warehouses.forEach((warehouse) => {
        transformedJobs.push({
          id: warehouse.id,
          name: warehouse.displayName,
          type: "Warehouse",
          workspace: workspace.workspaceName,
          lastModified: "N/A",
          status: "Success",
          workspaceId: warehouse.workspaceId,
        });
      });

      workspace.semanticModels.forEach((model) => {
        transformedJobs.push({
          id: model.id,
          name: model.displayName,
          type: "Semantic Model",
          workspace: workspace.workspaceName,
          lastModified: "N/A",
          status: "Success",
          workspaceId: model.workspaceId,
        });
      });

      // Process Spark Pools - Create unique IDs to avoid collisions
      workspace.sparkPools.forEach((pool) => {
        const uniqueId = `${workspace.workspaceId}-${pool.id}`;
        transformedJobs.push({
          id: uniqueId,
          name: pool.name,
          type: "Spark Pool",
          workspace: workspace.workspaceName,
          lastModified: "N/A",
          status: "Success",
          workspaceId: workspace.workspaceId,
        });
      });
    });

    return transformedJobs;
  };

  const handleConnectFabric = (apiResponse: FabricApiResponse) => {
    setIsFabricConnected(true);
    setApiResponse(apiResponse); // Store original API response
    setWorkspaces(apiResponse.workspaces);
    const transformedJobs = transformApiResponseToJobs(apiResponse);
    setJobs(transformedJobs);
    setShowFabricModal(false);
  };

  // Helper function to get original item data from API response
  const getOriginalItemData = (job: FabricJob) => {
    if (!apiResponse) return job;

    // Find the workspace
    const workspace = apiResponse.workspaces.find(
      ws => ws.workspaceId === job.workspaceId
    );

    if (!workspace) return job;

    // Based on job type, find the original item
    switch (job.type) {
      case "Notebook":
        return workspace.notebooks.find(item => item.id === job.id) || job;
      case "Pipeline":
        return workspace.pipelines.find(item => item.id === job.id) || job;
      case "Lakehouse":
        return workspace.lakehouses.find(item => item.id === job.id) || job;
      case "Warehouse":
        return workspace.warehouses.find(item => item.id === job.id) || job;
      case "Semantic Model":
        return workspace.semanticModels.find(item => item.id === job.id) || job;
      case "Spark Pool":
        // For Spark Pool, we need to extract the original ID from our composite ID
        const originalId = job.id.split('-').slice(5).join('-'); // Remove workspace ID prefix
        return workspace.sparkPools.find(item => item.id === originalId) || job;
      default:
        return job;
    }
  };

  // FIXED: Simplified function - no bullet splitting needed
  const getJobType = (typeString: string) => {
    return typeString;
  };

  const workspaceFilteredJobs = useMemo(() => {
    if (selectedWorkspace === "all") {
      return jobs;
    }
    return jobs.filter(job => job.workspace === selectedWorkspace);
  }, [jobs, selectedWorkspace]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(workspaceFilteredJobs.map(job => job.type));
    return Array.from(types);
  }, [workspaceFilteredJobs]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    workspaceFilteredJobs.forEach(job => {
      counts[job.type] = (counts[job.type] || 0) + 1;
    });
    return counts;
  }, [workspaceFilteredJobs]);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pipeline':
        return Workflow;
      case 'notebook':
        return FileText;
      case 'dataflow':
        return Zap;
      case 'lakehouse':
      case 'warehouse':
        return Database;
      case 'semantic model':
        return Database;
      case 'spark pool':
        return Cpu;
      default:
        return FolderOpen;
    }
  };

  const filteredJobs = useMemo(() => {
    return workspaceFilteredJobs.filter(job => {
      const matchesSearch = job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const matchesType = typeFilter === "all" || job.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [workspaceFilteredJobs, searchQuery, statusFilter, typeFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, selectedWorkspace]);

  useEffect(() => {
    // Auto-load Fabric data if we already have it from migration workflow
    if (fabricApiResponse && fabricCredentials && !isFabricConnected) {
      setIsFabricConnected(true);
      setApiResponse(fabricApiResponse);
      setWorkspaces(fabricApiResponse.workspaces);
      const transformedJobs = transformApiResponseToJobs(fabricApiResponse);
      setJobs(transformedJobs);
    }
  }, [fabricApiResponse, fabricCredentials, isFabricConnected]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || typeFilter !== "all";

  return (
    <div className={`${isFabricConnected ? 'min-h-[calc(100vh-3.5rem)]' : 'h-[calc(100vh-3.5rem)]'} flex flex-col bg-background ${!isFabricConnected ? 'overflow-hidden' : ''}`}>
      <main className={`flex-1 px-6 py-4 max-w-7xl mx-auto w-full flex flex-col ${!isFabricConnected ? 'overflow-hidden' : ''}`}>
        {/* Page Header */}
        <div className="mb-3 flex-shrink-0">
          <button
            onClick={onBackToHub}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to hub
          </button>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Fabric Migration Hub
          </h1>
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

        {/* Quick Actions */}
        <Card className="mb-3 flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardContent className="py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Quick Actions
              </h3>
              <p className="text-sm text-muted-foreground">
                Connect your environments to start the migration process.
              </p>
            </div>

            <div className="flex gap-3">
              {!isFabricConnected && (
                <Button
                  variant="azure-outline"
                  onClick={() => setShowFabricModal(true)}
                >
                  <Cpu className="w-4 h-4" />
                  Connect to Fabric
                </Button>
              )}

              <Button variant="azure" onClick={onMigrateFromDatabricks}>
                <Cable className="w-4 h-4" />
                Migrate from Databricks
              </Button>

              <Button variant="azure" onClick={onMigrateFromSynapse}>
                <ArrowRightLeft className="w-4 h-4" />
                Migrate from Synapse
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fabric Jobs - Takes remaining space */}
        <Card className={`${isFabricConnected ? 'mb-4' : 'flex-1'} flex flex-col ${!isFabricConnected ? 'overflow-hidden min-h-0' : ''}`}>
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <CardTitle className="text-sm">Fabric Jobs</CardTitle>
                <CardDescription>
                  Monitor job status across your Fabric workspaces
                </CardDescription>
              </div>

              {isFabricConnected && workspaces.length > 0 && (
                <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                  <SelectTrigger className="w-48">
                    <Database className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Select Workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workspaces</SelectItem>
                    {workspaces.map((workspace) => (
                      <SelectItem key={workspace.workspaceId} value={workspace.workspaceName}>
                        {workspace.workspaceName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Type Count Tiles */}
            {isFabricConnected && Object.keys(typeCounts).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                {/* All Items Card */}
                <Card
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setTypeFilter("all")}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{workspaceFilteredJobs.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">All</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeFilter === "all" ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                        <FolderOpen className={`w-5 h-5 ${typeFilter === "all" ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Individual Type Cards */}
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
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeFilter === type ? 'bg-primary/20' : 'bg-muted'
                            }`}>
                            <Icon className={`w-5 h-5 ${typeFilter === type ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            {/* Search and Filters */}
            {isFabricConnected && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Success">Success</SelectItem>
                    <SelectItem value="Running">Running</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select> */}

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-36 h-9">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            )}
          </CardHeader>

          {!isFabricConnected ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div className="pb-20">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No Connection</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect to Microsoft Fabric to view your jobs
                </p>
                <Button variant="azure" onClick={() => setShowFabricModal(true)}>
                  Connect to Fabric
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 py-4">
                {filteredJobs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        No jobs found matching your filters
                      </p>
                      {hasActiveFilters && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={clearFilters}
                          className="mt-2"
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs py-2 w-[240px]">JOB NAME</TableHead>
                        <TableHead className="text-xs py-2 w-[120px]">TYPE</TableHead>
                        {/* <TableHead className="text-xs py-2 w-[110px]">CREATED AT</TableHead>
                        <TableHead className="text-xs py-2 w-[110px]">LAST RUN</TableHead> */}
                        <TableHead className="text-xs py-2 w-[100px]">STATUS</TableHead>
                        <TableHead className="text-xs py-2 text-right w-[80px]">ACTIONS</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginatedJobs.map((job) => (
                        <TableRow key={job.id} className="hover:bg-muted/50 h-12">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                                <Database className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium leading-tight">
                                  {job.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {job.workspace}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs font-medium">
                            {job.type}
                          </TableCell>

                          {/* <TableCell className="text-xs">Oct 24, 2023</TableCell> */}
                          {/* <TableCell className="text-xs">{job.lastModified}</TableCell> */}
                          <TableCell>
                            <StatusBadge status={job.status} />
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const originalData = getOriginalItemData(job);
                                setSelectedItem({
                                  type: job.type,
                                  data: {
                                    ...originalData,
                                    workspace: job.workspace,
                                    status: job.status,
                                    lastModified: job.lastModified
                                  }
                                });
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="px-6 py-3 border-t flex items-center justify-between flex-shrink-0">
                <div className="text-xs text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length} jobs
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="text-xs text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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

      <ConnectFabricModal
        open={showFabricModal}
        onClose={() => setShowFabricModal(false)}
        onConnect={handleConnectFabric}
      />

      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

    </div>
  );
}