//18/02
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFabricCredentials } from "@/contexts/FabricCredentialsContext";
import type { Workspace } from "@/types/migration";
import debounce from "lodash/debounce";

interface SelectTargetModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (workspace: Workspace) => void;
}

interface FabricWorkspace {
  id: string;
  displayName: string;
  description: string;
  type: string;
  capacityId?: string;
  domainId?: string;
}

interface Capacity {
  capacityId: string;
  capacityName: string;
  sku: string;
  region: string;
  state: string;
}

interface CreateWorkspaceResponse {
  workspaceId: string;
  workspaceName: string;
  status: "created" | "already-exists";
  capacityId?: string;
  region?: string | null;
  admin: string;
}

export function SelectTargetModal({ open, onClose, onConfirm }: SelectTargetModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingWorkspaces, setFetchingWorkspaces] = useState(false);
  const [fetchingCapacities, setFetchingCapacities] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [fabricWorkspaces, setFabricWorkspaces] = useState<FabricWorkspace[]>([]);
  const [capacities, setCapacities] = useState<Capacity[]>([]);
  const [newWorkspace, setNewWorkspace] = useState({
    name: "",
    capacityId: "",
    region: "",
  });
  const [workspaceStatusMessage, setWorkspaceStatusMessage] = useState<string | null>(null);
  const [workspaceStatusType, setWorkspaceStatusType] = useState<"success" | "warning" | null>(null);
  
  // Real-time name availability state
  const [nameAvailability, setNameAvailability] = useState<{
    status: "idle" | "checking" | "available" | "taken";
    message?: string;
  }>({ status: "idle" });

  const { toast } = useToast();
  const { credentials } = useFabricCredentials();

  // Fetch workspaces when modal opens - always fetch to ensure fresh data
  useEffect(() => {
    if (open && credentials) {
      fetchFabricWorkspaces();
    }
  }, [open, credentials]);

  // Fetch capacities when switching to "new" mode
  useEffect(() => {
    if (open && credentials && mode === "new") {
      fetchCapacities();
    }
  }, [open, credentials, mode]);

  // Real-time workspace name availability check
  const checkWorkspaceName = useCallback(
    debounce(async (name: string) => {
      if (name.trim().length < 3) {
        setNameAvailability({ status: "idle" });
        return;
      }

      if (!credentials) {
        setNameAvailability({ status: "idle" });
        return;
      }

      setNameAvailability({ status: "checking" });

      try {
        const response = await fetch(
          `https://20.106.196.248/ListFabricWorkspaces`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenantId: credentials.tenantId,
              clientId: credentials.clientId,
              clientSecret: credentials.clientSecret,
            }),
          }
        );

        if (!response.ok) throw new Error("Failed to check workspaces");

        const data = await response.json();
        const workspaces: FabricWorkspace[] = data.workspaces || [];

        // ✅ CRITICAL FIX: Update the fabricWorkspaces state with fresh data
        setFabricWorkspaces(workspaces);

        // ✅ FIX: Use case-insensitive comparison matching backend logic
        const exists = workspaces.some(
          (ws: FabricWorkspace) =>
            ws.displayName.trim().toLowerCase() === name.trim().toLowerCase()
        );

        setNameAvailability({
          status: exists ? "taken" : "available",
          message: exists ? "Workspace name already exists" : "Name is available",
        });
      } catch (err) {
        console.warn("Name availability check failed:", err);
        setNameAvailability({
          status: "idle",
          message: "Could not check availability",
        });
      }
    }, 500),
    [credentials]
  );

  // Cleanup debounce
  useEffect(() => {
    return () => {
      checkWorkspaceName.cancel();
    };
  }, [checkWorkspaceName]);

  const fetchFabricWorkspaces = async () => {
    if (!credentials) {
      toast({
        title: "Missing Credentials",
        description: "Fabric credentials not found. Please connect to Fabric first.",
        variant: "destructive",
      });
      return;
    }

    setFetchingWorkspaces(true);

    try {
      const response = await fetch(
        `https://20.106.196.248/ListFabricWorkspaces`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            tenantId: credentials.tenantId,
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
          }),
        }
      );

      console.log("Fabric Workspaces Response status:", response.status);

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error("Invalid JSON response from server");
      }

      console.log("Parsed Fabric Workspaces:", result);

      if (response.ok && result.workspaces) {
        setFabricWorkspaces(result.workspaces);
        toast({
          title: "Workspaces Loaded",
          description: `Found ${result.workspaces.length} Fabric workspace(s).`,
        });
      } else {
        toast({
          title: "Failed to Load Workspaces",
          description: result.message || "Could not retrieve Fabric workspaces.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching Fabric workspaces:", error);
      toast({
        title: "Error Loading Workspaces",
        description: error instanceof Error ? error.message : "An error occurred while fetching workspaces.",
        variant: "destructive",
      });
    } finally {
      setFetchingWorkspaces(false);
    }
  };

  const fetchCapacities = async () => {
    if (!credentials) return;
    setFetchingCapacities(true);
    try {
      const response = await fetch(
        `https://20.106.196.248/ListCapacities`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: credentials.tenantId,
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
          }),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.capacities && Array.isArray(data.capacities)) {
        const active = data.capacities.filter((c: Capacity) => c.state === "Active");
        setCapacities(active);
        if (active.length > 0 && !newWorkspace.capacityId) {
          setNewWorkspace((prev) => ({
            ...prev,
            capacityId: active[0].capacityId,
            region: active[0].region,
          }));
        }
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not load capacities.", variant: "destructive" });
    } finally {
      setFetchingCapacities(false);
    }
  };

  const createOrGetWorkspace = async (): Promise<Workspace> => {
    const userProfileStr = localStorage.getItem("userProfile");
    let requestingUserEmail = "";
    if (userProfileStr) {
      try {
        const profile = JSON.parse(userProfileStr);
        requestingUserEmail = profile.email || "";
      } catch {}
    }
    if (!requestingUserEmail) throw new Error("User email not found");

    if (!credentials) throw new Error("Fabric credentials missing");

    const trimmedName = newWorkspace.name.trim();

    console.log("=== API CALL DEBUG ===");
    console.log("Calling CreateFabricWorkspace with:", {
      workspaceName: trimmedName,
      capacityId: newWorkspace.capacityId,
      region: newWorkspace.region,
    });

    // Proceed with creation - let the backend handle duplicate detection
    const response = await fetch(
      `https://20.106.196.248/CreateFabricWorkspace`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: credentials.tenantId,
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          workspaceName: trimmedName,
          capacityId: newWorkspace.capacityId,
          region: newWorkspace.region,
          requestingUserEmail,
        }),
      }
    );

    console.log("API Response status:", response.status, response.statusText);

    // ✅ FIX: Better error handling for 500 errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Workspace creation error:", errorText);
      
      // Check if it's an "already exists" error from backend
      if (errorText.toLowerCase().includes("already exists") || 
          errorText.toLowerCase().includes("already been taken")) {
        console.log("Backend says workspace exists, refreshing list...");
        // Refresh workspace list to get the existing workspace
        await fetchFabricWorkspaces();
        
        // Try to find it in the refreshed list
        const refreshedWorkspace = fabricWorkspaces.find(
          ws => ws.displayName.trim().toLowerCase() === trimmedName.toLowerCase()
        );
        
        if (refreshedWorkspace) {
          console.log("Found in refreshed list:", refreshedWorkspace);
          setWorkspaceStatusMessage("Workspace already exists. Using existing workspace.");
          setWorkspaceStatusType("warning");
          
          return {
            id: refreshedWorkspace.id,
            name: refreshedWorkspace.displayName,
            capacity: refreshedWorkspace.capacityId || newWorkspace.capacityId || "N/A",
            region: newWorkspace.region || "N/A",
          };
        }
      }
      
      throw new Error(`Workspace creation failed: ${errorText}`);
    }

    const result: CreateWorkspaceResponse = await response.json();
    console.log("API Response body:", result);

    const workspace: Workspace = {
      id: result.workspaceId,
      name: result.workspaceName,
      capacity: result.capacityId || newWorkspace.capacityId || "N/A",
      region: result.region || newWorkspace.region || "N/A",
    };

    if (result.status === "already-exists") {
      console.log("Backend returned already-exists status");
      setWorkspaceStatusMessage("Workspace already exists. Using existing workspace.");
      setWorkspaceStatusType("warning");
    } else if (result.status === "created") {
      console.log("Backend returned created status");
      setWorkspaceStatusMessage("New workspace created successfully.");
      setWorkspaceStatusType("success");
    }

    return workspace;
  };

  const handleConfirm = async () => {
    setWorkspaceStatusMessage(null);
    setWorkspaceStatusType(null);

    if (mode === "existing") {
      if (!selectedWorkspace) {
        toast({
          title: "No Workspace Selected",
          description: "Please select a target workspace.",
          variant: "destructive",
        });
        return;
      }

      const ws = fabricWorkspaces.find((w) => w.id === selectedWorkspace);
      if (!ws) return;

      const workspace: Workspace = {
        id: ws.id,
        name: ws.displayName,
        capacity: ws.capacityId || "N/A",
        region: "N/A",
      };

      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setLoading(false);

      toast({
        title: "Migration Started",
        description: `Migrating to ${workspace.name}...`,
      });

      onConfirm(workspace);
      onClose();
      return;
    }

    // New workspace mode
    const trimmedName = newWorkspace.name.trim();
    
    if (!trimmedName) {
      toast({
        title: "Missing Fields",
        description: "Please enter a workspace name.",
        variant: "destructive",
      });
      return;
    }

    if (!newWorkspace.capacityId) {
      toast({
        title: "Missing Fields",
        description: "Please select a capacity.",
        variant: "destructive",
      });
      return;
    }

    // ✅ FIX: Wait for debounced check to complete before proceeding
    if (nameAvailability.status === "checking") {
      toast({
        title: "Please Wait",
        description: "Checking workspace name availability...",
        variant: "destructive",
      });
      return;
    }

    // ✅ DEBUG: Log the current state
    console.log("=== WORKSPACE CREATION DEBUG ===");
    console.log("Trimmed name:", trimmedName);
    console.log("Name availability status:", nameAvailability.status);
    console.log("Current fabricWorkspaces count:", fabricWorkspaces.length);
    console.log("Current fabricWorkspaces:", fabricWorkspaces.map(ws => ws.displayName));
    
    // ✅ FIX: Double-check against current workspace list
    const existsInList = fabricWorkspaces.some(
      ws => ws.displayName.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    
    console.log("Exists in list check:", existsInList);
    console.log("Should block?", existsInList || nameAvailability.status === "taken");

    if (existsInList || nameAvailability.status === "taken") {
      console.log("BLOCKING: Name already in use");
      toast({
        title: "Name Already In Use",
        description: "This workspace name already exists. Please choose a different name or select it from the existing workspaces.",
        variant: "destructive",
      });
      return;
    }

    console.log("PROCEEDING: Calling createOrGetWorkspace()");
    setLoading(true);
    try {
      const workspace = await createOrGetWorkspace();
      
      // ✅ FIX: Show appropriate toast based on actual outcome
      const isExisting = workspaceStatusType === "warning";
      
      toast({
        title: isExisting ? "Using Existing Workspace" : "Workspace Created",
        description: isExisting
          ? `"${workspace.name}" already exists — proceeding with migration`
          : `Created "${workspace.name}" successfully`,
        variant: isExisting ? "default" : "default",
      });
      
      onConfirm(workspace);
      onClose();
    } catch (err: any) {
      console.error("Workspace creation/retrieval error:", err);
      toast({
        title: "Operation Failed",
        description: err.message || "An error occurred while creating the workspace.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Select Target Workspace</DialogTitle>
          <DialogDescription>
            Choose where to migrate your selected assets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup
            value={mode}
            onValueChange={(v) => {
              setMode(v as "existing" | "new");
              setWorkspaceStatusMessage(null);
              setWorkspaceStatusType(null);
              setNameAvailability({ status: "idle" });
            }}
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing" className="flex-1 cursor-pointer">
                <span className="font-medium">Use Existing Workspace</span>
                <p className="text-sm text-muted-foreground">
                  Migrate to an existing Fabric workspace
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="flex-1 cursor-pointer">
                <span className="font-medium">Create New Workspace</span>
                <p className="text-sm text-muted-foreground">
                  Create a new Fabric workspace (or use existing if name matches)
                </p>
              </Label>
            </div>
          </RadioGroup>

          {mode === "existing" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Workspace</Label>
                {fetchingWorkspaces && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading...
                  </span>
                )}
              </div>
              
              {!fetchingWorkspaces && fabricWorkspaces.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  No workspaces found. Please check your credentials.
                </div>
              )}

              {fabricWorkspaces.length > 0 && (
                <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a workspace" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {fabricWorkspaces.map((ws) => (
                      <SelectItem key={ws.id} value={ws.id}>
                        <div className="flex flex-col">
                          <span>{ws.displayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {ws.type}
                            {ws.capacityId && ` • Capacity: ${ws.capacityId.substring(0, 8)}...`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wsName">Workspace Name</Label>
                <Input
                  id="wsName"
                  placeholder="e.g. Sales Analytics 2026"
                  value={newWorkspace.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewWorkspace({ ...newWorkspace, name: value });
                    setWorkspaceStatusMessage(null);
                    setWorkspaceStatusType(null);
                    checkWorkspaceName(value);
                  }}
                  className={
                    nameAvailability.status === "taken"
                      ? "border-destructive focus-visible:ring-destructive"
                      : nameAvailability.status === "available"
                      ? "border-green-500 focus-visible:ring-green-500"
                      : ""
                  }
                />

                {/* Immediate availability feedback */}
                <div className="min-h-[20px] text-sm pl-1 flex items-center gap-1.5">
                  {nameAvailability.status === "checking" && (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground">Checking availability...</span>
                    </>
                  )}

                  {nameAvailability.status === "available" && newWorkspace.name.trim() && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-green-600 dark:text-green-400">
                        {nameAvailability.message || "Available"}
                      </span>
                    </>
                  )}

                  {nameAvailability.status === "taken" && (
                    <>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-destructive">
                        {nameAvailability.message || "Already exists"}
                      </span>
                    </>
                  )}
                </div>

                {/* Creation status (after API call) */}
                {workspaceStatusMessage && (
                  <p
                    className={`text-sm mt-1 ${
                      workspaceStatusType === "success"
                        ? "text-green-600 dark:text-green-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {workspaceStatusMessage}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  {fetchingCapacities ? (
                    <div className="h-10 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    <Select
                      value={newWorkspace.capacityId}
                      onValueChange={(id) => {
                        const cap = capacities.find((c) => c.capacityId === id);
                        setNewWorkspace({
                          ...newWorkspace,
                          capacityId: id,
                          region: cap?.region || "",
                        });
                      }}
                      disabled={fetchingCapacities || capacities.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select capacity" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {capacities.map((cap) => (
                          <SelectItem key={cap.capacityId} value={cap.capacityId}>
                            {cap.capacityName} ({cap.sku}) – {cap.region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input
                    value={newWorkspace.region}
                    disabled
                    placeholder="Selected from capacity"
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="azure"
            onClick={handleConfirm}
            disabled={
              loading ||
              fetchingWorkspaces ||
              fetchingCapacities ||
              (mode === "new" &&
                (!newWorkspace.name.trim() ||
                  !newWorkspace.capacityId ||
                  nameAvailability.status === "taken" ||
                  nameAvailability.status === "checking"))
            }
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading
              ? mode === "new"
                ? "Processing Workspace..."
                : "Connecting..."
              : "Connect & Start Migration"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}