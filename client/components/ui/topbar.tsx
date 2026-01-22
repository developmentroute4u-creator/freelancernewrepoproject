import * as React from "react"
import { Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"

/**
 * TOP BAR - Premium Design System
 * 
 * Clean header with notifications and user menu
 */

interface TopBarProps {
    title?: string
    subtitle?: string
    actions?: React.ReactNode
    notificationCount?: number
    user?: {
        name: string
        email?: string
        avatar?: string
    }
    className?: string
}

export function TopBar({
    title,
    subtitle,
    actions,
    notificationCount = 0,
    user,
    className,
}: TopBarProps) {
    return (
        <header
            className={cn(
                "sticky top-0 z-50 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6",
                className
            )}
        >
            {/* Title Section */}
            <div className="flex-1">
                {title && (
                    <div>
                        <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
                        {subtitle && (
                            <p className="text-sm text-neutral-600">{subtitle}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}

            {/* Right Section */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative rounded-md p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900">
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-medium text-white">
                            {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                    )}
                </button>

                {/* User Menu */}
                {user && (
                    <button className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-neutral-100">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-8 w-8 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                                <User className="h-4 w-4 text-primary-600" />
                            </div>
                        )}
                        <div className="text-left">
                            <p className="text-sm font-medium text-neutral-900">{user.name}</p>
                            {user.email && (
                                <p className="text-xs text-neutral-500">{user.email}</p>
                            )}
                        </div>
                    </button>
                )}
            </div>
        </header>
    )
}
