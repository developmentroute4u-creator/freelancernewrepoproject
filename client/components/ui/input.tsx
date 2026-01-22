import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * INPUT COMPONENT - Premium Design System
 * 
 * Style:
 * - Floating labels
 * - Clean borders
 * - Focus: accent glow
 * - 48px height for touch-friendly
 */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)

    const handleFocus = () => setIsFocused(true)
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setHasValue(!!e.target.value)
    }

    if (label) {
      return (
        <div className="relative">
          <input
            type={type}
            className={cn(
              "peer h-12 w-full rounded-md border border-neutral-200 bg-white px-4 pt-4 pb-1 text-base transition-all",
              "placeholder-transparent",
              "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
              error && "border-error focus:border-error focus:ring-error/20",
              className
            )}
            ref={ref}
            placeholder={label}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          <label
            className={cn(
              "absolute left-4 top-3 text-neutral-500 transition-all pointer-events-none",
              "peer-placeholder-shown:top-3 peer-placeholder-shown:text-base",
              "peer-focus:top-1 peer-focus:text-xs peer-focus:text-accent",
              (isFocused || hasValue || props.value) && "top-1 text-xs",
              error && "peer-focus:text-error"
            )}
          >
            {label}
          </label>
          {error && (
            <p className="mt-1 text-xs text-error">{error}</p>
          )}
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border border-neutral-200 bg-white px-4 py-2 text-base transition-all",
          "placeholder:text-neutral-400",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-error focus:border-error focus:ring-error/20",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
