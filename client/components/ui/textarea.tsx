import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * TEXTAREA COMPONENT - Premium Design System
 * 
 * Floating label variant
 * Clean, minimal style
 */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)

    const handleFocus = () => setIsFocused(true)
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      setHasValue(!!e.target.value)
    }

    if (label) {
      return (
        <div className="relative">
          <textarea
            className={cn(
              "peer min-h-[120px] w-full rounded-md border border-neutral-200 bg-white px-4 pt-6 pb-2 text-base transition-all resize-y",
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
              "absolute left-4 top-4 text-neutral-500 transition-all pointer-events-none",
              "peer-placeholder-shown:top-4 peer-placeholder-shown:text-base",
              "peer-focus:top-2 peer-focus:text-xs peer-focus:text-accent",
              (isFocused || hasValue || props.value) && "top-2 text-xs",
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
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-md border border-neutral-200 bg-white px-4 py-3 text-base transition-all resize-y",
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
Textarea.displayName = "Textarea"

export { Textarea }
