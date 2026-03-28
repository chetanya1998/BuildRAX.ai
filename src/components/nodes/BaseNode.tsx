import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import React from "react";
import { Trash2, ExternalLink, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  simulatedOutput?: any;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
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
  onEdit
}: BaseNodeProps) {
  return (
    <div
      className={cn(
        "min-w-64 max-w-sm rounded-xl border border-white/[0.08] bg-[#161618] backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] transition-all duration-300",
        selected ? "ring-2 ring-primary border-primary shadow-[0_0_30px_rgba(var(--primary),0.2)] scale-[1.02]" : "hover:border-white/20 hover:shadow-[0_10px_50px_rgba(0,0,0,0.9)] hover:-translate-y-0.5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border/40 bg-background/50 rounded-t-xl group/header">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border border-border/40 shadow-sm", colorClass)}>
          {icon}
        </div>
        <div className="flex-1 font-semibold text-sm tracking-tight">{title}</div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger className="h-7 w-7 rounded-lg hover:bg-white/10 flex items-center justify-center border-none bg-transparent cursor-pointer">
              <MoreVertical className="w-3.5 h-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#161618] border-white/10">
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
