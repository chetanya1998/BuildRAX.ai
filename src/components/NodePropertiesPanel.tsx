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
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03]">
          <Settings className="h-5 w-5 opacity-50" />
        </div>
        <p className="text-xs font-medium text-white">Select a node to inspect</p>
        <p className="mt-1 max-w-[180px] text-[11px] leading-relaxed text-muted-foreground">
          Click any node to configure its properties.
        </p>
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
          <h3 className="text-sm font-semibold text-white">{String(data?.label || type)}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            This is a legacy or unsupported node type. Raw data is still editable.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Raw Data
          </Label>
          <Textarea
            className="min-h-[220px] rounded-3xl border-white/10 bg-black/20 font-mono text-xs"
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
    <div className="space-y-3">
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Selected node</p>
        <h3 className="mt-1 text-sm font-semibold text-white">{definition.title}</h3>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{definition.description}</p>
      </div>

      {definition.fields.map((field) => {
        const value = data?.[field.name];
        const currentValue = value ?? field.defaultValue ?? "";

        return (
          <div key={field.name} className="space-y-1">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {field.label}
            </Label>
            {field.type === "textarea" || field.type === "json" ? (
              <Textarea
                className="min-h-[90px] rounded-2xl border-white/10 bg-black/20 font-mono text-xs"
                value={String(currentValue)}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
              />
            ) : field.type === "select" ? (
              <Select
                value={String(currentValue || "")}
                onValueChange={(nextValue) => handleChange(field.name, nextValue)}
              >
                <SelectTrigger className="h-8 rounded-xl border-white/10 bg-black/20 text-xs">
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
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-2.5">
                <span className="text-[11px] text-muted-foreground">
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
                  className="h-8 rounded-xl border-white/10 bg-black/20 text-xs"
                  value={Number(currentValue || 0)}
                  onChange={(e) => handleChange(field.name, Number(e.target.value))}
                  placeholder={field.placeholder}
                />
              )
            ) : (
              <Input
                type={field.type === "password" ? "password" : "text"}
                className="h-8 rounded-xl border-white/10 bg-black/20 text-xs"
                value={String(currentValue)}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
              />
            )}
            {field.description ? (
              <p className="text-[10px] leading-relaxed text-muted-foreground/70">{field.description}</p>
            ) : null}
          </div>
        );
      })}

      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5 text-[10px] text-muted-foreground">
        Supports:
        {" "}
        {[
          definition.capabilities.design && "design",
          definition.capabilities.analyze && "analysis",
          definition.capabilities.simulate && "test",
          definition.capabilities.execute && "execution",
        ]
          .filter(Boolean)
          .join(" / ")}
      </div>
    </div>
  );
}
