import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react"

/**
 * ALERT COMPONENT - Premium Design System
 * 
 * Style:
 * - Inline banners
 * - Soft backgrounds
 * - Clear iconography
 * - Optional dismiss
 */

const alertVariants = cva(
    "relative w-full rounded-md border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:pl-8",
    {
        variants: {
            variant: {
                success: "bg-support-50 border-support-200 text-support-800 [&>svg]:text-support-600",
                warning: "bg-warning-50 border-warning-200 text-warning-800 [&>svg]:text-warning-600",
                error: "bg-error-50 border-error-200 text-error-800 [&>svg]:text-error-600",
                info: "bg-accent-50 border-accent-200 text-accent-800 [&>svg]:text-accent-600",
            },
        },
        defaultVariants: {
            variant: "info",
        },
    }
)

const Alert = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> & {
        onDismiss?: () => void
    }
>(({ className, variant, onDismiss, children, ...props }, ref) => {
    const Icon = variant === 'success' ? CheckCircle2
        : variant === 'warning' ? AlertTriangle
            : variant === 'error' ? AlertCircle
                : Info

    return (
        <div
            ref={ref}
            role="alert"
            className={cn(alertVariants({ variant }), className)}
            {...props}
        >
            <Icon className="h-5 w-5" />
            <div className="flex-1">{children}</div>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
            )}
        </div>
    )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h5
        ref={ref}
        className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
        {...props}
    />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm [&_p]:leading-relaxed", className)}
        {...props}
    />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
