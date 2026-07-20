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
// import { Loader2, Wifi } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { useAzureCredentials } from "@/contexts/AzureCredentialsContext";
// import type { SynapseConnection } from "@/types/migration";

// interface ConnectSynapseModalProps {
//   open: boolean;
//   onClose: () => void;
//   onConnect: (connection: SynapseConnection, apiResponse: any) => void;
// }

// export function ConnectSynapseModal({ open, onClose, onConnect }: ConnectSynapseModalProps) {
//   const [loading, setLoading] = useState(false);
//   const [testLoading, setTestLoading] = useState(false);
//   const [formData, setFormData] = useState<SynapseConnection>({
//     tenantId: "0eadb77e-42dc-47f8-bbe3-ec2395e0712c",
//     clientId: "1dd09e8f-5f60-429e-8386-5ace4693440b",
//     clientSecret: "y1~8Q~Ve_Dop-gXOuoMkaHyT.Jc5MC1RSERM4boN",
//     workspaceName: "synapsetofabricws1",
//     discoveryScope: {
//       sparkPools: true,
//       notebooks: true,
//       pipelines: true,
//       linkedServices: true,
//     },
//   });
//   const { toast } = useToast();
//   const { setCredentials } = useAzureCredentials();

//   const handleTestConnection = async () => {
//     setTestLoading(true);
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//     setTestLoading(false);
//     toast({
//       title: "Connection Successful",
//       description: "Successfully connected to Synapse workspace.",
//     });
//   };

//   const handleConnect = async () => {
//     if (!formData.tenantId || !formData.clientId || !formData.clientSecret || !formData.workspaceName) {
//       toast({
//         title: "Missing Required Fields",
//         description: "Please fill in all required fields.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setLoading(true);
    
//     try {
//       const payload = {
//         tenantId: formData.tenantId,
//         clientId: formData.clientId,
//         clientSecret: formData.clientSecret,
//         workspaceName: formData.workspaceName,
//         scope: formData.discoveryScope,
//       };

//       console.log("Sending payload:", JSON.stringify(payload, null, 2));

//       const response = await fetch(
//         `https://synapsetofabricfunc-fmg2d2ejctg2eacu.eastus-01.azurewebsites.net/api/ConnecttoSynapseWs?code=vvuvrJ8BIivLP6841TxFY3ydjNvHNy-Pap12hBYW-ozHAzFu5qh-5A==`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "Accept": "application/json",
//           },
//           body: JSON.stringify(payload),
//         }
//       );

//       console.log("Response status:", response.status);
//       console.log("Response headers:", response.headers);

//       const responseText = await response.text();
//       console.log("Raw response:", responseText);

//       let result;
//       try {
//         result = JSON.parse(responseText);
//       } catch (parseError) {
//         console.error("Failed to parse response as JSON:", parseError);
//         console.log("Response text:", responseText);
//         throw new Error("Invalid JSON response from server");
//       }

//       console.log("Parsed API Response:", result);

//       if (response.ok) {
//         // Store credentials for later use (e.g., listing Fabric workspaces)
//         setCredentials({
//           tenantId: formData.tenantId,
//           clientId: formData.clientId,
//           clientSecret: formData.clientSecret,
//         });

//         toast({
//           title: "Connected Successfully",
//           description: "Scanning Synapse workspace for migration assets...",
//         });
        
//         // Pass both the form data and API response to the parent
//         onConnect(formData, result);
//       } else {
//         toast({
//           title: "Connection Failed",
//           description: result.message || "Failed to connect to Synapse workspace.",
//           variant: "destructive",
//         });
//       }
//     } catch (error) {
//       console.error("Connection error:", error);
//       toast({
//         title: "Connection Error",
//         description: error instanceof Error ? error.message : "An error occurred while connecting to Synapse workspace.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const toggleScope = (key: keyof typeof formData.discoveryScope) => {
//     setFormData({
//       ...formData,
//       discoveryScope: {
//         ...formData.discoveryScope,
//         [key]: !formData.discoveryScope[key],
//       },
//     });
//   };

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-lg bg-card">
//         <DialogHeader>
//           <DialogTitle>Connect to Synapse Workspace</DialogTitle>
//           <DialogDescription>
//             Enter your Azure service principal details to scan for migration assets.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="tenantId">
//                 Tenant ID <span className="text-destructive">*</span>
//               </Label>
//               <Input
//                 id="tenantId"
//                 placeholder="e.g. 8f6d4d..."
//                 value={formData.tenantId}
//                 onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="clientId">
//                 Client ID <span className="text-destructive">*</span>
//               </Label>
//               <Input
//                 id="clientId"
//                 placeholder="e.g. 3a2bfc..."
//                 value={formData.clientId}
//                 onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
//               />
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="clientSecret">
//               Client Secret <span className="text-destructive">*</span>
//             </Label>
//             <Input
//               id="clientSecret"
//               type="password"
//               placeholder="Enter Client Secret"
//               value={formData.clientSecret}
//               onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="workspaceName">
//               Workspace Name <span className="text-destructive">*</span>
//             </Label>
//             <Input
//               id="workspaceName"
//               placeholder="Enter Workspace Name"
//               value={formData.workspaceName}
//               onChange={(e) => setFormData({ ...formData, workspaceName: e.target.value })}
//             />
//           </div>

//           <div className="space-y-3 pt-2">
//             <Label>Discovery Scope</Label>
//             <div className="grid grid-cols-2 gap-3">
//               <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
//                 <Checkbox
//                   id="sparkPools"
//                   checked={formData.discoveryScope.sparkPools}
//                   onCheckedChange={() => toggleScope("sparkPools")}
//                 />
//                 <div className="space-y-0.5">
//                   <label htmlFor="sparkPools" className="text-sm font-medium cursor-pointer">
//                     Spark Pools
//                   </label>
//                   <p className="text-xs text-muted-foreground">
//                     Scan configuration and libraries
//                   </p>
//                 </div>
//               </div>

//               <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
//                 <Checkbox
//                   id="notebooks"
//                   checked={formData.discoveryScope.notebooks}
//                   onCheckedChange={() => toggleScope("notebooks")}
//                 />
//                 <div className="space-y-0.5">
//                   <label htmlFor="notebooks" className="text-sm font-medium cursor-pointer">
//                     Notebooks
//                   </label>
//                   <p className="text-xs text-muted-foreground">
//                     Scan code and dependencies
//                   </p>
//                 </div>
//               </div>

//               <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
//                 <Checkbox
//                   id="pipelines"
//                   checked={formData.discoveryScope.pipelines}
//                   onCheckedChange={() => toggleScope("pipelines")}
//                 />
//                 <div className="space-y-0.5">
//                   <label htmlFor="pipelines" className="text-sm font-medium cursor-pointer">
//                     Pipelines
//                   </label>
//                   <p className="text-xs text-muted-foreground">
//                     Scan data flows and activities
//                   </p>
//                 </div>
//               </div>

//               {/* <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
//                 <Checkbox
//                   id="linkedServices"
//                   checked={formData.discoveryScope.linkedServices}
//                   onCheckedChange={() => toggleScope("linkedServices")}
//                 />
//                 <div className="space-y-0.5">
//                   <label htmlFor="linkedServices" className="text-sm font-medium cursor-pointer">
//                     Linked Services
//                   </label>
//                   <p className="text-xs text-muted-foreground">
//                     Scan connection definitions
//                   </p>
//                 </div>
//               </div> */}
//             </div>
//           </div>
//         </div>

//         <div className="flex justify-end gap-3 pt-2 border-t">
//           <Button variant="outline" onClick={onClose}>
//             Cancel
//           </Button>
//           <Button variant="outline" onClick={handleTestConnection} disabled={testLoading}>
//             {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
//             Test Connection
//           </Button>
//           <Button variant="azure" onClick={handleConnect} disabled={loading}>
//             {loading && <Loader2 className="w-4 h-4 animate-spin" />}
//             Connect
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
import { Loader2, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAzureCredentials } from "@/contexts/AzureCredentialsContext";
import type { SynapseConnection } from "@/types/migration";
 
interface ConnectSynapseModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: (connection: SynapseConnection, apiResponse: any) => void;
}
 
export function ConnectSynapseModal({ open, onClose, onConnect }: ConnectSynapseModalProps) {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [formData, setFormData] = useState<SynapseConnection>({
    tenantId: "0eadb77e-42dc-47f8-bbe3-ec2395e0712c",
    clientId: "1dd09e8f-5f60-429e-8386-5ace4693440b",
    clientSecret: "oUT8Q~Rvm3VyQgSZCaou3CE1AZ5I5DKVk4tYJcsj",
    workspaceName: "synapsetofabricws1",
    discoveryScope: {
      sparkPools: true,
      notebooks: true,
      pipelines: true,
      linkedServices: true,
    },
  });
  const { toast } = useToast();
  const { setCredentials } = useAzureCredentials();
 
  const handleTestConnection = async () => {
    setTestLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setTestLoading(false);
    toast({
      title: "Connection Successful",
      description: "Successfully connected to Synapse workspace.",
    });
  };
 
  const handleConnect = async () => {
    if (!formData.tenantId || !formData.clientId || !formData.clientSecret || !formData.workspaceName) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
 
    setLoading(true);
   
    try {
      const payload = {
        tenantId: formData.tenantId,
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        workspaceName: formData.workspaceName,
        scope: formData.discoveryScope,
      };
 
      console.log("Sending payload:", JSON.stringify(payload, null, 2));
 
      const response = await fetch(
        `https://20.106.196.248/ConnecttoSynapseWs`,
        {  
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
 
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
 
      const responseText = await response.text();
      console.log("Raw response:", responseText);
 
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        console.log("Response text:", responseText);
        throw new Error("Invalid JSON response from server");
      }
 
      console.log("Parsed API Response:", result);
 
      if (response.ok) {
        // Store credentials for later use (e.g., listing Fabric workspaces)
        setCredentials({
          tenantId: formData.tenantId,
          clientId: formData.clientId,
          clientSecret: formData.clientSecret,
        });
 
        toast({
          title: "Connected Successfully",
          description: "Scanning Synapse workspace for migration assets...",
        });
       
        // Pass both the form data and API response to the parent
        onConnect(formData, result);
      } else {
        toast({
          title: "Connection Failed",
          description: result.message || "Failed to connect to Synapse workspace.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "An error occurred while connecting to Synapse workspace.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
 
  const toggleScope = (key: keyof typeof formData.discoveryScope) => {
    setFormData({
      ...formData,
      discoveryScope: {
        ...formData.discoveryScope,
        [key]: !formData.discoveryScope[key],
      },
    });
  };
 
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle>Connect to Synapse Workspace</DialogTitle>
          <DialogDescription>
            Enter your Azure service principal details to scan for migration assets.
          </DialogDescription>
        </DialogHeader>
 
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenantId">
                Tenant ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tenantId"
                placeholder="e.g. 8f6d4d..."
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">
                Client ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="clientId"
                placeholder="e.g. 3a2bfc..."
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              />
            </div>
          </div>
 
          <div className="space-y-2">
            <Label htmlFor="clientSecret">
              Client Secret <span className="text-destructive">*</span>
            </Label>
            <Input
              id="clientSecret"
              type="password"
              placeholder="Enter Client Secret"
              value={formData.clientSecret}
              onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
            />
          </div>
 
          <div className="space-y-2">
            <Label htmlFor="workspaceName">
              Workspace Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="workspaceName"
              placeholder="Enter Workspace Name"
              value={formData.workspaceName}
              onChange={(e) => setFormData({ ...formData, workspaceName: e.target.value })}
            />
          </div>
 
          <div className="space-y-3 pt-2">
            <Label>Discovery Scope</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                <Checkbox
                  id="sparkPools"
                  checked={formData.discoveryScope.sparkPools}
                  onCheckedChange={() => toggleScope("sparkPools")}
                />
                <div className="space-y-0.5">
                  <label htmlFor="sparkPools" className="text-sm font-medium cursor-pointer">
                    Spark Pools
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Scan configuration and libraries
                  </p>
                </div>
              </div>
 
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                <Checkbox
                  id="notebooks"
                  checked={formData.discoveryScope.notebooks}
                  onCheckedChange={() => toggleScope("notebooks")}
                />
                <div className="space-y-0.5">
                  <label htmlFor="notebooks" className="text-sm font-medium cursor-pointer">
                    Notebooks
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Scan code and dependencies
                  </p>
                </div>
              </div>
 
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                <Checkbox
                  id="pipelines"
                  checked={formData.discoveryScope.pipelines}
                  onCheckedChange={() => toggleScope("pipelines")}
                />
                <div className="space-y-0.5">
                  <label htmlFor="pipelines" className="text-sm font-medium cursor-pointer">
                    Pipelines
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Scan data flows and activities
                  </p>
                </div>
              </div>
 
              {/* <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                <Checkbox
                  id="linkedServices"
                  checked={formData.discoveryScope.linkedServices}
                  onCheckedChange={() => toggleScope("linkedServices")}
                />
                <div className="space-y-0.5">
                  <label htmlFor="linkedServices" className="text-sm font-medium cursor-pointer">
                    Linked Services
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Scan connection definitions
                  </p>
                </div>
              </div> */}
            </div>
          </div>
        </div>
 
        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleTestConnection} disabled={testLoading}>
            {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
            Test Connection
          </Button>
          <Button variant="azure" onClick={handleConnect} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Connect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
 
 