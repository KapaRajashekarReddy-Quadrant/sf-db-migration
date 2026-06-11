import { cn } from "@/lib/utils";
import {
  Database,
  BookOpen,
  Code2,
  Cog,
  Clock,
  Layers,
  ChevronLeft,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SnowflakeMigrationSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onBack: () => void;
  accountName: string;
}

const inventoryItems = [
  { id: "notebooks",    label: "Notebooks",      icon: BookOpen  },
  { id: "sqlWorksheets",label: "SQL Worksheets",  icon: Code2     },
  { id: "storedProcs",  label: "Stored Procs",    icon: Cog       },
  { id: "tasks",        label: "Tasks",           icon: Clock     },
  { id: "databases",    label: "Databases",       icon: Database  },
];

export function SnowflakeMigrationSidebar({
  activeTab,
  onTabChange,
  onBack,
  accountName,
}: SnowflakeMigrationSidebarProps) {
  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r flex flex-col">
      {/* Workspace selector */}
      <div className="p-4 border-b">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </button>
        <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {accountName
                .split(/[-_ ]/)
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "SF"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {accountName}
            </p>
            <p className="text-xs text-muted-foreground">Snowflake Account</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 pt-16">
        <ul className="space-y-1">
          <li>
            {/* Inventory parent — always "active" visually */}
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-sidebar-accent text-sidebar-accent-foreground font-medium">
              <Layers className="w-4 h-4" />
              Inventory
            </button>

            {/* Sub-items */}
            <ul className="ml-4 mt-1 space-y-1 border-l pl-3">
              {inventoryItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                      activeTab === item.id
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  );
}