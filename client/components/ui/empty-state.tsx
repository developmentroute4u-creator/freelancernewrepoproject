import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * EMPTY STATE COMPONENT - Premium Design System
 * 
 * Clean, minimal empty states
 * Clear call-to-action
 */

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description?: string
    action?: {
        label: string
        onClick: () => void
    }
    className?: string
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center",
                className
            )}
        >
            {icon && (
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
            {description && (
                <p className="mt-2 max-w-sm text-sm text-neutral-600">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-600 hover:scale-[1.01] active:translate-y-[2px]"
                >
                    {action.label}
                </button>
            )}
        </div>
    )
}
