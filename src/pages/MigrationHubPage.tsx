import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cpu, Database, ArrowRight, User } from "lucide-react";

interface MigrationHubPageProps {
  userName?: string;
}

export function MigrationHubPage({ userName = "User" }: MigrationHubPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center bg-background p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 -z-10" />
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Migration Hub</h1>
          <p className="text-muted-foreground text-sm">
            Welcome, <span className="font-medium text-foreground">{userName}</span>
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Where would you like to migrate to?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Fabric */}
          <Card
            className="cursor-pointer border-2 hover:border-primary/50 hover:shadow-md transition-all group"
            onClick={() => navigate("/fabricjobshome")}
          >
            <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Cpu className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-1">Microsoft Fabric</h2>
                <p className="text-sm text-muted-foreground">
                  Migrate from Synapse or Databricks into Fabric workspaces
                </p>
              </div>
              <Button variant="azure" className="w-full mt-2">
                Go to Fabric
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </CardContent>
          </Card>

          {/* Databricks */}
          <Card
            className="cursor-pointer border-2 hover:border-primary/50 hover:shadow-md transition-all group"
            onClick={() => navigate("/databricks-hub")}
          >
            <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-1">Databricks</h2>
                <p className="text-sm text-muted-foreground">
                  Migrate from Snowflake into Databricks workspaces
                </p>
              </div>
              <Button variant="azure" className="w-full mt-2">
                Go to Databricks
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}