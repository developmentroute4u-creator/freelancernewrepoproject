import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * LOADING SKELETON COMPONENT - Premium Design System
 * 
 * Shimmer animation
 * Clean, minimal loading states
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "text" | "circular" | "rectangular"
}

export function Skeleton({ className, variant = "rectangular", ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-shimmer bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]",
                variant === "text" && "h-4 w-full rounded",
                variant === "circular" && "rounded-full",
                variant === "rectangular" && "rounded-md",
                className
            )}
            {...props}
        />
    )
}

// Preset skeleton layouts
export function SkeletonCard() {
    return (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
                <Skeleton variant="circular" className="h-12 w-12" />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="h-4 w-3/4" />
                    <Skeleton variant="text" className="h-4 w-1/2" />
                </div>
            </div>
            <div className="mt-4 space-y-2">
                <Skeleton variant="text" className="h-3 w-full" />
                <Skeleton variant="text" className="h-3 w-full" />
                <Skeleton variant="text" className="h-3 w-2/3" />
            </div>
        </div>
    )
}

export function SkeletonTable() {
    return (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton variant="circular" className="h-10 w-10" />
                    <div className="flex-1 space-y-2">
                        <Skeleton variant="text" className="h-3 w-1/4" />
                        <Skeleton variant="text" className="h-3 w-1/3" />
                    </div>
                    <Skeleton variant="rectangular" className="h-8 w-20" />
                </div>
            ))}
        </div>
    )
}
