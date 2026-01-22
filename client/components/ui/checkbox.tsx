import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * CHECKBOX COMPONENT - Premium Design System
 * 
 * Custom checkbox with accent color
 */

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    if (label) {
      return (
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              className={cn(
                "peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-neutral-300 bg-white transition-all",
                "checked:border-accent checked:bg-accent",
                "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
              )}
              ref={ref}
              {...props}
            />
            <svg
              className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
            {label}
          </span>
        </label>
      )
    }

    return (
      <div className="relative">
        <input
          type="checkbox"
          className={cn(
            "peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-neutral-300 bg-white transition-all",
            "checked:border-accent checked:bg-accent",
            "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        <svg
          className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
