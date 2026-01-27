import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

/**
 * SIDEBAR NAVIGATION - Premium Design System
 * 
 * Clean, minimal sidebar
 * Active state with accent color
 */

interface NavItem {
    label: string
    href: string
    icon: LucideIcon
    badge?: string | number
    disabled?: boolean
}

interface SidebarProps {
    logo?: React.ReactNode
    items: NavItem[]
    footer?: React.ReactNode
}

export function Sidebar({ logo, items, footer }: SidebarProps) {
    const pathname = usePathname()

    return (
        <aside className="flex h-screen w-64 flex-col border-r border-neutral-200 bg-white">
            {/* Logo */}
            {logo && (
                <div className="flex h-16 items-center border-b border-neutral-200 px-6">
                    {logo}
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                {items.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    const Icon = item.icon

                    if (item.disabled) {
                        return (
                            <div
                                key={item.href}
                                className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium opacity-50 cursor-not-allowed"
                            >
                                <Icon className="h-5 w-5 text-neutral-400" />
                                <span className="flex-1 text-neutral-500">{item.label}</span>
                                {item.badge && (
                                    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                        )
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                                isActive
                                    ? "bg-primary-50 text-primary-700"
                                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "h-5 w-5 transition-colors",
                                    isActive ? "text-primary-600" : "text-neutral-500 group-hover:text-neutral-700"
                                )}
                            />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                                <span
                                    className={cn(
                                        "rounded-full px-2 py-0.5 text-xs font-medium",
                                        isActive
                                            ? "bg-primary-100 text-primary-700"
                                            : "bg-neutral-100 text-neutral-600"
                                    )}
                                >
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            {footer && (
                <div className="border-t border-neutral-200 p-4">
                    {footer}
                </div>
            )}
        </aside>
    )
}
