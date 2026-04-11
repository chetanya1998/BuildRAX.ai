import { Node } from "@xyflow/react";
import { Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getNodeDefinition } from "@/lib/graph/catalog";

interface NodePropertiesPanelProps {
  selectedNode: Node<Record<string, unknown>, string> | null;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
}

export function NodePropertiesPanel({ selectedNode, updateNodeData }: NodePropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm p-4 text-center border-2 border-dashed border-border/40 rounded-xl">
        <Settings className="w-8 h-8 mb-2 opacity-50" />
        <p>Select a node to edit its properties</p>
      </div>
    );
  }

  const { id, type, data } = selectedNode;
  const definition = getNodeDefinition(type);

  const handleChange = (key: string, value: unknown) => {
    updateNodeData(id, { [key]: value });
  };

  if (!definition) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{String(data?.label || type)}</h3>
          <p className="text-xs text-muted-foreground">
            This is a legacy or unsupported node type. Raw data is still editable.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Raw Data
          </Label>
          <Textarea
            className="text-xs min-h-[220px] bg-background/50 border-white/10 font-mono"
            value={JSON.stringify(data || {}, null, 2)}
            onChange={(e) => {
              try {
                handleChange("__replace__", JSON.parse(e.target.value));
              } catch {
                // Ignore invalid JSON edits until user finishes typing.
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{definition.title}</h3>
        <p className="text-xs text-muted-foreground">{definition.description}</p>
      </div>

      {definition.fields.map((field) => {
        const value = data?.[field.name];
        const currentValue = value ?? field.defaultValue ?? "";

        return (
          <div key={field.name} className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {field.label}
            </Label>
            {field.type === "textarea" || field.type === "json" ? (
              <Textarea
                className="text-xs min-h-[100px] bg-background/50 border-white/10 font-mono"
                value={String(currentValue)}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
              />
            ) : field.type === "select" ? (
              <Select
                value={String(currentValue || "")}
                onValueChange={(nextValue) => handleChange(field.name, nextValue)}
              >
                <SelectTrigger className="text-xs bg-background/50 border-white/10">
                  <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options || []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === "boolean" ? (
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-background/40 p-3">
                <span className="text-xs text-muted-foreground">
                  {currentValue ? "Enabled" : "Disabled"}
                </span>
                <Switch
                  checked={Boolean(currentValue)}
                  onCheckedChange={(checked) => handleChange(field.name, checked)}
                />
              </div>
            ) : field.type === "number" ? (
              field.name.toLowerCase().includes("temperature") ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Value</span>
                    <span>{Number(currentValue || 0)}</span>
                  </div>
                  <Slider
                    max={2}
                    step={0.1}
                    value={[Number(currentValue || 0)]}
                    onValueChange={(values) =>
                      handleChange(field.name, Array.isArray(values) ? values[0] : values)
                    }
                  />
                </div>
              ) : (
                <Input
                  type="number"
                  className="text-xs bg-background/50 border-white/10"
                  value={Number(currentValue || 0)}
                  onChange={(e) => handleChange(field.name, Number(e.target.value))}
                  placeholder={field.placeholder}
                />
              )
            ) : (
              <Input
                type={field.type === "password" ? "password" : "text"}
                className="text-xs bg-background/50 border-white/10"
                value={String(currentValue)}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
              />
            )}
            {field.description ? (
              <p className="text-[10px] text-muted-foreground/70">{field.description}</p>
            ) : null}
          </div>
        );
      })}

      <div className="rounded-xl border border-white/10 bg-background/30 p-3 text-[11px] text-muted-foreground">
        Supports:
        {" "}
        {[
          definition.capabilities.design && "design",
          definition.capabilities.analyze && "analysis",
          definition.capabilities.simulate && "simulation",
          definition.capabilities.execute && "execution",
        ]
          .filter(Boolean)
          .join(" / ")}
      </div>
    </div>
  );
}
