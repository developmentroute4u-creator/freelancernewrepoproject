import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

/**
 * STAT CARD COMPONENT - Premium Design System
 * 
 * For displaying metrics and statistics
 * Clean, minimal, with optional icon
 */

interface StatCardProps {
    title: string
    value: string | number
    description?: string
    icon?: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
}

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    className,
}: StatCardProps) {
    return (
        <div
            className={cn(
                "rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-600">{title}</p>
                    <p className="mt-2 text-3xl font-semibold text-neutral-900">{value}</p>
                    {description && (
                        <p className="mt-1 text-sm text-neutral-500">{description}</p>
                    )}
                    {trend && (
                        <div className="mt-2 flex items-center gap-1">
                            <span
                                className={cn(
                                    "text-sm font-medium",
                                    trend.isPositive ? "text-support-600" : "text-error-600"
                                )}
                            >
                                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-neutral-500">vs last month</span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className="rounded-lg bg-primary-50 p-3">
                        <Icon className="h-6 w-6 text-primary-600" />
                    </div>
                )}
            </div>
        </div>
    )
}
