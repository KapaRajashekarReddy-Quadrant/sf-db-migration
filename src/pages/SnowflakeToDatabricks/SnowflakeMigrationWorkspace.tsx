import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { SnowflakeMigrationSidebar } from "../../components/modals/SnowflakeToDatabricks/SnowflakeMigrationSidebar";
import { useSnowflakeCredentials } from "@/contexts/SnowflakeCredentialsContext";
import { DatabricksSelectTargetModal } from "@/components/modals/SnowflakeToDatabricks/DatabricksSelectTargetModal";
import {
    Search, Filter, Grid, CheckCircle2, AlertTriangle, X,
    ChevronRight, ChevronLeft, BookOpen, Code2, Cog, Clock,
    Database, ArrowRight, Loader2, Plus, Table2,
} from "lucide-react";
import type { Status } from "@/types/migration";



// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = "notebooks" | "sqlWorksheets" | "storedProcs" | "tasks";

interface SnowflakeNotebook {
    id: string; name: string; language: string; path: string; status: Status;
    database_name?: string; schema_name?: string;
}
interface SnowflakeSQLWorksheet {
    id: string; name: string; database: string; schema: string; status: Status;
    worksheet_id?: string; sql_file?: string;
}
interface SnowflakeStoredProc {
    id: string; name: string; language: string; schema: string; status: Status;
    database_name?: string; schema_name?: string; arguments?: string; ddl?: string; ddl_file?: string;
}
interface SnowflakeTask {
    id: string; name: string; schedule: string; state: string; status: Status;
    sql_code?: string; database_name?: string; schema_name?: string;
}

// ─── Data migration types ─────────────────────────────────────────────────────

type EntityLevel = "database" | "schema" | "table";

interface DataMigrationEntity {
    id: string;
    database: string;
    schema?: string;
    table?: string;
    label: string;
    sublabel: string;
    schemaCount?: number;
    tableCount?: number;
    level: EntityLevel;
}

interface PickerSelection {
    dbs: Set<string>;
    schemas: Set<string>;
    tables: Set<string>;
}

interface SnowflakeMigrationWorkspaceProps {
    onBack: () => void;
    onMigrationComplete: (items: any[]) => void;
    onMigrationUpdate: (updateFn: (prev: any[]) => any[]) => void;
    apiResponse: any;
}

// ─── Transform ───────────────────────────────────────────────────────────────

function transformApiResponse(apiResponse: any) {
    const notebooks: SnowflakeNotebook[] = (apiResponse.notebooks || []).map((nb: any, i: number) => ({
        id: nb.name ? `nb-${nb.database_name || i}-${nb.name}` : `nb-${i}`,
        name: nb.name || `Notebook ${i + 1}`,
        language: nb.language || "Python",
        path: nb.path || "/notebooks",
        status: "Ready" as Status,
        database_name: nb.database_name,
        schema_name: nb.schema_name,
    }));

    const sqlWorksheets: SnowflakeSQLWorksheet[] = (apiResponse.worksheets || []).map((ws: any, i: number) => {
        const rawName: string = ws.worksheet_name || ws.title || ws.query_name || ws.name || "";
        const cleanName = rawName
            .replace(/\s*\([a-zA-Z0-9_-]{6,}\)\s*$/, "")
            .replace(/\s+[a-zA-Z0-9]{8,}$/, "")
            .trim();
        return {
            id: ws.worksheet_id || ws.id || `ws-${i}`,
            name: cleanName || `Worksheet ${i + 1}`,
            database: ws.database_name || ws.database || "N/A",
            schema: ws.schema_name || ws.schema || "PUBLIC",
            status: "Ready" as Status,
            worksheet_id: ws.worksheet_id || ws.id,
            sql_file: ws.sql_file,
        };
    });

    const storedProcs: SnowflakeStoredProc[] = (apiResponse.stored_procedures || []).map((sp: any, i: number) => ({
        id: sp.procedure_name ? `sp-${sp.database_name}-${sp.procedure_name}` : `sp-${i}`,
        name: sp.procedure_name || `Proc ${i + 1}`,
        language: sp.language || "SQL",
        schema: sp.schema_name || "PUBLIC",
        status: "Ready" as Status,
        database_name: sp.database_name,
        schema_name: sp.schema_name,
        arguments: sp.arguments,
        ddl: sp.ddl,
        ddl_file: sp.ddl_file,
    }));

    const tasks: SnowflakeTask[] = (apiResponse.tasks || []).map((t: any, i: number) => ({
        id: t.task_name ? `t-${t.database_name}-${t.task_name}` : `t-${i}`,
        name: t.task_name || `Task ${i + 1}`,
        schedule: t.schedule || "N/A",
        state: (t.state || "UNKNOWN").toUpperCase(),
        status: "Ready" as Status,
        sql_code: t.sql_code,
        database_name: t.database_name,
        schema_name: t.schema_name,
    }));

    return { notebooks, sqlWorksheets, storedProcs, tasks };
}

// ─── Picker key helpers ───────────────────────────────────────────────────────

const schemaKey = (db: string, schema: string) => `${db}::${schema}`;
const tableKey = (db: string, schema: string, table: string) => `${db}::${schema}::${table}`;

// ─── Build entities from picker selection ─────────────────────────────────────

function buildEntitiesFromPicker(
    selection: PickerSelection,
    apiResponse: any,
): DataMigrationEntity[] {
    const dbs: any[] = apiResponse.databases || [];
    const entities: DataMigrationEntity[] = [];
    const usedDbs = new Set<string>();
    const usedSchemas = new Set<string>();

    selection.tables.forEach(key => {
        const [dbName, schemaName, tableName] = key.split("::");
        usedDbs.add(dbName);
        usedSchemas.add(schemaKey(dbName, schemaName));
        entities.push({
            id: key,
            database: dbName,
            schema: schemaName,
            table: tableName,
            label: tableName,
            sublabel: `${dbName} › ${schemaName}`,
            level: "table",
        });
    });

    selection.schemas.forEach(key => {
        if (usedSchemas.has(key)) return;
        const [dbName, schemaName] = key.split("::");
        usedDbs.add(dbName);
        const db = dbs.find((d: any) => d.database_name === dbName);
        const schema = (db?.schemas || []).find((s: any) => s.schema_name === schemaName);
        const tableCount = (schema?.tables || []).length;
        entities.push({
            id: key,
            database: dbName,
            schema: schemaName,
            label: schemaName,
            sublabel: `${dbName} · ${tableCount} table${tableCount !== 1 ? "s" : ""}`,
            tableCount,
            level: "schema",
        });
    });

    selection.dbs.forEach(dbName => {
        if (usedDbs.has(dbName)) return;
        const db = dbs.find((d: any) => d.database_name === dbName);
        const schemas = db?.schemas || [];
        const schemaCount = schemas.length;
        const tableCount = schemas.reduce((a: number, s: any) => a + (s.tables || []).length, 0);
        entities.push({
            id: dbName,
            database: dbName,
            label: dbName,
            sublabel: `All tables · ${schemaCount} schemas · ${tableCount} tables`,
            schemaCount,
            tableCount,
            level: "database",
        });
    });

    return entities;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function buildCredentialsPayload(credentials: any): Record<string, string> {
    const p: Record<string, string> = {
        account: credentials.account,
        user: credentials.username,
        password: credentials.password,
        role: credentials.role || "ACCOUNTADMIN",
        token: credentials.token,
    };
    if (credentials.passcode && credentials.passcode !== "none") {
        p.passcode = credentials.passcode;
    }
    return p;
}

async function migrateDataApi(entities: DataMigrationEntity[], credentials: any): Promise<any> {
    const credPay = buildCredentialsPayload(credentials);

    const tables = entities.map(e => {
        if (e.level === "table") {
            return { database: e.database, schema_name: e.schema!, table_name: e.table! };
        } else if (e.level === "schema") {
            return { database: e.database, schema_name: e.schema! };
        } else {
            return { database: e.database };
        }
    });

    const payload = {
        credentials: credPay,
        tables,
        limit_tables: 100,
        batch_size: 1000,
        overwrite_existing: false,
    };

    console.log("[migrateDataApi] payload:", {
        ...payload,
        credentials: { ...credPay, token: "***", password: "***" },
    });

    const response = await fetch("https://20.106.196.248:8443/api/migrate-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(`Data migration API error: ${response.status} — ${errBody}`);
    }

    const result = await response.json();
    console.log("[migrateDataApi] response:", result);
    return result;
}

async function migrateNotebooksApi(notebooks: SnowflakeNotebook[], credentials: any, targetCatalog = "hive_metastore"): Promise<any> {
    const payload = {
        credentials: buildCredentialsPayload(credentials),
        notebooks: notebooks.map(nb => ({
            name: nb.name,
            database_name: nb.database_name || "",
            schema_name: nb.schema_name || "",
        })),
        overwrite_existing: false,
        target_catalog: targetCatalog,
    };

    console.log("[migrateNotebooksApi] payload:", { ...payload, credentials: { ...payload.credentials, token: "***", password: "***" } });

    const r = await fetch("https://20.106.196.248:8443/api/migrate-notebooks", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`Notebooks API error: ${r.status}`);

    const result = await r.json();
    console.log("[migrateNotebooksApi] response:", result);
    return result;
}

async function migrateWorksheetsApi(worksheets: SnowflakeSQLWorksheet[], targetCatalog = "hive_metastore"): Promise<any> {
    const payload = {
        worksheets: worksheets.map(ws => ({
            worksheet_name: ws.name,
            worksheet_id: ws.worksheet_id || ws.id,
            database_name: ws.database,
            schema_name: ws.schema,
            sql_file: ws.sql_file || "",
        })),
        overwrite_existing: false,
        target_catalog: targetCatalog,
    };

    console.log("[migrateWorksheetsApi] payload:", payload);

    const r = await fetch("https://20.106.196.248:8443/api/migrate-worksheets", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`Worksheets API error: ${r.status}`);

    const result = await r.json();
    console.log("[migrateWorksheetsApi] response:", result);
    return result;
}

async function migrateTasksApi(tasks: SnowflakeTask[], credentials: any, targetCatalog = "hive_metastore"): Promise<any> {
    const payload = {
        credentials: buildCredentialsPayload(credentials),
        tasks: tasks.map(t => ({
            task_name: t.name,
            database_name: t.database_name || "",
            schema_name: t.schema_name || "",
            schedule: t.schedule,
            state: t.state.toLowerCase(),
            sql_code: t.sql_code || "",
            predecessors: [],
        })),
        overwrite_existing: false,
        target_catalog: targetCatalog,
    };

    console.log("[migrateTasksApi] payload:", payload);

    const r = await fetch("https://20.106.196.248:8443/api/migrate-tasks", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`Tasks API error: ${r.status}`);

    const result = await r.json();
    console.log("[migrateTasksApi] response:", result);
    return result;
}

async function migrateStoredProcsApi(procs: SnowflakeStoredProc[], credentials: any, targetCatalog = "hive_metastore"): Promise<any> {
    const payload = {
        credentials: buildCredentialsPayload(credentials),
        procedures: procs.map(sp => ({
            procedure_name: sp.name,
            database_name: sp.database_name || "",
            schema_name: sp.schema_name || sp.schema || "PUBLIC",
            language: sp.language || "SQL",
            arguments: sp.arguments || `${sp.name}() RETURN VARCHAR`,
            ddl: sp.ddl || "",
            ddl_file: sp.ddl_file || "",
        })),
        overwrite_existing: false,
        target_catalog: targetCatalog,
    };

    console.log("[migrateStoredProcsApi] payload:", payload);

    const r = await fetch("https://20.106.196.248:8443/api/migrate-procedures", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`Procedures API error: ${r.status}`);

    const result = await r.json();
    console.log("[migrateStoredProcsApi] response:", result);
    return result;
}

// ─── Data Picker Component ────────────────────────────────────────────────────

interface DataMigrationPickerProps {
    apiResponse: any;
    initialSelection: PickerSelection;
    onConfirm: (selection: PickerSelection) => void;
    onClose: () => void;
}

function DataMigrationPicker({ apiResponse, initialSelection, onConfirm, onClose }: DataMigrationPickerProps) {
    const databases: any[] = apiResponse.databases || [];

    const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set());
    const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [sel, setSel] = useState<PickerSelection>({
        dbs: new Set(initialSelection.dbs),
        schemas: new Set(initialSelection.schemas),
        tables: new Set(initialSelection.tables),
    });

    const isDbChecked = (dbName: string) => sel.dbs.has(dbName);

    const isSchemaChecked = (dbName: string, schemaName: string, tables: any[]) =>
        sel.dbs.has(dbName) ||
        sel.schemas.has(schemaKey(dbName, schemaName)) ||
        (tables.length > 0 && tables.every(t => sel.tables.has(tableKey(dbName, schemaName, t.table_name))));

    const isTableChecked = (dbName: string, schemaName: string, tableName: string) =>
        sel.dbs.has(dbName) ||
        sel.schemas.has(schemaKey(dbName, schemaName)) ||
        sel.tables.has(tableKey(dbName, schemaName, tableName));

    const toggleDb = (dbName: string, schemas: any[]) => {
        setSel(prev => {
            const next: PickerSelection = {
                dbs: new Set(prev.dbs),
                schemas: new Set(prev.schemas),
                tables: new Set(prev.tables),
            };
            if (next.dbs.has(dbName)) {
                next.dbs.delete(dbName);
                schemas.forEach(s => {
                    next.schemas.delete(schemaKey(dbName, s.schema_name));
                    (s.tables || []).forEach((t: any) =>
                        next.tables.delete(tableKey(dbName, s.schema_name, t.table_name))
                    );
                });
            } else {
                next.dbs.add(dbName);
                schemas.forEach(s => {
                    next.schemas.delete(schemaKey(dbName, s.schema_name));
                    (s.tables || []).forEach((t: any) =>
                        next.tables.delete(tableKey(dbName, s.schema_name, t.table_name))
                    );
                });
            }
            return next;
        });
    };

    const toggleSchema = (dbName: string, schemaName: string, tables: any[]) => {
        setSel(prev => {
            const next: PickerSelection = {
                dbs: new Set(prev.dbs),
                schemas: new Set(prev.schemas),
                tables: new Set(prev.tables),
            };
            const sKey = schemaKey(dbName, schemaName);
            const currentlyChecked = isSchemaChecked(dbName, schemaName, tables);

            if (currentlyChecked) {
                next.schemas.delete(sKey);
                tables.forEach(t => next.tables.delete(tableKey(dbName, schemaName, t.table_name)));

                if (prev.dbs.has(dbName)) {
                    next.dbs.delete(dbName);
                    const db = databases.find(d => d.database_name === dbName);
                    (db?.schemas || []).forEach((s: any) => {
                        if (s.schema_name !== schemaName) {
                            next.schemas.add(schemaKey(dbName, s.schema_name));
                        }
                    });
                }
            } else {
                next.schemas.add(sKey);
                tables.forEach(t => next.tables.delete(tableKey(dbName, schemaName, t.table_name)));
            }
            return next;
        });
    };

    const toggleTable = (dbName: string, schemaName: string, tableName: string, allTables: any[]) => {
        setSel(prev => {
            const next: PickerSelection = {
                dbs: new Set(prev.dbs),
                schemas: new Set(prev.schemas),
                tables: new Set(prev.tables),
            };
            const tKey = tableKey(dbName, schemaName, tableName);
            const sKey = schemaKey(dbName, schemaName);
            const currentlyChecked = isTableChecked(dbName, schemaName, tableName);

            if (currentlyChecked) {
                next.tables.delete(tKey);

                if (prev.schemas.has(sKey) || prev.dbs.has(dbName)) {
                    next.dbs.delete(dbName);
                    next.schemas.delete(sKey);

                    if (prev.dbs.has(dbName)) {
                        const db = databases.find(d => d.database_name === dbName);
                        (db?.schemas || []).forEach((s: any) => {
                            if (s.schema_name !== schemaName) {
                                next.schemas.add(schemaKey(dbName, s.schema_name));
                            }
                        });
                    }

                    allTables
                        .filter(t => t.table_name !== tableName)
                        .forEach(t => next.tables.add(tableKey(dbName, schemaName, t.table_name)));
                }
            } else {
                next.tables.add(tKey);

                const allNowSelected = allTables.every(
                    t => t.table_name === tableName || next.tables.has(tableKey(dbName, schemaName, t.table_name))
                );
                if (allNowSelected && allTables.length > 0) {
                    next.schemas.add(sKey);
                    allTables.forEach(t => next.tables.delete(tableKey(dbName, schemaName, t.table_name)));
                }
            }
            return next;
        });
    };

    const toggleAll = () => {
        const allDbNames = filteredDbs.map(db => db.database_name);
        const allSelected = allDbNames.every(n => sel.dbs.has(n));
        if (allSelected) {
            setSel({ dbs: new Set(), schemas: new Set(), tables: new Set() });
        } else {
            setSel({ dbs: new Set(allDbNames), schemas: new Set(), tables: new Set() });
        }
    };

    const toggleDbExpand = (dbName: string) =>
        setExpandedDbs(prev => { const n = new Set(prev); n.has(dbName) ? n.delete(dbName) : n.add(dbName); return n; });

    const toggleSchemaExpand = (key: string) =>
        setExpandedSchemas(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

    const filteredDbs = searchQuery.trim()
        ? databases.filter(db =>
            db.database_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (db.schemas || []).some((s: any) =>
                s.schema_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.tables || []).some((t: any) => t.table_name.toLowerCase().includes(searchQuery.toLowerCase()))
            ))
        : databases;

    const selectedEntities = buildEntitiesFromPicker(sel, apiResponse);
    const totalCount = selectedEntities.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-xl shadow-2xl w-[600px] max-h-[82vh] flex flex-col border border-border">

                <div className="flex items-start justify-between p-5 border-b">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Select Data to Migrate</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Select at the database, schema, or individual table level.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-0.5">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-4 pt-3 pb-2 border-b">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search databases, schemas or tables..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
                    {databases.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">No databases available in API response</p>
                        </div>
                    ) : filteredDbs.length === 0 ? (
                        <p className="text-center py-8 text-sm text-muted-foreground">No results match your search</p>
                    ) : (
                        <>
                            <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 cursor-pointer border-b border-border/50 mb-2 pb-3">
                                <Checkbox
                                    checked={filteredDbs.length > 0 && filteredDbs.every(db => sel.dbs.has(db.database_name))}
                                    onCheckedChange={toggleAll}
                                />
                                <span className="text-sm font-medium text-muted-foreground">Select all databases</span>
                            </label>

                            {filteredDbs.map(db => {
                                const dbName = db.database_name;
                                const schemas = db.schemas || [];
                                const dbExpanded = expandedDbs.has(dbName);

                                return (
                                    <div key={dbName}>
                                        <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/30">
                                            <Checkbox
                                                checked={isDbChecked(dbName)}
                                                onCheckedChange={() => toggleDb(dbName, schemas)}
                                            />
                                            <button
                                                className="flex items-center gap-2 flex-1 text-left min-w-0"
                                                onClick={() => toggleDbExpand(dbName)}
                                            >
                                                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${dbExpanded ? "rotate-90" : ""}`} />
                                                <Database className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                <span className="font-semibold text-sm text-foreground truncate">{dbName}</span>
                                                <span className="text-xs text-muted-foreground ml-1 flex-shrink-0">
                                                    {schemas.length} schema{schemas.length !== 1 ? "s" : ""}
                                                </span>
                                            </button>
                                        </div>

                                        {dbExpanded && schemas.map((s: any) => {
                                            const sName = s.schema_name;
                                            const sKey = schemaKey(dbName, sName);
                                            const tables = s.tables || [];
                                            const sExpanded = expandedSchemas.has(sKey);

                                            return (
                                                <div key={sKey} className="ml-7">
                                                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/30">
                                                        <Checkbox
                                                            checked={isSchemaChecked(dbName, sName, tables)}
                                                            onCheckedChange={() => toggleSchema(dbName, sName, tables)}
                                                        />
                                                        <button
                                                            className="flex items-center gap-2 flex-1 text-left min-w-0"
                                                            onClick={() => toggleSchemaExpand(sKey)}
                                                        >
                                                            <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 ${sExpanded ? "rotate-90" : ""}`} />
                                                            <Code2 className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                                                            <span className="text-sm font-medium text-foreground truncate">{sName}</span>
                                                            <span className="text-xs text-muted-foreground ml-1 flex-shrink-0">
                                                                {tables.length} table{tables.length !== 1 ? "s" : ""}
                                                            </span>
                                                        </button>
                                                    </div>

                                                    {sExpanded && (
                                                        <div className="ml-7 space-y-0.5 pb-1">
                                                            {tables.length === 0 ? (
                                                                <p className="text-xs text-muted-foreground px-2 py-1">No tables</p>
                                                            ) : tables.map((t: any) => (
                                                                <div
                                                                    key={t.table_name}
                                                                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/30 cursor-pointer"
                                                                    onClick={() => toggleTable(dbName, sName, t.table_name, tables)}
                                                                >
                                                                    <Checkbox
                                                                        checked={isTableChecked(dbName, sName, t.table_name)}
                                                                        onCheckedChange={() => toggleTable(dbName, sName, t.table_name, tables)}
                                                                    />
                                                                    <Table2 className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
                                                                    <span className="text-sm text-foreground/70 flex-1 truncate">{t.table_name}</span>
                                                                    {t.row_count != null && (
                                                                        <span className="text-xs text-muted-foreground flex-shrink-0">
                                                                            {t.row_count.toLocaleString()} rows
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                <div className="flex items-center justify-between px-5 py-4 border-t bg-muted/10">
                    <span className="text-sm text-muted-foreground">
                        {totalCount === 0
                            ? "Nothing selected"
                            : `${totalCount} item${totalCount !== 1 ? "s" : ""} selected`}
                    </span>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button variant="azure" onClick={() => onConfirm(sel)} disabled={totalCount === 0}>
                            <Plus className="w-4 h-4" />
                            Add to Migration
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Workspace Component ─────────────────────────────────────────────────

export function SnowflakeMigrationWorkspace({
    onBack, onMigrationComplete, onMigrationUpdate, apiResponse,
}: SnowflakeMigrationWorkspaceProps) {
    const { credentials } = useSnowflakeCredentials();
    const { notebooks, sqlWorksheets, storedProcs, tasks } = transformApiResponse(apiResponse);

    const [activeTab, setActiveTab] = useState<TabType>("notebooks");
    const [selectedItems, setSelectedItems] = useState<Record<TabType, string[]>>({
        notebooks: [], sqlWorksheets: [], storedProcs: [], tasks: [],
    });
    const [showReview, setShowReview] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isMigrating, setIsMigrating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const [showDataPicker, setShowDataPicker] = useState(false);
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [pickerSelection, setPickerSelection] = useState<PickerSelection>({
        dbs: new Set(),
        schemas: new Set(),
        tables: new Set(),
    });
    const [dataEntities, setDataEntities] = useState<DataMigrationEntity[]>([]);

    const totalAssets =
        (apiResponse.counts?.stored_procedures ?? storedProcs.length) +
        (apiResponse.counts?.tasks ?? tasks.length) +
        (apiResponse.counts?.notebooks ?? notebooks.length) +
        (apiResponse.counts?.worksheets ?? sqlWorksheets.length);

    const filterItems = <T extends Record<string, any>>(items: T[]): T[] =>
        items.filter(item => {
            const matchesSearch = !searchQuery ||
                Object.values(item).some(v => v != null && String(v).toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();
            return matchesSearch && matchesStatus;
        });

    const filteredNotebooks = filterItems(notebooks);
    const filteredSqlWorksheets = filterItems(sqlWorksheets);
    const filteredStoredProcs = filterItems(storedProcs);
    const filteredTasks = filterItems(tasks);

    const activeFiltered = (): any[] => {
        switch (activeTab) {
            case "notebooks": return filteredNotebooks;
            case "sqlWorksheets": return filteredSqlWorksheets;
            case "storedProcs": return filteredStoredProcs;
            case "tasks": return filteredTasks;
        }
    };

    const paginate = <T,>(data: T[]): T[] =>
        data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const toggleItem = (tab: TabType, id: string) =>
        setSelectedItems(prev => ({
            ...prev,
            [tab]: prev[tab].includes(id) ? prev[tab].filter(i => i !== id) : [...prev[tab], id],
        }));

    const toggleAll = (tab: TabType, items: { id: string }[]) => {
        const allIds = items.map(i => i.id);
        const allSelected = allIds.every(id => selectedItems[tab].includes(id));
        setSelectedItems(prev => ({ ...prev, [tab]: allSelected ? [] : allIds }));
    };

    const resourceSelectedCount = Object.values(selectedItems).flat().length;
    const totalSelected = resourceSelectedCount + dataEntities.length;

    type ItemType = "Notebook" | "SQLWorksheet" | "StoredProc" | "Task" | "Data";

    const getSelectedDetails = () => {
        const out: (Record<string, any> & { itemType: ItemType })[] = [];
        const push = (tab: TabType, src: any[], type: ItemType) =>
            selectedItems[tab].forEach(id => {
                const item = src.find(n => n.id === id);
                if (item) out.push({ ...item, itemType: type });
            });
        push("notebooks", notebooks, "Notebook");
        push("sqlWorksheets", sqlWorksheets, "SQLWorksheet");
        push("storedProcs", storedProcs, "StoredProc");
        push("tasks", tasks, "Task");
        return out;
    };

    const removeResourceItem = (itemType: ItemType, id: string) => {
        const tabMap: Record<ItemType, TabType> = {
            Notebook: "notebooks",
            SQLWorksheet: "sqlWorksheets",
            StoredProc: "storedProcs",
            Task: "tasks",
            Data: "notebooks",
        };
        setSelectedItems(prev => ({ ...prev, [tabMap[itemType]]: prev[tabMap[itemType]].filter(i => i !== id) }));
    };

    const handlePickerConfirm = (sel: PickerSelection) => {
        const entities = buildEntitiesFromPicker(sel, apiResponse);
        setPickerSelection(sel);
        setDataEntities(entities);
        setShowDataPicker(false);
    };

    const removeDataEntity = (entityId: string) => {
        const next = dataEntities.filter(e => e.id !== entityId);
        const nextSel: PickerSelection = { dbs: new Set(), schemas: new Set(), tables: new Set() };
        next.forEach(e => {
            if (e.level === "database") nextSel.dbs.add(e.database);
            else if (e.level === "schema") nextSel.schemas.add(`${e.database}::${e.schema}`);
            else if (e.level === "table") nextSel.tables.add(`${e.database}::${e.schema}::${e.table}`);
        });
        setDataEntities(next);
        setPickerSelection(nextSel);
    };

    // ── Migration ─────────────────────────────────────────────────────────────

    const handleStartMigration = async () => {
        const details = getSelectedDetails();
        const hasData = dataEntities.length > 0;
        if (details.length === 0 && !hasData) return;
        if (!credentials) return;

        setIsMigrating(true);

        const initialItems = [
            ...details.map(item => ({
                id: item.id, name: item.name, type: item.itemType, status: "Running" as const,
            })),
            ...dataEntities.map(e => ({
                id: e.id, name: e.label, type: "Data" as const, status: "Running" as const,
                dataLevel: e.level,
            })),
        ];
        onMigrationComplete(initialItems);

        const selectedTaskItems = details
            .filter(d => d.itemType === "Task")
            .map(d => tasks.find(t => t.id === d.id)!)
            .filter(Boolean);

        const selectedProcItems = details
            .filter(d => d.itemType === "StoredProc")
            .map(d => storedProcs.find(sp => sp.id === d.id)!)
            .filter(Boolean);

        const nonApiItems = details.filter(d => d.itemType !== "Task" && d.itemType !== "StoredProc");

        // ── 1. Tasks ──────────────────────────────────────────────────────────
        if (selectedTaskItems.length > 0) {
            try {
                const result = await migrateTasksApi(selectedTaskItems, credentials);

                selectedTaskItems.forEach(task => {
                    // migrated_jobs.snowflake_tasks is an ARRAY of task names
                    const migrated = result.migrated_jobs?.find((m: any) =>
                        Array.isArray(m.snowflake_tasks)
                            ? m.snowflake_tasks.includes(task.name)
                            : m.databricks_job_name === task.name
                    );

                    // skipped_jobs[].job is the job/task name
                    const skipped = result.skipped_jobs?.find((s: any) =>
                        s.job === task.name
                    );

                    // failed[].job or failed[].component (array of names in a pipeline)
                    const failed = result.failed?.find((f: any) =>
                        f.job === task.name ||
                        (Array.isArray(f.component) && f.component.includes(task.name))
                    );

                    // warnings surface unsupported SQL features (COPY INTO, SYSTEM$, etc.)
                    const warning = result.warnings?.find((w: any) =>
                        w.task === task.name
                    );

                    let status: "Success" | "Failed" | "Skipped" = "Success";
                    let errorMessage: string | undefined;
                    let warningMessage: string | undefined;
                    let databricksNotebook: string | undefined;

                    if (failed) {
                        status = "Failed";
                        errorMessage = failed.error || "Migration failed";
                    } else if (skipped) {
                        status = "Skipped";
                        warningMessage = skipped.reason || "Job already exists";
                    } else if (migrated) {
                        status = "Success";
                        databricksNotebook = `/jobs/${migrated.job_id} (${migrated.databricks_job_name})`;
                        // Surface warnings even on success (e.g. unsupported SQL features detected)
                        if (warning) warningMessage = warning.warning;
                    } else if (result.success === false) {
                        status = "Failed";
                        errorMessage = result.message || "Migration failed";
                    } else {
                        // Item not found in any array
                        status = "Failed";
                        errorMessage = "Not returned in API response";
                    }

                    onMigrationUpdate(prev =>
                        prev.map(i => i.id === task.id
                            ? { ...i, status, errorMessage, warningMessage, databricksNotebook }
                            : i)
                    );
                });
            } catch (err: any) {
                selectedTaskItems.forEach(task =>
                    onMigrationUpdate(prev =>
                        prev.map(i => i.id === task.id
                            ? { ...i, status: "Failed", errorMessage: err.message || "API error" }
                            : i)
                    )
                );
            }
        }

        // ── 2. Stored Procedures ──────────────────────────────────────────────
        if (selectedProcItems.length > 0) {
            try {
                const result = await migrateStoredProcsApi(selectedProcItems, credentials);
                selectedProcItems.forEach(proc => {
                    const migrated = result.migrated?.find((m: any) =>
                        m.snowflake_procedure === `${proc.database_name}.${proc.schema_name || proc.schema}.${proc.name}` ||
                        m.snowflake_procedure?.includes(proc.name)
                    );
                    const skipped = result.skipped?.find((s: any) =>
                        s.snowflake_procedure === `${proc.database_name}.${proc.schema_name || proc.schema}.${proc.name}` ||
                        s.snowflake_procedure?.includes(proc.name)
                    );
                    const failed = result.failed?.find((f: any) =>
                        f.procedure?.includes(proc.name) || f.snowflake_procedure?.includes(proc.name)
                    );

                    let status: "Success" | "Failed" | "Skipped" = "Success";
                    let errorMessage: string | undefined;
                    let warningMessage: string | undefined;
                    let databricksNotebook: string | undefined;

                    if (failed) {
                        status = "Failed";
                        errorMessage = failed.error || "Migration failed";
                    } else if (skipped) {
                        status = "Skipped";
                        warningMessage = skipped.reason || skipped.status || "Already exists";
                        databricksNotebook = skipped.databricks_notebook;
                    } else if (migrated) {
                        status = "Success";
                        databricksNotebook = migrated.databricks_notebook;
                    } else if (result.success === false) {
                        status = "Failed";
                        errorMessage = result.message || "Migration failed";
                    } else {
                        status = "Success";
                    }

                    onMigrationUpdate(prev =>
                        prev.map(i => i.id === proc.id ? { ...i, status, errorMessage, warningMessage, databricksNotebook } : i)
                    );
                });
            } catch (err: any) {
                selectedProcItems.forEach(proc =>
                    onMigrationUpdate(prev =>
                        prev.map(i => i.id === proc.id ? { ...i, status: "Failed", errorMessage: err.message || "API error" } : i)
                    )
                );
            }
        }

        // ── 3. Data (databases / schemas / tables) ────────────────────────────
        if (dataEntities.length > 0) {
            try {
                const result = await migrateDataApi(dataEntities, credentials);

                dataEntities.forEach(entity => {
                    const sourceLower = (s: string) => (s || "").replace(/"/g, "").toLowerCase();

                    const belongsToEntity = (row: any) => {
                        const src = (row.source || row.table_name || row.target || "")
                            .replace(/"/g, "")
                            .toLowerCase();

                        if (entity.level === "table") {
                            // match DB.SCHEMA.TABLE exactly
                            const fullKey = `${entity.database}.${entity.schema}.${entity.table}`.toLowerCase();
                            return src.includes(fullKey);
                        }

                        if (entity.level === "schema") {
                            // match DB.SCHEMA exactly — not just a substring
                            const fullKey = `${entity.database}.${entity.schema}`.toLowerCase();
                            // src looks like: "MIGRATION_TEST"."PUBLIC"."EMPLOYEE" → migration_test.public.employee
                            return src.includes(fullKey.replace(/\./g, "."));
                        }

                        // database level — match the DB name as a word boundary, not just substring
                        // src: '"MIGRATION_DB"."PUBLIC"."SALES_DATA"' → migration_db.public.sales_data
                        // We extract just the DB portion (everything before the first dot after stripping quotes)
                        const srcDb = src.split(".")[0].replace(/[^a-z0-9_]/g, "");
                        const entityDb = entity.database.toLowerCase().replace(/[^a-z0-9_]/g, "");
                        return srcDb === entityDb;  // exact match, not includes()
                    };

                    const migratedRows = (result.migrated_tables || []).filter(belongsToEntity);
                    const skippedRows = (result.skipped_tables || []).filter(belongsToEntity);
                    const failedRows = (result.failed_tables || []).filter(belongsToEntity);

                    let status: "Success" | "Failed" | "Skipped" = "Success";
                    let errorMessage: string | undefined;
                    let warningMessage: string | undefined;
                    let databricksNotebook: string | undefined;

                    if (result.success === false && migratedRows.length === 0 && skippedRows.length === 0) {
                        status = "Failed";
                        errorMessage = result.message || "Migration failed";
                    } else if (failedRows.length > 0 && migratedRows.length === 0 && skippedRows.length === 0) {
                        status = "Failed";
                        errorMessage = failedRows[0].error || failedRows[0].status || "Migration failed";
                    } else if (skippedRows.length > 0 && migratedRows.length === 0) {
                        status = "Skipped";
                        warningMessage = skippedRows[0].reason || skippedRows[0].status || "Already exists";
                        databricksNotebook = skippedRows[0].target;
                    } else if (migratedRows.length > 0) {
                        // Partial success: some migrated, some failed — show Success but note failures
                        status = "Success";
                        databricksNotebook = migratedRows[0].target;
                        if (failedRows.length > 0) {
                            warningMessage = `${failedRows.length} table(s) failed: ${failedRows[0].error || "unknown error"}`;
                        }
                    } else if (result.success === true) {
                        // top-level success but item not in any detailed array
                        status = "Success";
                        databricksNotebook = result.target_catalog
                            ? `${result.target_catalog}.${entity.database}`
                            : undefined;
                    } else {
                        status = "Failed";
                        errorMessage = result.message || "Not returned in API response";
                    }

                    onMigrationUpdate(prev =>
                        prev.map(i => i.id === entity.id ? { ...i, status, errorMessage, warningMessage, databricksNotebook } : i)
                    );
                });
            } catch (err: any) {
                dataEntities.forEach(entity =>
                    onMigrationUpdate(prev =>
                        prev.map(i => i.id === entity.id ? { ...i, status: "Failed", errorMessage: err.message || "API error" } : i)
                    )
                );
            }
        }

        // ── 4. Notebooks ──────────────────────────────────────────────────────
        const selectedNotebookItems = nonApiItems
            .filter(d => d.itemType === "Notebook")
            .map(d => notebooks.find(n => n.id === d.id)!)
            .filter(Boolean);

        if (selectedNotebookItems.length > 0) {
            try {
                const result = await migrateNotebooksApi(selectedNotebookItems, credentials);
                selectedNotebookItems.forEach(nb => {
                    const migrated = result.migrated?.find((m: any) =>
                        m.snowflake_notebook === nb.name || m.snowflake_notebook?.includes(nb.name)
                    );
                    const failed = result.failed?.find((f: any) =>
                        f.notebook === nb.name || f.notebook?.includes(nb.name)
                    );

                    let status: "Success" | "Failed" = "Success";
                    let errorMessage: string | undefined;
                    let databricksNotebook: string | undefined;

                    if (failed) {
                        status = "Failed";
                        errorMessage = failed.error || "Migration failed";
                    } else if (migrated) {
                        status = "Success";
                        databricksNotebook = migrated.databricks_path;
                    } else if (result.success === false) {
                        status = "Failed";
                        errorMessage = result.message || "Migration failed";
                    } else {
                        status = "Failed";
                        errorMessage = "No result returned for this notebook";
                    }

                    onMigrationUpdate(prev =>
                        prev.map(i => i.id === nb.id ? { ...i, status, errorMessage, databricksNotebook } : i)
                    );
                });
            } catch (err: any) {
                selectedNotebookItems.forEach(nb =>
                    onMigrationUpdate(prev =>
                        prev.map(i => i.id === nb.id ? { ...i, status: "Failed", errorMessage: err.message || "API error" } : i)
                    )
                );
            }
        }

        // ── 5. SQL Worksheets ─────────────────────────────────────────────────
        const selectedWorksheetItems = nonApiItems
            .filter(d => d.itemType === "SQLWorksheet")
            .map(d => sqlWorksheets.find(w => w.id === d.id)!)
            .filter(Boolean);

        if (selectedWorksheetItems.length > 0) {
            try {
                const result = await migrateWorksheetsApi(selectedWorksheetItems);
                selectedWorksheetItems.forEach(ws => {
                    const migrated = result.migrated?.find((m: any) =>
                        m.worksheet_name === ws.name || m.worksheet_name?.includes(ws.name)
                    );
                    const failed = result.failed?.find((f: any) =>
                        f.worksheet_name === ws.name || f.worksheet_name?.includes(ws.name)
                    );

                    let status: "Success" | "Failed" = "Success";
                    let errorMessage: string | undefined;
                    let databricksNotebook: string | undefined;

                    if (failed) {
                        status = "Failed";
                        errorMessage = failed.error || "Migration failed";
                    } else if (migrated) {
                        status = "Success";
                        databricksNotebook = migrated.notebook_path;
                    } else if (result.success === false) {
                        status = "Failed";
                        errorMessage = result.message || "Migration failed";
                    } else {
                        status = "Failed";
                        errorMessage = "No result returned for this worksheet";
                    }

                    onMigrationUpdate(prev =>
                        prev.map(i => i.id === ws.id ? { ...i, status, errorMessage, databricksNotebook } : i)
                    );
                });
            } catch (err: any) {
                selectedWorksheetItems.forEach(ws =>
                    onMigrationUpdate(prev =>
                        prev.map(i => i.id === ws.id ? { ...i, status: "Failed", errorMessage: err.message || "API error" } : i)
                    )
                );
            }
        }

        setIsMigrating(false);
    };

    // ── UI helpers ────────────────────────────────────────────────────────────

    const NameCell = ({ icon: Icon, name }: { icon: React.ElementType; name: string }) => (
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                <Icon className="w-3 h-3 text-primary" />
            </div>
            <span className="font-medium text-primary">{name}</span>
        </div>
    );

    const SelectAllCheckbox = ({ tab, items }: { tab: TabType; items: { id: string }[] }) => (
        <Checkbox
            checked={items.length > 0 && items.every(i => selectedItems[tab].includes(i.id))}
            onCheckedChange={() => toggleAll(tab, items)}
        />
    );

    const EntityLevelPill = ({ entity }: { entity: DataMigrationEntity }) => {
        if (entity.level === "table") {
            return (
                <div className="flex items-center gap-3 min-w-0">
                    <Table2 className="w-4 h-4 text-primary/60 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{entity.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{entity.sublabel}</p>
                        <p className="text-xs text-primary mt-0.5">Table migration</p>
                    </div>
                </div>
            );
        }
        if (entity.level === "schema") {
            return (
                <div className="flex items-center gap-3 min-w-0">
                    <Code2 className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{entity.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{entity.sublabel}</p>
                        <p className="text-xs text-primary mt-0.5">Schema migration</p>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-3 min-w-0">
                <Database className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{entity.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{entity.sublabel}</p>
                    <p className="text-xs text-primary mt-0.5">Database migration</p>
                </div>
            </div>
        );
    };

    // =========================================================
    // REVIEW VIEW
    // =========================================================

    if (showReview) {
        const details = getSelectedDetails();

        const groups: { type: ItemType; label: string; icon: React.ElementType }[] = [
            { type: "Notebook", label: "Notebooks", icon: BookOpen },
            { type: "SQLWorksheet", label: "SQL Worksheets", icon: Code2 },
            { type: "StoredProc", label: "Stored Procs", icon: Cog },
            { type: "Task", label: "Tasks", icon: Clock },
        ];

        const subLabel = (item: any) => {
            if (item.language) return item.language;
            if (item.database) return `${item.database}.${item.schema}`;
            if (item.schedule) return item.schedule;
            return "";
        };

        return (
            <>
                {showDataPicker && (
                    <DataMigrationPicker
                        apiResponse={apiResponse}
                        initialSelection={pickerSelection}
                        onConfirm={handlePickerConfirm}
                        onClose={() => setShowDataPicker(false)}
                    />
                )}

                <DatabricksSelectTargetModal
                    open={showTargetModal}
                    onClose={() => setShowTargetModal(false)}
                    onConfirm={() => {
                        setShowTargetModal(false);
                        handleStartMigration();
                    }}
                />
                <div className="min-h-screen bg-background">
                    <main className="p-6 max-w-4xl mx-auto">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                            <button onClick={() => setShowReview(false)} className="hover:text-foreground">
                                Discovery Results
                            </button>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-foreground font-medium">Review Selection</span>
                        </div>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Review Selected Items ({totalSelected})</CardTitle>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowDataPicker(true)}
                                        className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
                                    >
                                        <Database className="w-4 h-4" />
                                        Migrate Data
                                        {dataEntities.length > 0 && (
                                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 rounded-full">
                                                {dataEntities.length}
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                {groups.map(({ type, label, icon: Icon }) => {
                                    const items = details.filter(i => i.itemType === type);
                                    if (items.length === 0) return null;
                                    return (
                                        <div key={type}>
                                            <h4 className="font-medium mb-3 flex items-center gap-2">
                                                <Icon className="w-4 h-4 text-primary" />
                                                {label} ({items.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {items.map(item => (
                                                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                                        <div>
                                                            <p className="font-medium">{item.name}</p>
                                                            {subLabel(item) && (
                                                                <p className="text-sm text-muted-foreground">{subLabel(item)}</p>
                                                            )}
                                                            {item.itemType === "Task" && (
                                                                <p className="text-xs text-primary mt-0.5">Tasks migration API</p>
                                                            )}
                                                            {item.itemType === "StoredProc" && (
                                                                <p className="text-xs text-primary mt-0.5">Procedures migration API</p>
                                                            )}
                                                        </div>
                                                        <Button variant="ghost" size="icon" onClick={() => removeResourceItem(type, item.id)}>
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {dataEntities.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                            <Database className="w-4 h-4 text-primary" />
                                            Data Migration ({dataEntities.length} item{dataEntities.length !== 1 ? "s" : ""})
                                        </h4>
                                        <div className="space-y-2">
                                            {dataEntities.map(entity => (
                                                <div key={entity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                                    <EntityLevelPill entity={entity} />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="flex-shrink-0 ml-2"
                                                        onClick={() => removeDataEntity(entity.id)}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {totalSelected === 0 && (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <Grid className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                        <p className="text-sm">No items selected yet.</p>
                                        <p className="text-xs mt-1">
                                            Go back to select resources, or use "Migrate Data" to pick databases.
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-between pt-4 border-t">
                                    <Button variant="outline" onClick={() => setShowReview(false)}>
                                        Back to Selection
                                    </Button>
                                    <Button
                                        variant="azure"
                                        onClick={() => setShowTargetModal(true)}
                                        disabled={totalSelected === 0 || isMigrating}
                                    >
                                        {isMigrating
                                            ? <><Loader2 className="w-4 h-4 animate-spin" />Migrating...</>
                                            : <>Migrate <ArrowRight className="w-4 h-4" /></>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </main>
                </div>
            </>
        );
    }

    // =========================================================
    // MAIN INVENTORY VIEW
    // =========================================================

    const filtered = activeFiltered();
    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    const showingStart = filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const showingEnd = Math.min(currentPage * rowsPerPage, filtered.length);

    const tabConfig = [
        { value: "notebooks", label: "Notebooks", icon: BookOpen, count: notebooks.length },
        { value: "sqlWorksheets", label: "SQL Worksheets", icon: Code2, count: sqlWorksheets.length },
        { value: "storedProcs", label: "Stored Procs", icon: Cog, count: storedProcs.length },
        { value: "tasks", label: "Tasks", icon: Clock, count: tasks.length },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            <SnowflakeMigrationSidebar
                activeTab={activeTab}
                onTabChange={tab => { setActiveTab(tab as TabType); setCurrentPage(1); }}
                onBack={onBack}
                accountName={apiResponse.account || "Snowflake Account"}
            />

            <div className="flex-1">
                <main className="p-6 animate-fade-in">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <span>Home</span><ChevronRight className="w-4 h-4" />
                        <span>Snowflake</span><ChevronRight className="w-4 h-4" />
                        <span className="text-foreground font-medium">Discovery Results</span>
                    </div>

                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground mb-1">Discovery Results</h1>
                            <p className="text-sm text-success flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" />Scan completed successfully
                            </p>
                        </div>
                        <Button variant="azure" disabled={totalSelected === 0} onClick={() => setShowReview(true)}>
                            Migrate Selected ({totalSelected})
                        </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            { label: "Total Assets", value: totalAssets, icon: Grid, color: "primary" },
                            { label: "Ready to Migrate", value: totalAssets, icon: CheckCircle2, color: "success" },
                            { label: "Conflicts / Errors", value: 0, icon: AlertTriangle, color: "destructive" },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <Card key={label} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{label}</p>
                                        <p className={`text-3xl font-bold text-${color}`}>{value}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 text-${color}`} />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <Tabs value={activeTab} onValueChange={v => { setActiveTab(v as TabType); setCurrentPage(1); }}>
                        <TabsList className="bg-muted/50 mb-4">
                            {tabConfig.map(({ value, label, icon: Icon, count }) => (
                                <TabsTrigger key={value} value={value} className="gap-2">
                                    <Icon className="w-4 h-4" />{label}
                                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">{count}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={`Filter ${activeTab}...`}
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="h-9 px-3 pr-8 text-sm rounded-md border border-input bg-background appearance-none cursor-pointer"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="ready">Ready</option>
                                </select>
                                <Filter className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                            {(searchQuery || statusFilter !== "all") && (
                                <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
                                    <X className="w-4 h-4 mr-1" />Clear
                                </Button>
                            )}
                            <div className="ml-auto text-sm text-muted-foreground">{totalSelected} selected</div>
                        </div>

                        {/* Notebooks */}
                        <TabsContent value="notebooks">
                            <Card><Table>
                                <TableHeader><TableRow>
                                    <TableHead className="w-12"><SelectAllCheckbox tab="notebooks" items={filteredNotebooks} /></TableHead>
                                    <TableHead>NAME</TableHead>
                                    <TableHead>LANGUAGE</TableHead>
                                    <TableHead>PATH</TableHead>
                                    <TableHead>STATUS</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                    {filteredNotebooks.length === 0
                                        ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No notebooks found</TableCell></TableRow>
                                        : paginate(filteredNotebooks).map(nb => (
                                            <TableRow key={nb.id} className="hover:bg-muted/50">
                                                <TableCell><Checkbox checked={selectedItems.notebooks.includes(nb.id)} onCheckedChange={() => toggleItem("notebooks", nb.id)} /></TableCell>
                                                <TableCell><NameCell icon={BookOpen} name={nb.name} /></TableCell>
                                                <TableCell>{nb.language}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">{nb.path}</TableCell>
                                                <TableCell><StatusBadge status={nb.status} /></TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table></Card>
                        </TabsContent>

                        {/* SQL Worksheets */}
                        <TabsContent value="sqlWorksheets">
                            <Card><Table>
                                <TableHeader><TableRow>
                                    <TableHead className="w-12"><SelectAllCheckbox tab="sqlWorksheets" items={filteredSqlWorksheets} /></TableHead>
                                    <TableHead>NAME</TableHead>
                                    <TableHead>DATABASE</TableHead>
                                    <TableHead>SCHEMA</TableHead>
                                    <TableHead>STATUS</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                    {filteredSqlWorksheets.length === 0
                                        ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No SQL worksheets found</TableCell></TableRow>
                                        : paginate(filteredSqlWorksheets).map(ws => (
                                            <TableRow key={ws.id} className="hover:bg-muted/50">
                                                <TableCell><Checkbox checked={selectedItems.sqlWorksheets.includes(ws.id)} onCheckedChange={() => toggleItem("sqlWorksheets", ws.id)} /></TableCell>
                                                <TableCell><NameCell icon={Code2} name={ws.name} /></TableCell>
                                                <TableCell>{ws.database}</TableCell>
                                                <TableCell>{ws.schema}</TableCell>
                                                <TableCell><StatusBadge status={ws.status} /></TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table></Card>
                        </TabsContent>

                        {/* Stored Procs */}
                        <TabsContent value="storedProcs">
                            <Card><Table>
                                <TableHeader><TableRow>
                                    <TableHead className="w-12"><SelectAllCheckbox tab="storedProcs" items={filteredStoredProcs} /></TableHead>
                                    <TableHead>NAME</TableHead>
                                    <TableHead>LANGUAGE</TableHead>
                                    <TableHead>SCHEMA</TableHead>
                                    <TableHead>STATUS</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                    {filteredStoredProcs.length === 0
                                        ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No stored procedures found</TableCell></TableRow>
                                        : paginate(filteredStoredProcs).map(sp => (
                                            <TableRow key={sp.id} className="hover:bg-muted/50">
                                                <TableCell><Checkbox checked={selectedItems.storedProcs.includes(sp.id)} onCheckedChange={() => toggleItem("storedProcs", sp.id)} /></TableCell>
                                                <TableCell><NameCell icon={Cog} name={sp.name} /></TableCell>
                                                <TableCell>{sp.language}</TableCell>
                                                <TableCell>{sp.schema}</TableCell>
                                                <TableCell><StatusBadge status={sp.status} /></TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table></Card>
                        </TabsContent>

                        {/* Tasks */}
                        <TabsContent value="tasks">
                            <Card><Table>
                                <TableHeader><TableRow>
                                    <TableHead className="w-12"><SelectAllCheckbox tab="tasks" items={filteredTasks} /></TableHead>
                                    <TableHead>NAME</TableHead>
                                    <TableHead>SCHEDULE</TableHead>
                                    <TableHead>STATE</TableHead>
                                    <TableHead>STATUS</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                    {filteredTasks.length === 0
                                        ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No tasks found</TableCell></TableRow>
                                        : paginate(filteredTasks).map(t => (
                                            <TableRow key={t.id} className="hover:bg-muted/50">
                                                <TableCell><Checkbox checked={selectedItems.tasks.includes(t.id)} onCheckedChange={() => toggleItem("tasks", t.id)} /></TableCell>
                                                <TableCell><NameCell icon={Clock} name={t.name} /></TableCell>
                                                <TableCell className="font-mono text-xs">{t.schedule}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded text-xs ${t.state === "STARTED" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                                                        {t.state}
                                                    </span>
                                                </TableCell>
                                                <TableCell><StatusBadge status={t.status} /></TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table></Card>
                        </TabsContent>
                    </Tabs>

                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                        <span>
                            {filtered.length === 0 ? "No items" : `Showing ${showingStart}–${showingEnd} of ${filtered.length}`}
                        </span>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => setCurrentPage(p => p - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-foreground">Page {currentPage} of {Math.max(1, totalPages)}</span>
                            <Button
                                variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage * rowsPerPage >= filtered.length}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </main>

                <footer className="text-center py-4 text-sm text-muted-foreground border-t">
                    © 2025 Migration Tool v3.1.0
                </footer>
            </div>
        </div>
    );
}