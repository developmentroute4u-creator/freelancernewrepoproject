import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * SELECT COMPONENT - Premium Design System
 * 
 * Custom select with clean styling
 * Matches design system aesthetic
 */

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    options: Array<{ value: string; label: string }>
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, ...props }, ref) => {
        if (label) {
            return (
                <div className="relative">
                    <label className="mb-2 block text-sm font-medium text-neutral-700">
                        {label}
                    </label>
                    <select
                        className={cn(
                            "flex h-12 w-full appearance-none rounded-md border border-neutral-200 bg-white px-4 py-2 text-base transition-all",
                            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            error && "border-error focus:border-error focus:ring-error/20",
                            className
                        )}
                        ref={ref}
                        {...props}
                    >
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-[42px] flex items-center">
                        <svg
                            className="h-5 w-5 text-neutral-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </div>
                    {error && (
                        <p className="mt-1 text-xs text-error">{error}</p>
                    )}
                </div>
            )
        }

        return (
            <div className="relative">
                <select
                    className={cn(
                        "flex h-12 w-full appearance-none rounded-md border border-neutral-200 bg-white px-4 py-2 text-base transition-all",
                        "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-error focus:border-error focus:ring-error/20",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center">
                    <svg
                        className="h-5 w-5 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
            </div>
        )
    }
)
Select.displayName = "Select"

export { Select }
