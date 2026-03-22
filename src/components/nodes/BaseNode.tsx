import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import React from "react";

interface BaseNodeProps {
  title: string;
  icon: React.ReactNode;
  selected?: boolean;
  inputs?: { id: string; label?: string }[];
  outputs?: { id: string; label?: string }[];
  children?: React.ReactNode;
  colorClass?: string;
  className?: string;
  isSimulating?: boolean;
  simulatedOutput?: any;
}

export function BaseNode({
  title,
  icon,
  selected = false,
  inputs = [],
  outputs = [],
  children,
  colorClass = "bg-primary text-primary-foreground",
  className,
  isSimulating,
  simulatedOutput
}: BaseNodeProps) {
  return (
    <div
      className={cn(
        "min-w-64 max-w-sm rounded-xl border border-border/40 bg-card/95 backdrop-blur-md shadow-xl transition-all duration-200",
        selected ? "ring-2 ring-primary border-primary shadow-primary/20 scale-[1.02]" : "hover:border-primary/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border/40 bg-background/50 rounded-t-xl">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border border-border/40 shadow-sm", colorClass)}>
          {icon}
        </div>
        <div className="flex-1 font-semibold text-sm tracking-tight">{title}</div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {children && <div className="text-sm text-foreground">{children}</div>}
        
        {/* Simulation Result */}
        {(isSimulating || simulatedOutput) && (
          <div className={cn(
            "p-3 rounded-lg border text-[10px] font-mono transition-all duration-300",
            isSimulating ? "bg-primary/10 border-primary animate-pulse shadow-sm" : "bg-surface/50 border-border/40 text-muted-foreground"
          )}>
            <div className="flex items-center justify-between mb-1 opacity-60">
               <span className="uppercase tracking-tighter">Simulated Output</span>
               {isSimulating && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />}
            </div>
            <div className="line-clamp-3">{simulatedOutput || "Processing..."}</div>
          </div>
        )}
      </div>

      {/* Handles */}
      {inputs.map((input, idx) => (
        <Handle
          key={`in-${input.id}`}
          type="target"
          position={Position.Left}
          id={input.id}
          className="w-3 h-3 bg-card border-2 border-primary"
          style={{ top: `${(idx + 1) * (100 / (inputs.length + 1))}%` }}
        />
      ))}
      {outputs.map((output, idx) => (
        <Handle
          key={`out-${output.id}`}
          type="source"
          position={Position.Right}
          id={output.id}
          className="w-3 h-3 bg-card border-2 border-primary"
          style={{ top: `${(idx + 1) * (100 / (outputs.length + 1))}%` }}
        />
      ))}
    </div>
  );
}
