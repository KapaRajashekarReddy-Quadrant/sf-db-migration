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
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DatabricksMigrationConfig {
  workspaceUrl: string;
  accessToken: string;
}

export interface DatabricksCatalog {
  catalog_name: string;
  note?: string;
}

export interface DatabricksMigrationNotebook {
  name: string;
  path: string;
  folder: string;
}

export interface DatabricksJob {
  job_id: number;
  job_name: string;
  created_by: string;
  state: string;
}

export interface DatabricksApiResponse {
  success: boolean;
  message?: string;
  host?: string;
  hive_metastore?: { status: string };
  catalogs: DatabricksCatalog[];
  migration_notebooks: DatabricksMigrationNotebook[];
  jobs: DatabricksJob[];
  counts: {
    hive_metastore_tables: number;
    migration_notebooks: number;
    jobs: number;
  };
}

interface ConnectDatabricksModalProps {
  open: boolean;
  onClose: () => void;
  onStartMigration: (
    config: DatabricksMigrationConfig,
    apiResponse: DatabricksApiResponse
  ) => void;
}

const DISCOVERY_ENDPOINT = "http://20.106.196.248:8001/api/discover-databricks";

export function ConnectDatabricksModal({
  open,
  onClose,
  onStartMigration,
}: ConnectDatabricksModalProps) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<DatabricksMigrationConfig>({
    workspaceUrl: "https://adb-7405608725974682.2.azuredatabricks.net",
    accessToken: "dapi8c0bd9be0ae7a1b87d2e965c6c68b656-3",
  });

  const handleConnect = async () => {
    if (!formData.workspaceUrl || !formData.accessToken) {
      setError("Workspace URL and Access Token are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(DISCOVERY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: formData.workspaceUrl.trim(),
          token: formData.accessToken.trim(),
        }),
      });

      const data: DatabricksApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || `Request failed with status ${response.status}`
        );
      }

      toast({
        title: "Connection Successful",
        description: `Found ${data.counts.jobs} jobs, ${data.counts.migration_notebooks} notebooks, ${data.catalogs.length} catalogs`,
      });

      onStartMigration(formData, data);
      onClose();
    } catch (err: any) {
      const msg: string = err?.message ?? "Unknown error";
      if (msg.includes("401") || msg.includes("403")) {
        setError("Invalid credentials. Please check your Workspace URL and Access Token.");
      } else if (msg.includes("404")) {
        setError("Workspace not found. Please verify your Workspace URL.");
      } else if (msg.length > 120) {
        setError("Connection failed. Please check your credentials and try again.");
      } else {
        setError(msg);
      }
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
            Provide Databricks workspace details to discover jobs, notebooks, and catalogs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
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