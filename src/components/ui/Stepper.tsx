import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperProps {
  stages: string[];
  currentStage: number; // 0-indexed index of current active stage
}

export const Stepper: React.FC<StepperProps> = ({ stages, currentStage }) => {
  return (
    <div className="w-full">
      {/* Desktop Layout (Horizontal) */}
      <div className="hidden md:flex items-center justify-between w-full">
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentStage;
          const isCurrent = idx === currentStage;
          const isPending = idx > currentStage;

          return (
            <React.Fragment key={stage}>
              <div className="flex flex-col items-center group relative flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 z-10",
                    isCompleted && "bg-emerald-600 text-white shadow-md shadow-emerald-100",
                    isCurrent && "bg-emerald-600 text-white ring-4 ring-emerald-100 animate-pulse",
                    isPending && "bg-gray-100 text-gray-400 border border-gray-200"
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center capitalize max-w-[100px]",
                    isCompleted && "text-emerald-700 font-semibold",
                    isCurrent && "text-emerald-600 font-bold",
                    isPending && "text-gray-400"
                  )}
                >
                  {stage.replace(/_/g, " ")}
                </span>
              </div>

              {idx < stages.length - 1 && (
                <div
                  className={cn(
                    "h-1 flex-1 transition-colors duration-300 -mt-6 mx-2",
                    idx < currentStage ? "bg-emerald-600" : "bg-gray-200"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Layout (Vertical) */}
      <div className="flex md:hidden flex-col space-y-4 pl-4 border-l-2 border-gray-200 ml-4">
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentStage;
          const isCurrent = idx === currentStage;
          const isPending = idx > currentStage;

          return (
            <div key={stage} className="relative flex items-center space-x-3 -ml-[25px]">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs transition-all z-10",
                  isCompleted && "bg-emerald-600 text-white",
                  isCurrent && "bg-emerald-600 text-white ring-4 ring-emerald-100 animate-pulse",
                  isPending && "bg-gray-100 text-gray-400 border border-gray-200"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={cn(
                  "text-sm capitalize font-medium",
                  isCompleted && "text-emerald-700 font-semibold",
                  isCurrent && "text-emerald-600 font-bold",
                  isPending && "text-gray-400"
                )}
              >
                {stage.replace(/_/g, " ")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
