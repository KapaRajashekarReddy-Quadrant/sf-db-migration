// import { useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { useDatabricksCredentials } from "@/contexts/DatabricksCredentialsContext";

// interface DatabricksDiscoveryScope {
//   jobs: boolean;
//   notebooks: boolean;
//   clusters: boolean;
// }

// interface DatabricksMigrationConfig {
//   workspaceUrl: string;
//   accessToken: string;
//   clusterId?: string;
//   discoveryScope: DatabricksDiscoveryScope;
// }

// interface DatabricksApiResponse {
//   counts: {
//     notebooks: number;
//     folders: number;
//     jobs: number;
//     clusters: number;
//   };
//   notebooks: any[];
//   folders: any[];
//   jobs: any[];
//   clusters: any[];
// }

// interface ConnectDatabricksModalProps {
//   open: boolean;
//   onClose: () => void;
//   onStartMigration: (config: DatabricksMigrationConfig, apiResponse: DatabricksApiResponse) => void;
// }

// export function ConnectDatabricksModal({
//   open,
//   onClose,
//   onStartMigration,
// }: ConnectDatabricksModalProps) {
//   const { toast } = useToast();
//   const { setCredentials } = useDatabricksCredentials();

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const [formData, setFormData] = useState<DatabricksMigrationConfig>({
//     workspaceUrl: " https://adb-7405608725974682.2.azuredatabricks.net",
//     accessToken: "dapi4b23f5e3c03cbab2098fd3a61733302a-3",
//     clusterId: "",
//     discoveryScope: {
//       jobs: true,
//       notebooks: true,
//       clusters: true,
//     },
//   });

//   const toggleScope = (key: keyof DatabricksDiscoveryScope) => {
//     setFormData((prev) => ({
//       ...prev,
//       discoveryScope: {
//         ...prev.discoveryScope,
//         [key]: !prev.discoveryScope[key],
//       },
//     }));
//   };

//   const handleConnect = async () => {
//     console.log("=== Databricks Connection Start ===");

//     // Validation
//     if (!formData.workspaceUrl || !formData.accessToken) {
//       const message = "Workspace URL and Access Token are required.";
//       setError(message);
//       toast({
//         title: "Missing Required Fields",
//         description: message,
//         variant: "destructive",
//       });
//       return;
//     }

//     // Clean and validate URL
//     let cleanUrl = formData.workspaceUrl.trim();
//     if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
//       cleanUrl = "https://" + cleanUrl;
//     }

//     console.log("Connecting to:", cleanUrl);

//     setLoading(true);
//     setError(null);

//     const payload = {
//       databricksUrl: cleanUrl,
//       personalAccessToken: formData.accessToken.trim(),
//     };

//     try {
//       console.log("Making discovery API call...");
//       const response = await fetch(
//         "https://databrickstofabric-fuhdb8a7dhbebrf5.eastus-01.azurewebsites.net/api/ConnecttoDatabricks?code=-gZ_9a0Icf_IXxVHA6edZYnTAUPPVmrDW801cHXAG1M0AzFuvArpZQ==",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         }
//       );

//       console.log("Response status:", response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("API Error Response:", errorText);

//         let errorMessage = `Connection failed (${response.status})`;
//         try {
//           const errorData = JSON.parse(errorText);
//           errorMessage = errorData.message || errorData.error || errorMessage;
//         } catch {
//           // If not JSON, use the text as is
//           if (errorText) errorMessage = errorText;
//         }

//         throw new Error(errorMessage);
//       }

//       const apiResponse: DatabricksApiResponse = await response.json();
//       console.log("API Response:", {
//         counts: apiResponse.counts,
//         notebooksCount: apiResponse.notebooks?.length || 0,
//         jobsCount: apiResponse.jobs?.length || 0,
//         clustersCount: apiResponse.clusters?.length || 0,
//       });

//       // Validate response structure
//       if (!apiResponse || !apiResponse.counts) {
//         console.error("Invalid API response structure:", apiResponse);
//         throw new Error("Invalid response from Databricks API. Please check your credentials.");
//       }

//       // Calculate total discovered items
//       const totalItems = (apiResponse.jobs?.length || 0) +
//         (apiResponse.notebooks?.length || 0) +
//         (apiResponse.clusters?.length || 0);

//       console.log("Total items discovered:", totalItems);

//       if (totalItems === 0) {
//         const message = "No assets found in this workspace. Please check your workspace URL and access token.";
//         setError(message);
//         toast({
//           title: "No Assets Found",
//           description: message,
//           variant: "destructive",
//         });
//         setLoading(false);
//         return;
//       }

//       // SUCCESS: Store credentials
//       console.log("Storing credentials in context...");
//       setCredentials({
//         databricksUrl: cleanUrl,
//         personalAccessToken: formData.accessToken.trim(),
//       });

//       // Show success message
//       toast({
//         title: "Connection Successful",
//         description: `Found ${apiResponse.counts.notebooks} notebooks, ${apiResponse.counts.jobs} jobs, ${apiResponse.counts.clusters} clusters`,
//       });

//       console.log("Calling onStartMigration...");

//       // Update form data with clean URL
//       const updatedConfig = {
//         ...formData,
//         workspaceUrl: cleanUrl,
//       };

//       // Pass data to parent
//       onStartMigration(updatedConfig, apiResponse);

//       // Close modal
//       onClose();

//       console.log("=== Databricks Connection Complete ===");

//     } catch (err) {
//       console.error("Connection error:", err);
//       const errorMessage = err instanceof Error ? err.message : "Failed to connect to Databricks";
//       setError(errorMessage);
//       toast({
//         title: "Connection Failed",
//         description: errorMessage,
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleClose = () => {
//     if (!loading) {
//       setError(null);
//       onClose();
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={handleClose}>
//       <DialogContent className="sm:max-w-lg bg-card">
//         <DialogHeader>
//           <DialogTitle>Connect to Databricks</DialogTitle>
//           <DialogDescription>
//             Provide Databricks workspace details to discover and migrate assets into Fabric.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
//           {error && (
//             <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
//               <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-destructive" />
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm text-destructive">
//                   {error.includes("401") || error.includes("403")
//                     ? "Invalid credentials. Please check your Workspace URL and Access Token."
//                     : error.includes("404")
//                       ? "Workspace not found. Please verify your Workspace URL."
//                       : error.length > 120
//                         ? "Connection failed. Please check your credentials and try again."
//                         : error}
//                 </p>
//               </div>
//             </div>
//           )}
//           <div className="space-y-2">
//             <Label>
//               Workspace URL <span className="text-destructive">*</span>
//             </Label>
//             <Input
//               placeholder="https://adb-123456.azuredatabricks.net"
//               value={formData.workspaceUrl}
//               onChange={(e) => {
//                 setFormData({ ...formData, workspaceUrl: e.target.value });
//                 setError(null);
//               }}
//               disabled={loading}
//             />
//             <p className="text-xs text-muted-foreground">
//               Enter your Databricks workspace URL
//             </p>
//           </div>

//           <div className="space-y-2">
//             <Label>
//               Personal Access Token <span className="text-destructive">*</span>
//             </Label>
//             <Input
//               type="password"
//               placeholder="dapiXXXXXXXX"
//               value={formData.accessToken}
//               onChange={(e) => {
//                 setFormData({ ...formData, accessToken: e.target.value });
//                 setError(null);
//               }}
//               disabled={loading}
//             />
//             <p className="text-xs text-muted-foreground">
//               Generate a token in User Settings → Access Tokens
//             </p>
//           </div>

//           <div className="space-y-2">
//             <Label>Cluster ID (optional)</Label>
//             <Input
//               placeholder="0715-134320-abcde"
//               value={formData.clusterId}
//               onChange={(e) =>
//                 setFormData({ ...formData, clusterId: e.target.value })
//               }
//               disabled={loading}
//             />
//           </div>

//           <div className="space-y-3 pt-2">
//             <Label>Discovery Scope</Label>
//             <div className="grid grid-cols-2 gap-3">
//               {(
//                 [
//                   ["jobs", "Jobs", "Scan scheduled and triggered jobs"],
//                   ["notebooks", "Notebooks", "Scan notebooks and code"],
//                   ["clusters", "Clusters", "Scan cluster configuration"],
//                 ] as const
//               ).map(([key, title, desc]) => (
//                 <div
//                   key={key}
//                   className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50"
//                 >
//                   <Checkbox
//                     checked={formData.discoveryScope[key]}
//                     onCheckedChange={() => toggleScope(key)}
//                     disabled={loading}
//                   />
//                   <div className="space-y-0.5">
//                     <p className="text-sm font-medium">{title}</p>
//                     <p className="text-xs text-muted-foreground">{desc}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         <div className="flex justify-end gap-3 pt-2 border-t">
//           <Button variant="outline" onClick={handleClose} disabled={loading}>
//             Cancel
//           </Button>

//           <Button
//             variant="azure"
//             onClick={handleConnect}
//             disabled={loading || !formData.workspaceUrl || !formData.accessToken}
//           >
//             {loading ? (
//               <>
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 Connecting...
//               </>
//             ) : (
//               <>
//                 <CheckCircle2 className="w-4 h-4" />
//                 Connect
//               </>
//             )}
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }



//18/02
import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDatabricksCredentials } from "@/contexts/DatabricksCredentialsContext";
 
interface DatabricksDiscoveryScope {
  jobs: boolean;
  notebooks: boolean;
  clusters: boolean;
}
 
interface DatabricksMigrationConfig {
  workspaceUrl: string;
  accessToken: string;
  clusterId?: string;
  discoveryScope: DatabricksDiscoveryScope;
}
 
interface DatabricksApiResponse {
  counts: {
    notebooks: number;
    folders: number;
    jobs: number;
    clusters: number;
  };
  notebooks: any[];
  folders: any[];
  jobs: any[];
  clusters: any[];
}
 
interface ConnectDatabricksModalProps {
  open: boolean;
  onClose: () => void;
  onStartMigration: (config: DatabricksMigrationConfig, apiResponse: DatabricksApiResponse) => void;
}
 
export function ConnectDatabricksModal({
  open,
  onClose,
  onStartMigration,
}: ConnectDatabricksModalProps) {
  const { toast } = useToast();
  const { setCredentials } = useDatabricksCredentials();
 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  const [formData, setFormData] = useState<DatabricksMigrationConfig>({
    workspaceUrl: "",
    accessToken: "",
    clusterId: "",
    discoveryScope: {
      jobs: true,
      notebooks: true,
      clusters: true,
    },
  });
 
  const toggleScope = (key: keyof DatabricksDiscoveryScope) => {
    setFormData((prev) => ({
      ...prev,
      discoveryScope: {
        ...prev.discoveryScope,
        [key]: !prev.discoveryScope[key],
      },
    }));
  };
 
  const handleConnect = async () => {
    console.log("=== Databricks Connection Start ===");
 
    // Validation
    if (!formData.workspaceUrl || !formData.accessToken) {
      const message = "Workspace URL and Access Token are required.";
      setError(message);
      toast({
        title: "Missing Required Fields",
        description: message,
        variant: "destructive",
      });
      return;
    }
 
    // Clean and validate URL
    let cleanUrl = formData.workspaceUrl.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }
 
    console.log("Connecting to:", cleanUrl);
 
    setLoading(true);
    setError(null);
 
    const payload = {
      databricksUrl: cleanUrl,
      personalAccessToken: formData.accessToken.trim(),
    };
 
    try {
      console.log("Making discovery API call...");
      const response = await fetch(
        "https://20.106.196.248/ConnecttoDatabricks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept" : "application/json"
          },
          body: JSON.stringify(payload),
        }
      );
 
      console.log("Response status:", response.status);
 
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
 
        let errorMessage = `Connection failed (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If not JSON, use the text as is
          if (errorText) errorMessage = errorText;
        }
 
        throw new Error(errorMessage);
      }
 
      const apiResponse: DatabricksApiResponse = await response.json();
      console.log("API Response:", {
        counts: apiResponse.counts,
        notebooksCount: apiResponse.notebooks?.length || 0,
        jobsCount: apiResponse.jobs?.length || 0,
        clustersCount: apiResponse.clusters?.length || 0,
      });
 
      // Validate response structure
      if (!apiResponse || !apiResponse.counts) {
        console.error("Invalid API response structure:", apiResponse);
        throw new Error("Invalid response from Databricks API. Please check your credentials.");
      }
 
      // Calculate total discovered items
      const totalItems = (apiResponse.jobs?.length || 0) +
        (apiResponse.notebooks?.length || 0) +
        (apiResponse.clusters?.length || 0);
 
      console.log("Total items discovered:", totalItems);
 
      if (totalItems === 0) {
        const message = "No assets found in this workspace. Please check your workspace URL and access token.";
        setError(message);
        toast({
          title: "No Assets Found",
          description: message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
 
      // SUCCESS: Store credentials
      console.log("Storing credentials in context...");
      setCredentials({
        databricksUrl: cleanUrl,
        personalAccessToken: formData.accessToken.trim(),
      });
 
      // Show success message
      toast({
        title: "Connection Successful",
        description: `Found ${apiResponse.counts.notebooks} notebooks, ${apiResponse.counts.jobs} jobs, ${apiResponse.counts.clusters} clusters`,
      });
 
      console.log("Calling onStartMigration...");
 
      // Update form data with clean URL
      const updatedConfig = {
        ...formData,
        workspaceUrl: cleanUrl,
      };
 
      // Pass data to parent
      onStartMigration(updatedConfig, apiResponse);
 
      // Close modal
      onClose();
 
      console.log("=== Databricks Connection Complete ===");
 
    } catch (err) {
      console.error("Connection error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to Databricks";
      setError(errorMessage);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
 
  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };
 
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle>Connect to Databricks</DialogTitle>
          <DialogDescription>
            Provide Databricks workspace details to discover and migrate assets into Fabric.
          </DialogDescription>
        </DialogHeader>
 
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-destructive" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-destructive">
                  {error.includes("401") || error.includes("403")
                    ? "Invalid credentials. Please check your Workspace URL and Access Token."
                    : error.includes("404")
                      ? "Workspace not found. Please verify your Workspace URL."
                      : error.length > 120
                        ? "Connection failed. Please check your credentials and try again."
                        : error}
                </p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>
              Workspace URL <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="https://adb-123456.azuredatabricks.net"
              value={formData.workspaceUrl}
              onChange={(e) => {
                setFormData({ ...formData, workspaceUrl: e.target.value });
                setError(null);
              }}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Enter your Databricks workspace URL
            </p>
          </div>
 
          <div className="space-y-2">
            <Label>
              Personal Access Token <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              placeholder="dapiXXXXXXXX"
              value={formData.accessToken}
              onChange={(e) => {
                setFormData({ ...formData, accessToken: e.target.value });
                setError(null);
              }}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Generate a token in User Settings → Access Tokens
            </p>
          </div>
 
          <div className="space-y-2">
            <Label>Cluster ID (optional)</Label>
            <Input
              placeholder="0715-134320-abcde"
              value={formData.clusterId}
              onChange={(e) =>
                setFormData({ ...formData, clusterId: e.target.value })
              }
              disabled={loading}
            />
          </div>
 
          <div className="space-y-3 pt-2">
            <Label>Discovery Scope</Label>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["jobs", "Jobs", "Scan scheduled and triggered jobs"],
                  ["notebooks", "Notebooks", "Scan notebooks and code"],
                  ["clusters", "Clusters", "Scan cluster configuration"],
                ] as const
              ).map(([key, title, desc]) => (
                <div
                  key={key}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50"
                >
                  <Checkbox
                    checked={formData.discoveryScope[key]}
                    onCheckedChange={() => toggleScope(key)}
                    disabled={loading}
                  />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
 
        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
 
          <Button
            variant="azure"
            onClick={handleConnect}
            disabled={loading || !formData.workspaceUrl || !formData.accessToken}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Connect
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
 
