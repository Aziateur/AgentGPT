"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressBarVariants = cva("h-full rounded-full transition-all duration-500 ease-out", {
  variants: {
    color: {
      default: "bg-indigo-600",
      green: "bg-green-500",
      blue: "bg-blue-500",
      red: "bg-red-500",
      orange: "bg-orange-500",
      yellow: "bg-yellow-500",
      purple: "bg-purple-500",
    },
  },
  defaultVariants: {
    color: "default",
  },
});

const progressSizeVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-gray-100",
  {
    variants: {
      size: {
        sm: "h-1.5",
        md: "h-2.5",
        lg: "h-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface ProgressBarProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, "color">,
    VariantProps<typeof progressBarVariants>,
    VariantProps<typeof progressSizeVariants> {
  value?: number;
  showLabel?: boolean;
}

const ProgressBar = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressBarProps
>(({ className, value = 0, color, size, showLabel, ...props }, ref) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="flex items-center gap-3">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(progressSizeVariants({ size, className }))}
        value={clampedValue}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(progressBarVariants({ color }))}
          style={{ width: `${clampedValue}%` }}
        />
      </ProgressPrimitive.Root>
      {showLabel && (
        <span className="text-xs font-medium text-gray-600 tabular-nums">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
});
ProgressBar.displayName = "ProgressBar";

export { ProgressBar, progressBarVariants };
