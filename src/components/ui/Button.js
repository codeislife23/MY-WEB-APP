import React from "react";
import { cn } from "../../lib/utils";

const buttonVariants = {
  variant: {
    default: 
      "relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-800 text-white border border-zinc-700 shadow-sm hover:bg-zinc-700",
    destructive: 
      "relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-red-500 text-white hover:bg-red-600",
    outline: 
      "relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500 text-red-500 bg-transparent hover:bg-red-500/10",
    ghost: 
      "relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-red-500 hover:bg-red-500/10 hover:text-red-600",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 py-1.5 text-xs",
    lg: "h-12 px-6 py-3 text-base",
    icon: "h-10 w-10 p-2",
  }
};

export function Button({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}) {
  return (
    <button
      className={cn(
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-1">
        {children}
      </span>
    </button>
  );
} 