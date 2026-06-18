import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger" | "success";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fast-red focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-fast-red text-white hover:bg-fast-red-hover shadow-lg hover:shadow-fast-red/50": variant === "default",
            "border border-fast-surface bg-transparent hover:bg-fast-surface text-fast-text": variant === "outline",
            "hover:bg-fast-surface text-fast-text": variant === "ghost",
            "bg-fast-warning text-white hover:bg-fast-warning/80": variant === "danger",
            "bg-fast-success text-white hover:bg-fast-success/80": variant === "success",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-12 rounded-md px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
