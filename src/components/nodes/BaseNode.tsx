import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import React from "react";
import { Trash2, ExternalLink, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BaseNodeProps {
  id?: string;
  title: string;
  icon: React.ReactNode;
  selected?: boolean;
  inputs?: { id: string; label?: string }[];
  outputs?: { id: string; label?: string }[];
  children?: React.ReactNode;
  colorClass?: string;
  className?: string;
  isSimulating?: boolean;
  simulatedOutput?: unknown;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  customHeaderStyle?: React.CSSProperties;
}

export function BaseNode({
  id,
  title,
  icon,
  selected = false,
  inputs = [],
  outputs = [],
  children,
  colorClass = "bg-primary text-primary-foreground",
  className,
  isSimulating,
  simulatedOutput,
  onDelete,
  onEdit,
  customHeaderStyle
}: BaseNodeProps) {
  const hasSimulatedOutput =
    simulatedOutput !== undefined && simulatedOutput !== null && simulatedOutput !== "";

  return (
    <div
      className={cn(
        "min-w-[278px] max-w-sm overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,20,30,0.96)_0%,rgba(9,12,19,0.92)_100%)] shadow-[0_22px_60px_rgba(0,0,0,0.36)] backdrop-blur-2xl transition-all duration-300",
        selected
          ? "border-sky-400/30 shadow-[0_0_0_1px_rgba(56,189,248,0.18),0_26px_70px_rgba(2,132,199,0.2)] -translate-y-0.5"
          : "hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_26px_70px_rgba(0,0,0,0.42)]",
        className
      )}
    >
      <div className="h-[3px] w-full bg-gradient-to-r from-sky-400/80 via-cyan-300/55 to-transparent" />

      <div className="group/header flex items-center gap-3 border-b border-white/[0.06] bg-black/15 px-3.5 py-3" style={customHeaderStyle}>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-2xl border shadow-sm", colorClass)}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold tracking-tight text-white">{title}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {inputs.length} in / {outputs.length} out
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent hover:bg-white/10">
              <MoreVertical className="w-3.5 h-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-white/10 bg-[#161618]">
              <DropdownMenuItem onClick={() => id && onEdit?.(id)} className="text-xs flex items-center gap-2 cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5" /> Configure Node
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => id && onDelete?.(id)} className="text-xs flex items-center gap-2 text-red-400 focus:text-red-400 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Delete Node
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {children && <div className="text-sm text-foreground">{children}</div>}
        
        {(isSimulating || hasSimulatedOutput) && (
          <div className={cn(
            "rounded-2xl border p-3 text-[10px] font-mono transition-all duration-300",
            isSimulating
              ? "animate-pulse border-sky-400/30 bg-sky-500/10 shadow-sm"
              : "border-white/10 bg-black/20 text-muted-foreground"
          )}>
            <div className="mb-1 flex items-center justify-between opacity-60">
               <span className="uppercase tracking-[0.2em]">Simulated Output</span>
               {isSimulating && <div className="h-1.5 w-1.5 animate-ping rounded-full bg-sky-300" />}
            </div>
            <div className="line-clamp-3">
              {typeof simulatedOutput === "string"
                ? simulatedOutput
                : hasSimulatedOutput
                  ? JSON.stringify(simulatedOutput)
                  : "Processing..."}
            </div>
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
          className="h-3 w-3 border-2 border-sky-300 bg-slate-950"
          style={{ top: `${(idx + 1) * (100 / (inputs.length + 1))}%` }}
        />
      ))}
      {outputs.map((output, idx) => (
        <Handle
          key={`out-${output.id}`}
          type="source"
          position={Position.Right}
          id={output.id}
          className="h-3 w-3 border-2 border-sky-300 bg-slate-950"
          style={{ top: `${(idx + 1) * (100 / (outputs.length + 1))}%` }}
        />
      ))}
    </div>
  );
}
