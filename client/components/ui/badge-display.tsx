import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"
import { Button } from "./button"
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
    status?: string  // Add status prop to show review status
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

export function BadgeDisplay({ level, score, field, status, className }: BadgeDisplayProps) {
    // If we have a badge level, show it (even if status is REJECTED - this means they had a lower badge)
    if (level) {
        const config = badgeLevelConfig[level]

        // If status is REJECTED but we have a badge, show the badge with a note about retest
        const isRejectedWithBadge = status === 'REJECTED' && level

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

                        {isRejectedWithBadge && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-800 mb-2">
                                    Your recent test was rejected. You can retake the test to try for a higher badge.
                                </p>
                                <Button
                                    onClick={() => window.location.href = '/freelancer/test'}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    size="sm"
                                >
                                    Retake Test
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // No badge level - show status messages
    if (!level) {
        // Show "Under Review" status if test is being reviewed
        if (status === 'UNDER_REVIEW') {
            return (
                <div
                    className={cn(
                        "rounded-lg border-2 border-yellow-400 bg-yellow-50 p-6",
                        className
                    )}
                >
                    <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-yellow-400">
                            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-lg font-semibold text-yellow-900">Under Review</p>
                                <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 text-xs">PENDING</Badge>
                            </div>
                            <p className="text-sm text-yellow-800">
                                Your test submission is being reviewed by our admin team
                            </p>
                            <p className="mt-2 text-xs text-yellow-700">
                                ⏱️ Review typically takes 1-2 business days
                            </p>
                        </div>
                    </div>
                </div>
            )
        }

        // Show "Rejected" status if test was rejected
        if (status === 'REJECTED') {
            return (
                <div
                    className={cn(
                        "rounded-lg border-2 border-red-400 bg-red-50 p-6",
                        className
                    )}
                >
                    <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-red-400">
                            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-lg font-semibold text-red-900">Test Rejected</p>
                                <Badge className="bg-red-500 text-white hover:bg-red-600 text-xs">REJECTED</Badge>
                            </div>
                            <p className="text-sm text-red-800 mb-3">
                                Your test submission did not meet the requirements. You can retake the test to try again.
                            </p>
                            <Button
                                onClick={() => window.location.href = '/freelancer/test'}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                size="sm"
                            >
                                Retake Skill Test
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }

        // Default state - Show "UNDER REVIEW" with CTA to test page
        return (
            <div
                className={cn(
                    "rounded-lg border-2 border-yellow-400 bg-yellow-50 p-6",
                    className
                )}
            >
                <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-yellow-400">
                        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-lg font-semibold text-yellow-900">UNDER REVIEW</p>
                            <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 text-xs">PENDING</Badge>
                        </div>
                        <p className="text-sm text-yellow-800 mb-3">
                            Complete your skill test to get started
                        </p>
                        <Button
                            onClick={() => window.location.href = '/freelancer/test'}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            size="sm"
                        >
                            Take Skill Test
                        </Button>
                    </div>
                </div>
            </div>
        )
    }
}
