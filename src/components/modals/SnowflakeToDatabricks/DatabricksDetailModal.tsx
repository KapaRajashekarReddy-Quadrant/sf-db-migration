import { X, Briefcase, BookOpen, Layers, Check, XCircle } from "lucide-react";
import type { DatabricksJob, DatabricksMigrationNotebook, DatabricksCatalog } from "./ConnectToDatabricks";

type DetailItem =
  | { type: "Job";      data: DatabricksJob }
  | { type: "Notebook"; data: DatabricksMigrationNotebook }
  | { type: "Catalog";  data: DatabricksCatalog };

interface DatabricksDetailModalProps {
  item: DetailItem | null;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border rounded-lg p-4">
    <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
    <div className="space-y-2.5">{children}</div>
  </div>
);

const Row = ({
  label,
  value,
  badge,
  mono,
}: {
  label: string;
  value: any;
  badge?: boolean;
  mono?: boolean;
}) => (
  <div className="flex items-start gap-3 text-sm">
    <span className="text-muted-foreground min-w-[140px] pt-0.5">{label}</span>
    <div className="flex-1">
      {badge !== undefined ? (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium ${
            badge
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-gray-500/10 text-gray-600 dark:text-gray-400"
          }`}
        >
          {badge ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {value}
        </span>
      ) : mono ? (
        <code className="text-xs text-blue-600 dark:text-blue-400 break-all bg-blue-500/5 px-2 py-1 rounded">
          {value || "N/A"}
        </code>
      ) : (
        <span className="text-foreground break-all">{value ?? "N/A"}</span>
      )}
    </div>
  </div>
);

// ── Per-type renderers ────────────────────────────────────────────────────────

const renderJob = (data: DatabricksJob) => (
  <Section title="Job Details">
    <Row label="Job Name"   value={data.job_name} />
    <Row label="Job ID"     value={data.job_id} mono />
    <Row label="Created By" value={data.created_by} />
    <Row
      label="State"
      value={data.state === "UNKNOWN" ? "Unknown" : data.state}
      badge={data.state !== "UNKNOWN" && data.state !== "FAILED"}
    />
  </Section>
);

// ── Modal ─────────────────────────────────────────────────────────────────────

const iconMap = {
  Job:      <Briefcase className="w-5 h-5" />,
  Notebook: <BookOpen  className="w-5 h-5" />,
  Catalog:  <Layers    className="w-5 h-5" />,
};

export function DatabricksDetailModal({ item, onClose }: DatabricksDetailModalProps) {
  if (!item) return null;

  const { type, data } = item;

  const displayName =
    type === "Job"      ? (data as DatabricksJob).job_name :
    type === "Notebook" ? (data as DatabricksMigrationNotebook).name :
                          (data as DatabricksCatalog).catalog_name;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {iconMap[type]}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{type} Details</h2>
              <p className="text-sm text-muted-foreground">{displayName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {type === "Job" && renderJob(data as DatabricksJob)}
        </div>
      </div>
    </div>
  );
}