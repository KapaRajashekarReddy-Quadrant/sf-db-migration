import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertCircle, FileText, RefreshCw, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LogEntry {
    timestamp: string;
    message: string;
    severity: number;
    type?: string;
}

interface LogsResponse {
    run_id: string;
    log_count: number;
    logs: LogEntry[];
}

interface LogsViewerDialogProps {
    open: boolean;
    onClose: () => void;
    jobName: string;
    runId: string;
}

export function LogsViewerDialog({
    open,
    onClose,
    jobName,
    runId,
}: LogsViewerDialogProps) {
    const { toast } = useToast();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

    const fetchLogs = async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log(`🔍 Fetching logs for runId: ${runId}`);

            const url = `https://20.106.196.248/Getlogs`;

            console.log("📡 Fetching from URL:", url);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ run_id: runId }),
            });
            console.log("📥 Response status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ API Error Response:", errorText);
                throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
            }

            const data: LogsResponse | LogEntry[] = await response.json();
            console.log("📊 Logs data received:", data);

            // Handle new nested format: { run_id, log_count, logs: [...] }
            // OR legacy flat array format: [...]
            let logsArray: LogEntry[] = [];

            if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as any).results)) {
                // New format: { results: [{ run_id, log_count, logs }], total_runs }
                const firstResult = (data as any).results[0];
                if (firstResult && Array.isArray(firstResult.logs)) {
                    logsArray = firstResult.logs;
                    console.log(`📦 Using results-wrapper format (log_count: ${firstResult.log_count})`);
                }
            } else if (data && typeof data === 'object' && 'logs' in data && Array.isArray((data as any).logs)) {
                logsArray = (data as any).logs;
                console.log(`📦 Using legacy nested format (log_count: ${(data as any).log_count})`);
            } else if (Array.isArray(data)) {
                logsArray = data;
                console.log("📦 Using legacy array format");
            } else {
                throw new Error("Invalid response format: expected results array, logs object, or flat array");
            }
            if (!Array.isArray(logsArray)) {
                throw new Error("Invalid response format: logs must be an array");
            }

            if (logsArray.length === 0) {
                setError("empty");
                setLogs([]);
            } else {
                console.log(`✅ Found ${logsArray.length} log entries`);
                setLogs(logsArray);
                setLastFetchTime(new Date());
                setError(null);
            }
        } catch (err) {
            console.error("💥 Error fetching logs:", err);
            const errorMsg = err instanceof Error ? err.message : "Failed to fetch logs";
            setError(errorMsg);
            setLogs([]);

            toast({
                title: "Error Fetching Logs",
                description: errorMsg,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open && runId) {
            console.log("🚀 Dialog opened, fetching logs for:", runId);
            fetchLogs();
        } else if (open && !runId) {
            console.error("❌ Dialog opened but no runId provided");
            setError("No run ID available for this item");
        }

        return () => {
            if (!open) {
                setLogs([]);
                setError(null);
                setLastFetchTime(null);
            }
        };
    }, [open, runId]);

    const getSeverityColor = (severity: number) => {
        switch (severity) {
            case 1: return "text-blue-600 dark:text-blue-400";
            case 2: return "text-amber-600 dark:text-amber-400";
            case 3: return "text-red-600 dark:text-red-400";
            default: return "text-muted-foreground";
        }
    };

    const getSeverityBgColor = (severity: number) => {
        switch (severity) {
            case 1: return "bg-blue-500/10";
            case 2: return "bg-amber-500/10";
            case 3: return "bg-red-500/10";
            default: return "bg-muted/30";
        }
    };

    const getSeverityLabel = (severity: number) => {
        switch (severity) {
            case 1: return "INFO";
            case 2: return "WARN";
            case 3: return "ERROR";
            default: return "LOG";
        }
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        } catch {
            return timestamp;
        }
    };

    const getLogStats = () => ({
        total: logs.length,
        info: logs.filter(l => l.severity === 1).length,
        warnings: logs.filter(l => l.severity === 2).length,
        errors: logs.filter(l => l.severity === 3).length,
    });

    const stats = getLogStats();

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0">
                <DialogHeader className="px-4 py-3 border-b shrink-0">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <FileText className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="text-base font-semibold truncate">
                                    {jobName}
                                </DialogTitle>
                                <DialogDescription className="text-xs font-mono truncate">
                                    {runId}
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Compact Stats */}
                        {!isLoading && logs.length > 0 && (
                            <div className="flex items-center gap-2 shrink-0 mr-2">
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded text-xs">
                                    <span className="text-muted-foreground">Total:</span>
                                    <span className="font-semibold">{stats.total}</span>
                                </div>
                                {stats.info > 0 && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 rounded text-xs">
                                        <span className="text-blue-600 dark:text-blue-400">Info:</span>
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.info}</span>
                                    </div>
                                )}
                                {stats.warnings > 0 && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 rounded text-xs">
                                        <span className="text-amber-600 dark:text-amber-400">Warn:</span>
                                        <span className="font-semibold text-amber-600 dark:text-amber-400">{stats.warnings}</span>
                                    </div>
                                )}
                                {stats.errors > 0 && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded text-xs">
                                        <span className="text-red-600 dark:text-red-400">Err:</span>
                                        <span className="font-semibold text-red-600 dark:text-red-400">{stats.errors}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-hidden overflow-x-hidden px-4 flex flex-col min-w-0">

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                            <p className="text-sm text-muted-foreground">Loading migration logs...</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && error === "empty" && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-full max-w-md">
                                <div className="flex flex-col items-center text-center p-6">
                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <FileText className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-base font-semibold mb-2">No Logs Available Yet</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Logs may still be processing. Try refreshing in a moment.
                                    </p>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={fetchLogs}
                                        disabled={isLoading}
                                    >
                                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                                        Refresh Logs
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {!isLoading && error && error !== "empty" && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-full max-w-md">
                                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-600">Error Loading Logs</p>
                                        <p className="text-sm text-red-600/80 mt-1">{error}</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={fetchLogs}
                                            className="mt-3"
                                            disabled={isLoading}
                                        >
                                            <RefreshCw className={cn("w-3 h-3 mr-2", isLoading && "animate-spin")} />
                                            Try Again
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Logs List */}
                    {!isLoading && logs.length > 0 && (
                        <div className="flex-1 flex flex-col overflow-hidden mt-3 min-w-0">
                            <div className="flex items-center justify-between mb-2 shrink-0">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {lastFetchTime && (
                                        <span>Updated: {lastFetchTime.toLocaleTimeString()}</span>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchLogs}
                                    disabled={isLoading}
                                    className="h-7 text-xs"
                                >
                                    <RefreshCw className={cn("w-3 h-3 mr-1.5", isLoading && "animate-spin")} />
                                    Refresh
                                </Button>
                            </div>

                            <ScrollArea className="flex-1 rounded-lg border bg-muted/20 min-w-0">
                                <div className="p-3 space-y-1.5 min-w-0">
                                    {logs.map((log, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "p-2.5 rounded-md hover:bg-accent/50 transition-colors min-w-0",
                                                getSeverityBgColor(log.severity)
                                            )}
                                        >
                                            <div className="flex items-start gap-3 font-mono text-[13px] min-w-0">
                                                <span
                                                    className={cn(
                                                        "font-bold px-1.5 py-0.5 rounded text-[10px] min-w-[42px] text-center shrink-0",
                                                        getSeverityColor(log.severity)
                                                    )}
                                                >
                                                    {getSeverityLabel(log.severity)}
                                                </span>
                                                <span className="text-muted-foreground/80 min-w-[130px] shrink-0 text-[11px]">
                                                    {formatTimestamp(log.timestamp)}
                                                </span>
                                                <span className="flex-1 break-all whitespace-pre-wrap text-foreground leading-relaxed min-w-0">
                                                    {log.message}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t shrink-0">
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={onClose} size="sm">
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
