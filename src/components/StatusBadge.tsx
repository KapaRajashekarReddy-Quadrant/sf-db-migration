import { CheckCircle2, XCircle, Loader2, AlertTriangle, Minus, RefreshCw, Circle } from "lucide-react";
import type { Status } from "@/types/migration";

const statusConfig = {
  Success: { 
    color: "bg-success/10 text-success border-success/20", 
    label: "Created",
    icon: CheckCircle2 
  },
  Running: { 
    color: "bg-running/10 text-running border-running/20", 
    label: "Running",
    icon: Loader2 
  },
  Failed: { 
    color: "bg-destructive/10 text-destructive border-destructive/20", 
    label: "Failed",
    icon: XCircle 
  },
  Paused: { 
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20", 
    label: "Paused",
    icon: AlertTriangle 
  },
  Skipped: { 
    color: "bg-gray-500/10 text-gray-600 border-gray-500/20", 
    label: "Skipped",
    icon: Minus 
  },
  Replaced: { 
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20", 
    label: "Replaced",
    icon: RefreshCw 
  },
  Ready: { 
    color: "bg-muted/50 text-muted-foreground border-muted", 
    label: "Ready",
    icon: Circle 
  },
  Warning: {
  color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  label: "Warning",
  icon: AlertTriangle,
},
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className={`w-3 h-3 ${status === "Running" ? "animate-spin" : ""}`} />
      {config.label}
    </div>
  );
}