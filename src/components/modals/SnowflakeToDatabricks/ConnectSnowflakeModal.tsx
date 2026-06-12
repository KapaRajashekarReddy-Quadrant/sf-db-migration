import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSnowflakeCredentials } from "@/contexts/SnowflakeCredentialsContext";

export interface SnowflakeApiResponse {
  success: boolean;
  message: string;
  account: string;
  current_role: string;
  counts: {
    databases: number;
    schemas: number;
    tables: number;
    tasks: number;
    stored_procedures: number;
    notebooks: number;
    worksheets: number;
  };
  databases: any[];
  tasks: any[];
  stored_procedures: any[];
  notebooks: any[];
  worksheets: any[];
}

interface ConnectSnowflakeModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: (apiResponse: SnowflakeApiResponse) => void;
}

export function ConnectSnowflakeModal({ open, onClose, onConnect }: ConnectSnowflakeModalProps) {
  const { toast } = useToast();
  const { setCredentials } = useSnowflakeCredentials();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [credentials, setCredentialFields] = useState({
    account:  "QPXJSGB-RY62199",
    user:     "navaneethhk",
    password: "Qu@Dr@nt-2o25#",
    role:     "ACCOUNTADMIN",
    token:    "eyJraWQiOiIyODIyNDIwNTc5NTI4NzEwIiwiYWxnIjoiRVMyNTYifQ.eyJwIjoiMTY4MjI5MzgwOjQzMDY2NzI4NDUzIiwiaXNzIjoiU0Y6MTAyMyIsImV4cCI6MTc4ODg3MDM3Mn0._vFuCDvbd6E-umzRBN4dX5amTNmluoQ8c-9_alN0K3EIyYrkOoeqAaOyzAA1GPLrSbewVeCYa0wZSpajjd97Sg",
  });

  const [includes, setIncludes] = useState({
    include_procedures: true,
    include_tasks:      true,
    include_notebooks:  true,
    include_worksheets: true,
  });

  const setField = (field: keyof typeof credentials, value: string) => {
    setCredentialFields((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const toggleInclude = (field: keyof typeof includes) => {
    setIncludes((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleConnect = async () => {
    const missing = [
      !credentials.account  && "account",
      !credentials.user     && "username",
      !credentials.password && "password",
      !credentials.token    && "token",
    ].filter(Boolean).join(", ");

    if (missing) {
      setError(`The following fields are required: ${missing}.`);
      return;
    }

    setLoading(true);
    setError(null);

    const requestPayload = {
      credentials: {
        account:  credentials.account.trim(),
        user:     credentials.user.trim(),
        password: credentials.password,
        role:     credentials.role.trim() || "ACCOUNTADMIN",
        token:    credentials.token.trim(),
      },
      ...includes,
    };

    try {
      const response = await fetch("https://snowflaketodatabricks-h2bgh2hch9h7f6fb.z01.azurefd.net/api/discover-snowflake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        let errData: any = {};
        try { errData = await response.json(); } catch { /* ignore */ }
        throw new Error(errData?.detail || errData?.message || `HTTP ${response.status}`);
      }

      const apiResponse: SnowflakeApiResponse = await response.json();

      setCredentials({
        account:  credentials.account.trim(),
        username: credentials.user.trim(),
        password: credentials.password,
        role:     credentials.role.trim() || "ACCOUNTADMIN",
        token:    credentials.token.trim(),
      });

      const c = apiResponse.counts;
      toast({
        title:       "Connection Successful",
        description: `Found ${c?.databases ?? 0} databases, ${c?.stored_procedures ?? 0} stored procedures, ${c?.tasks ?? 0} tasks`,
      });

      onConnect(apiResponse);
      onClose();

    } catch (err: any) {
      setError(
        err.message?.includes("401") || err.message?.includes("403")
          ? "Invalid credentials or token. Please check your details and try again."
          : err.message?.length > 120
            ? "Connection failed. Please check your credentials and try again."
            : err.message ?? "Connection failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) { setError(null); onClose(); }
  };

  const canSubmit =
    !loading &&
    !!credentials.account &&
    !!credentials.user &&
    !!credentials.password &&
    !!credentials.token;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle>Connect to Snowflake</DialogTitle>
          <DialogDescription>
            Provide your Snowflake credentials to discover and migrate assets to Databricks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Credentials</p>

            <div className="space-y-1.5">
              <Label>Account <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. QPXJSGB-RY62199" value={credentials.account}
                onChange={(e) => setField("account", e.target.value)} disabled={loading} />
              <p className="text-xs text-muted-foreground">Your Snowflake account identifier</p>
            </div>

            <div className="space-y-1.5">
              <Label>Username <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. navaneethhk" value={credentials.user}
                onChange={(e) => setField("user", e.target.value)} disabled={loading} />
            </div>

            <div className="space-y-1.5">
              <Label>Password <span className="text-destructive">*</span></Label>
              <Input type="password" placeholder="••••••••" value={credentials.password}
                onChange={(e) => setField("password", e.target.value)} disabled={loading} />
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input placeholder="ACCOUNTADMIN" value={credentials.role}
                onChange={(e) => setField("role", e.target.value)} disabled={loading} />
              <p className="text-xs text-muted-foreground">Defaults to ACCOUNTADMIN if left blank</p>
            </div>

            <div className="space-y-1.5">
              <Label>Token <span className="text-destructive">*</span></Label>
              <Input type="password" placeholder="Your Snowflake access token" value={credentials.token}
                onChange={(e) => setField("token", e.target.value)} disabled={loading} />
              <p className="text-xs text-muted-foreground">Required — your Snowflake OAuth / access token</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Discovery Options</p>
            {(
              [
                { key: "include_procedures", label: "Stored Procedures", desc: "Discover stored procedures"  },
                { key: "include_tasks",      label: "Tasks",             desc: "Discover scheduled tasks"    },
                { key: "include_notebooks",  label: "Notebooks",         desc: "Discover Snowpark notebooks" },
                { key: "include_worksheets", label: "SQL Worksheets",    desc: "Discover SQL worksheets"     },
              ] as { key: keyof typeof includes; label: string; desc: string }[]
            ).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox id={key} checked={includes[key]} onCheckedChange={() => toggleInclude(key)} disabled={loading} />
                <label htmlFor={key} className="cursor-pointer">
                  <p className="text-sm font-medium leading-none">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button variant="azure" onClick={handleConnect} disabled={!canSubmit}>
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Connecting...</>
              : <><CheckCircle2 className="w-4 h-4" />Connect</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
