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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

interface DatabricksSelectTargetModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DatabricksSelectTargetModal({
  open,
  onClose,
  onConfirm,
}: DatabricksSelectTargetModalProps) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [newName, setNewName] = useState("");
  const [showTargetModal, setShowTargetModal] = useState(false);

  const dummyWorkspaces = [
    { id: "ws-1", name: "Databrickstofabricws" },
    { id: "ws-2", name: "snwflktodatabricks" }
  ];

  const canConfirm = mode === "existing" ? !!selectedWorkspace : !!newName.trim();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Select Target Databricks Workspace</DialogTitle>
          <DialogDescription>
            Choose where to migrate your selected assets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup
            value={mode}
            onValueChange={(v) => {
              setMode(v as "existing" | "new");
              setSelectedWorkspace("");
              setNewName("");
            }}
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="existing" id="db-existing" />
              <Label htmlFor="db-existing" className="flex-1 cursor-pointer">
                <span className="font-medium">Use Existing Workspace</span>
                <p className="text-sm text-muted-foreground">
                  Migrate to an existing Databricks workspace
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="new" id="db-new" />
              <Label htmlFor="db-new" className="flex-1 cursor-pointer">
                <span className="font-medium">Create New Workspace</span>
                <p className="text-sm text-muted-foreground">
                  Create a new Databricks workspace for this migration
                </p>
              </Label>
            </div>
          </RadioGroup>

          {mode === "existing" ? (
            <div className="space-y-2">
              <Label>Select Workspace</Label>
              <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a workspace..." />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {dummyWorkspaces.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="db-ws-name">Workspace Name</Label>
              <Input
                id="db-ws-name"
                placeholder="e.g. My Databricks Workspace"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="azure" onClick={onConfirm} disabled={!canConfirm}>
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}