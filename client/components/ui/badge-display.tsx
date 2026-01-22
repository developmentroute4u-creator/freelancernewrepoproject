import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"
import { Award, TrendingUp } from "lucide-react"

/**
 * BADGE DISPLAY COMPONENT - Premium Design System
 * 
 * For displaying freelancer skill badges
 * Premium visual with level indicator
 */

interface BadgeDisplayProps {
    level: "LOW" | "MEDIUM" | "HIGH" | null
    score?: number
    field?: string
    className?: string
}

const badgeLevelConfig = {
    HIGH: {
        label: "Expert",
        color: "from-primary-500 to-primary-700",
        textColor: "text-primary-700",
        bgColor: "bg-primary-50",
        borderColor: "border-primary-200",
    },
    MEDIUM: {
        label: "Intermediate",
        color: "from-accent-400 to-accent-600",
        textColor: "text-accent-700",
        bgColor: "bg-accent-50",
        borderColor: "border-accent-200",
    },
    LOW: {
        label: "Entry",
        color: "from-support-400 to-support-600",
        textColor: "text-support-700",
        bgColor: "bg-support-50",
        borderColor: "border-support-200",
    },
}

export function BadgeDisplay({ level, score, field, className }: BadgeDisplayProps) {
    if (!level) {
        return (
            <div
                className={cn(
                    "rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center",
                    className
                )}
            >
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                    <Award className="h-8 w-8 text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-neutral-600">No Badge Yet</p>
                <p className="mt-1 text-xs text-neutral-500">
                    Complete a skill test to earn your badge
                </p>
            </div>
        )
    }

    const config = badgeLevelConfig[level]

    return (
        <div
            className={cn(
                "rounded-lg border p-6",
                config.borderColor,
                config.bgColor,
                className
            )}
        >
            <div className="flex items-start gap-4">
                {/* Badge Icon */}
                <div
                    className={cn(
                        "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br shadow-sm",
                        config.color
                    )}
                >
                    <Award className="h-8 w-8 text-white" />
                </div>

                {/* Badge Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className={cn("text-lg font-semibold", config.textColor)}>
                            {config.label} Level
                        </h3>
                        <Badge variant="outline" className="text-xs">
                            {level}
                        </Badge>
                    </div>
                    {field && (
                        <p className="mt-1 text-sm text-neutral-600">{field}</p>
                    )}
                    {score !== undefined && (
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1">
                                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                                    <div
                                        className={cn(
                                            "h-full rounded-full bg-gradient-to-r transition-all",
                                            config.color
                                        )}
                                        style={{ width: `${score}%` }}
                                    />
                                </div>
                            </div>
                            <span className={cn("text-sm font-semibold", config.textColor)}>
                                {score}/100
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
