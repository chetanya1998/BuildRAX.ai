import React, { useMemo } from "react";
import { BaseNode } from "./BaseNode";
import { INTEGRATION_REGISTRY } from "@/lib/integrations";
import { Blocks } from "lucide-react";

export const IntegrationNode = ({ id, data, selected }: any) => {
  const integration = useMemo(() => {
    if (!data.appId) return null;
    return INTEGRATION_REGISTRY[data.appId];
  }, [data.appId]);

  const action = useMemo(() => {
    if (!integration || !data.actionId) return null;
    return integration.actions.find((a) => a.id === data.actionId);
  }, [integration, data.actionId]);

  const Icon = integration?.icon || Blocks;
  
  // Default inputs/outputs if no action is selected
  const inputs = action?.inputs.map(i => ({ id: i.name, label: i.label })) || [{ id: "trigger" }];
  const outputs = action?.outputs.map(o => ({ id: o.name, label: o.label })) || [{ id: "success" }];

  return (
    <BaseNode
      id={id}
      title={integration ? `${integration.name} - ${action?.name || 'Setup Required'}` : "Unconfigured Integration"}
      icon={<Icon className="w-4 h-4" />}
      colorClass="" // We will override via custom style below
      selected={selected}
      inputs={inputs}
      outputs={outputs}
      isSimulating={data.isSimulating}
      simulatedOutput={data.simulatedOutput}
      onDelete={data.onDelete}
      onEdit={data.onEdit}
      customHeaderStyle={integration ? { backgroundColor: `${integration.color}20`, color: integration.color, borderColor: `${integration.color}40` } : undefined}
    >
      <div className="text-[10px] opacity-60">
        {!integration ? "Select an App" : !action ? "Select an Action" : action.description}
      </div>
    </BaseNode>
  );
};
