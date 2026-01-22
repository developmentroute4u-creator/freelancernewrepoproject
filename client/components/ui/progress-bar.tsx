import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * PROGRESS BAR COMPONENT - Premium Design System
 * 
 * Clean progress indicator
 * Smooth animations
 */

interface ProgressBarProps {
    value: number
    max?: number
    label?: string
    showPercentage?: boolean
    variant?: "primary" | "accent" | "success" | "warning" | "error"
    size?: "sm" | "md" | "lg"
    className?: string
}

const variantStyles = {
    primary: "bg-primary-500",
    accent: "bg-accent-500",
    success: "bg-support-500",
    warning: "bg-warning-500",
    error: "bg-error-500",
}

const sizeStyles = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
}

export function ProgressBar({
    value,
    max = 100,
    label,
    showPercentage = false,
    variant = "primary",
    size = "md",
    className,
}: ProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
        <div className={cn("w-full", className)}>
            {(label || showPercentage) && (
                <div className="mb-2 flex items-center justify-between">
                    {label && <span className="text-sm font-medium text-neutral-700">{label}</span>}
                    {showPercentage && (
                        <span className="text-sm font-semibold text-neutral-900">
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}
            <div className={cn("w-full overflow-hidden rounded-full bg-neutral-200", sizeStyles[size])}>
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        variantStyles[variant]
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}
