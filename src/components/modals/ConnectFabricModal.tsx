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
// import { Loader2 } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { useFabricCredentials } from "@/contexts/FabricCredentialsContext";

// interface ConnectFabricModalProps {
//   open: boolean;
//   onClose: () => void;
//   onConnect: (data: any) => void;
// }

// export function ConnectFabricModal({ 
//   open, 
//   onClose, 
//   onConnect
// }: ConnectFabricModalProps) {
//   const [loading, setLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     tenantId: "0eadb77e-42dc-47f8-bbe3-ec2395e0712c",
//     clientId: "1dd09e8f-5f60-429e-8386-5ace4693440b",
//     clientSecret: " y1~8Q~Ve_Dop-gXOuoMkaHyT.Jc5MC1RSERM4boN",
//     subscriptionId: "",
//   });
//   const { toast } = useToast();
//   const { setCredentials, setApiResponse } = useFabricCredentials();

//   const handleConnect = async () => {
//     if (!formData.tenantId || !formData.clientId || !formData.clientSecret) {
//       toast({
//         title: "Missing Required Fields",
//         description: "Please fill in all required fields.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setLoading(true);
    
//     try {
//       // Store credentials in context immediately
//       setCredentials({
//         tenantId: formData.tenantId,
//         clientId: formData.clientId,
//         clientSecret: formData.clientSecret,
//       });

//       // Always fetch full workspace data
//       const payload = {
//         tenantId: formData.tenantId,
//         clientId: formData.clientId,
//         clientSecret: formData.clientSecret,
//         scope: {
//           notebooks: true,
//           pipelines: true,
//           lakehouses: true,
//           warehouses: true,
//           semanticModels: true,
//           sparkPools: true
//         }
//       };

//       const response = await fetch(
//         `https://synapsetofabricfunc-fmg2d2ejctg2eacu.eastus-01.azurewebsites.net/api/connecttofabric?code=-uLDMTMfVhKD7YVC82HCl9UKzBKt9mnAXcjAFL7qGVoeAzFuHxsSWQ==`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
      
//       // Store API response in context
//       setApiResponse(data);
      
//       toast({
//         title: "Connected Successfully",
//         description: "You are now connected to Microsoft Fabric.",
//       });
      
//       onConnect(data);
      
//     } catch (error) {
//       console.error("Connection error:", error);
//       toast({
//         title: "Connection Failed",
//         description: error instanceof Error ? error.message : "Failed to connect to Microsoft Fabric. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-md bg-card">
//         <DialogHeader>
//           <DialogTitle>Connect to Microsoft Fabric</DialogTitle>
//           <DialogDescription>
//             Enter your Azure service principal details to connect.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="space-y-4 py-4">
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
//             <Label htmlFor="subscriptionId">Subscription ID (optional)</Label>
//             <Input
//               id="subscriptionId"
//               placeholder="e.g. 1234-5678..."
//               value={formData.subscriptionId}
//               onChange={(e) => setFormData({ ...formData, subscriptionId: e.target.value })}
//             />
//           </div>
//         </div>

//         <div className="flex justify-end gap-3">
//           <Button variant="outline" onClick={onClose}>
//             Cancel
//           </Button>
//           <Button variant="azure" onClick={handleConnect} disabled={loading}>
//             {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFabricCredentials } from "@/contexts/FabricCredentialsContext";
 
interface ConnectFabricModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: (data: any) => void;
}
 
export function ConnectFabricModal({
  open,
  onClose,
  onConnect
}: ConnectFabricModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tenantId: "0eadb77e-42dc-47f8-bbe3-ec2395e0712c",
    clientId: "1dd09e8f-5f60-429e-8386-5ace4693440b",
    clientSecret: "oUT8Q~Rvm3VyQgSZCaou3CE1AZ5I5DKVk4tYJcsj",
    subscriptionId: "",
  });
  const { toast } = useToast();
  const { setCredentials, setApiResponse } = useFabricCredentials();
 
  const handleConnect = async () => {
    if (!formData.tenantId || !formData.clientId || !formData.clientSecret) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
 
    setLoading(true);
   
    try {
      // Store credentials in context immediately
      setCredentials({
        tenantId: formData.tenantId,
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
      });
 
      // Always fetch full workspace data
      const payload = {
        tenantId: formData.tenantId,
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        scope: {
          notebooks: true,
          pipelines: true,
          lakehouses: true,
          warehouses: true,
          semanticModels: true,
          sparkPools: true
        }
      };
 
      const response = await fetch(
        `https://20.106.196.248/connecttofabric`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
 
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
 
      const data = await response.json();
     
      // Store API response in context
      setApiResponse(data);
     
      toast({
        title: "Connected Successfully",
        description: "You are now connected to Microsoft Fabric.",
      });
     
      onConnect(data);
     
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Microsoft Fabric. Please try again.",
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
          <DialogTitle>Connect to Microsoft Fabric</DialogTitle>
          <DialogDescription>
            Enter your Azure service principal details to connect.
          </DialogDescription>
        </DialogHeader>
 
        <div className="space-y-4 py-4">
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
            <Label htmlFor="subscriptionId">Subscription ID (optional)</Label>
            <Input
              id="subscriptionId"
              placeholder="e.g. 1234-5678..."
              value={formData.subscriptionId}
              onChange={(e) => setFormData({ ...formData, subscriptionId: e.target.value })}
            />
          </div>
        </div>
 
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="azure" onClick={handleConnect} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Connect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
 