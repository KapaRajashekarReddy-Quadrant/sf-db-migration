import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DatabricksJobsHome } from "./DatabricksJobsHome";
import { SnowflakeMigrationWorkspace } from "./SnowflakeMigrationWorkspace";
import { SnowflakeMigrationReport } from "./SnowflakeMigrationReport";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppView = "home" | "snowflake-workspace" | "snowflake-report";

interface SnowflakeMigrationItem {
    id: string;
    name: string;
    type: "Data" | "Notebook" | "SQLWorksheet" | "StoredProc" | "Task";
    status: "Success" | "Running" | "Failed" | "Skipped" | "Replaced" | "Warning";
    targetWorkspace?: string;
    errorMessage?: string;
    warningMessage?: string;
    databricksNotebook?: string;
    dataLevel?:          "database" | "schema" | "table";
}

// ─── Logging helpers ──────────────────────────────────────────────────────────

const LOG_PREFIX = "[SnowflakeIndex]";

function logInfo(event: string, data?: unknown) {
    console.info(`%c${LOG_PREFIX} ℹ️  ${event}`, "color: #3b82f6; font-weight: bold;", data ?? "");
}

function logSuccess(event: string, data?: unknown) {
    console.info(`%c${LOG_PREFIX} ✅ ${event}`, "color: #22c55e; font-weight: bold;", data ?? "");
}

function logWarn(event: string, data?: unknown) {
    console.warn(`%c${LOG_PREFIX} ⚠️  ${event}`, "color: #f59e0b; font-weight: bold;", data ?? "");
}

function logError(event: string, data?: unknown) {
    console.error(`%c${LOG_PREFIX} ❌ ${event}`, "color: #ef4444; font-weight: bold;", data ?? "");
}

function logGroup(label: string, fn: () => void) {
    console.group(`%c${LOG_PREFIX} 📦 ${label}`, "color: #8b5cf6; font-weight: bold;");
    fn();
    console.groupEnd();
}

// ─── Component ────────────────────────────────────────────────────────────────

const SnowflakeIndex = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [currentView, setCurrentView] = useState<AppView>("home");
    const [migrationItems, setMigrationItems] = useState<SnowflakeMigrationItem[]>([]);
    const [snowflakeApiResponse, setSnowflakeApiResponse] = useState<any>(null);

    // ── After ConnectSnowflakeModal calls onConnect ────────────────────────────
    const handleMigrateFromSnowflake = (apiResponse: any) => {
        logGroup("handleMigrateFromSnowflake — API response received", () => {
            logSuccess("Connection succeeded", {
                account: apiResponse?.account,
                role: apiResponse?.current_role,
                success: apiResponse?.success,
                message: apiResponse?.message,
            });

            logInfo("Asset counts from discovery", apiResponse?.counts ?? {});

            logInfo("Raw arrays (lengths)", {
                databases:         (apiResponse?.databases        ?? []).length,
                tasks:             (apiResponse?.tasks            ?? []).length,
                stored_procedures: (apiResponse?.stored_procedures ?? []).length,
                notebooks:         (apiResponse?.notebooks         ?? []).length,
                worksheets:        (apiResponse?.worksheets        ?? []).length,
            });

            // Deep-dump first item of each type so we can see the shape
            const first = (arr: any[], label: string) => {
                if (!arr?.length) { logWarn(`  ${label}: empty array`); return; }
                logInfo(`  ${label}[0] sample`, arr[0]);
            };
            first(apiResponse?.databases,         "databases");
            first(apiResponse?.tasks,             "tasks");
            first(apiResponse?.stored_procedures, "stored_procedures");
            first(apiResponse?.notebooks,         "notebooks");
            first(apiResponse?.worksheets,        "worksheets");

            // Warn on missing mandatory fields
            if (!apiResponse?.account)  logWarn("apiResponse.account is missing — account name will show as undefined");
            if (!apiResponse?.counts)   logWarn("apiResponse.counts is missing — stat cards will show 0");
            if (!apiResponse?.success)  logWarn("apiResponse.success is falsy — backend may have returned a soft error");
        });

        setSnowflakeApiResponse(apiResponse);
        setCurrentView("snowflake-workspace");
        navigate("/snowflake-workspace");
        logInfo("View transition → snowflake-workspace");
    };

    // ── After user clicks "Migrate" in the workspace ──────────────────────────
    const handleMigrationComplete = (items: SnowflakeMigrationItem[]) => {
        logGroup("handleMigrationComplete — initial migration items (all Running)", () => {
            logInfo(`Received ${items.length} item(s) in Running state`);

            const byType = items.reduce<Record<string, number>>((acc, i) => {
                acc[i.type] = (acc[i.type] ?? 0) + 1;
                return acc;
            }, {});
            logInfo("Breakdown by type", byType);

            items.forEach((item, idx) => {
                logInfo(`  [${idx}] id=${item.id}  name="${item.name}"  type=${item.type}  status=${item.status}`);
            });
        });

        setMigrationItems(items);
        setCurrentView("snowflake-report");
        navigate("/snowflake-report");
        logInfo("View transition → snowflake-report");
    };

    // ── Called repeatedly as each item resolves ───────────────────────────────
    const handleMigrationUpdate = (
        updateFn: (prev: SnowflakeMigrationItem[]) => SnowflakeMigrationItem[]
    ) => {
        setMigrationItems((prev) => {
            const next = updateFn(prev);

            // Find what changed
            const changed = next.filter((n, i) => {
                const p = prev[i];
                return !p || p.status !== n.status || p.errorMessage !== n.errorMessage;
            });

            if (changed.length === 0) {
                logInfo("handleMigrationUpdate — no state changes detected");
                return next;
            }

            logGroup(`handleMigrationUpdate — ${changed.length} item(s) changed`, () => {
                changed.forEach((item) => {
                    if (item.status === "Failed") {
                        logError(`  FAILED  id=${item.id}  "${item.name}"`, {
                            error: item.errorMessage,
                            type:  item.type,
                        });
                    } else if (item.status === "Warning") {
                        logWarn(`  WARNING id=${item.id}  "${item.name}"`, {
                            warning: item.warningMessage,
                            notebook: item.databricksNotebook,
                        });
                    } else if (item.status === "Skipped") {
                        logWarn(`  SKIPPED id=${item.id}  "${item.name}"`, {
                            reason: item.warningMessage,
                        });
                    } else if (item.status === "Success" || item.status === "Replaced") {
                        logSuccess(`  ${item.status.toUpperCase()} id=${item.id}  "${item.name}"`, {
                            notebook: item.databricksNotebook ?? "(none)",
                        });
                    } else {
                        logInfo(`  ${item.status.padEnd(8)} id=${item.id}  "${item.name}"`);
                    }
                });

                // Running summary after each batch
                const summary = next.reduce<Record<string, number>>((acc, i) => {
                    acc[i.status] = (acc[i.status] ?? 0) + 1;
                    return acc;
                }, {});
                logInfo("Current totals", summary);

                const runningCount = summary["Running"] ?? 0;
                if (runningCount === 0) {
                    logSuccess("All items have finished migrating 🎉", summary);
                } else {
                    logInfo(`${runningCount} item(s) still running…`);
                }
            });

            return next;
        });
    };

    // ── Back to home ──────────────────────────────────────────────────────────
    const handleBackToHome = () => {
        logInfo("handleBackToHome — clearing migration state, returning to home view");
        setCurrentView("home");
        setMigrationItems([]);
        navigate("/snowflake-workspace");
    };

    // ── Debug: log every render ───────────────────────────────────────────────
    logInfo(`Render — view="${currentView}"  items=${migrationItems.length}  apiResponse=${snowflakeApiResponse ? "present" : "null"}`);

    // ── Guards ────────────────────────────────────────────────────────────────
    if (currentView === "snowflake-workspace" && !snowflakeApiResponse) {
        logError("snowflake-workspace view requested but snowflakeApiResponse is null — falling back to home");
    }

    return (
        <>
            {currentView === "home" && (
                <DatabricksJobsHome
                    onMigrateFromSnowflake={handleMigrateFromSnowflake}
                    onBackToHub={() => navigate("/hub")}
                    userName={user?.name || "User"}
                />
            )}

            {currentView === "snowflake-workspace" && snowflakeApiResponse && (
                <SnowflakeMigrationWorkspace
                    onBack={handleBackToHome}
                    onMigrationComplete={handleMigrationComplete}
                    onMigrationUpdate={handleMigrationUpdate}
                    apiResponse={snowflakeApiResponse}
                />
            )}

            {currentView === "snowflake-report" && (
                <SnowflakeMigrationReport
                    items={migrationItems}
                    onBackToHome={handleBackToHome}
                    onMigrationUpdate={handleMigrationUpdate}
                />
            )}
        </>
    );
};

export default SnowflakeIndex;