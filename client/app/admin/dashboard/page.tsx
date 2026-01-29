/**
 * ADMIN DASHBOARD - Premium Design System Redesign
 * 
 * Clean data-focused interface
 * Professional admin panel aesthetic
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    FileText,
    DollarSign,
    Settings,
    Shield,
    TrendingUp,
    AlertCircle,
    CheckCircle2
} from 'lucide-react'
import api from '@/lib/api'
import { Sidebar } from '@/components/ui/sidebar'
import { TopBar } from '@/components/ui/topbar'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/skeleton'

export default function AdminDashboard() {
    const router = useRouter()
    const [stats, setStats] = useState<any>(null)
    const [pendingTests, setPendingTests] = useState<any[]>([])
    const [recentFreelancers, setRecentFreelancers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [statsRes, testsRes, freelancersRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/test-submissions?status=SUBMITTED'),
                api.get('/admin/freelancers?limit=5'),
            ])

            setStats(statsRes.data)
            setPendingTests(testsRes.data)
            setRecentFreelancers(freelancersRes.data)
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const navItems = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Freelancers', href: '/admin/dashboard/freelancers', icon: Users },
        { label: 'Test Review', href: '/admin/dashboard/test-review', icon: FileText, badge: pendingTests.length },
        { label: 'Pricing', href: '/admin/pricing', icon: DollarSign },
        { label: 'Settings', href: '/admin/settings', icon: Settings },
    ]

    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar
                    logo={<div className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /><span className="text-xl font-bold text-primary">Admin</span></div>}
                    items={navItems}
                />
                <div className="flex-1">
                    <TopBar title="Admin Dashboard" />
                    <main className="container-custom py-8">
                        <div className="grid grid-cols-4 gap-6">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <Sidebar
                logo={
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="text-xl font-bold text-primary">Admin</span>
                    </div>
                }
                items={navItems}
                footer={
                    <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                            localStorage.removeItem('token')
                            router.push('/')
                        }}
                    >
                        Logout
                    </Button>
                }
            />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <TopBar
                    title="Admin Dashboard"
                    subtitle="Platform Overview"
                    user={{
                        name: 'Admin',
                    }}
                />

                <main className="flex-1 overflow-y-auto">
                    <div className="container-custom py-8 space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                            <StatCard
                                title="Total Freelancers"
                                value={stats?.totalFreelancers || 0}
                                description={`${stats?.approvedFreelancers || 0} approved`}
                                icon={Users}
                            />
                            <StatCard
                                title="Pending Tests"
                                value={pendingTests.length}
                                description="Awaiting review"
                                icon={FileText}
                            />
                            <StatCard
                                title="Active Projects"
                                value={stats?.activeProjects || 0}
                                description="In progress"
                                icon={TrendingUp}
                            />
                            <StatCard
                                title="Total Revenue"
                                value="$0"
                                description="This month"
                                icon={DollarSign}
                            />
                        </div>

                        {/* Pending Test Reviews */}
                        {pendingTests.length > 0 && (
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-semibold text-neutral-900">Pending Test Reviews</h2>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push('/admin/dashboard/test-review')}
                                    >
                                        View All
                                    </Button>
                                </div>

                                <div className="grid gap-4">
                                    {pendingTests.slice(0, 3).map((test: any) => (
                                        <Card key={test._id} hover>
                                            <CardContent className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-50">
                                                        <AlertCircle className="h-5 w-5 text-warning-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-neutral-900">
                                                            {test.freelancerId?.fullName || 'Unknown'}
                                                        </p>
                                                        <p className="text-sm text-neutral-600">
                                                            {test.testId?.field || 'Unknown Field'} • {test.testId?.testLevel || 'N/A'} Level
                                                        </p>
                                                        <p className="text-xs text-neutral-500">
                                                            Submitted {new Date(test.submittedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/admin/dashboard/test-review/${test._id}`)}
                                                >
                                                    Review
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Freelancers */}
                        {recentFreelancers.length > 0 && (
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-semibold text-neutral-900">Recent Freelancers</h2>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push('/admin/dashboard/freelancers')}
                                    >
                                        View All
                                    </Button>
                                </div>

                                <div className="grid gap-4">
                                    {recentFreelancers.map((freelancer: any) => (
                                        <Card key={freelancer._id}>
                                            <CardContent className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                                                        <Users className="h-5 w-5 text-primary-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-neutral-900">
                                                            {freelancer.fullName || 'Unknown'}
                                                        </p>
                                                        <p className="text-sm text-neutral-600">
                                                            {freelancer.education?.field || 'No field'} • {freelancer.education?.degree || 'No degree'}
                                                        </p>
                                                        <p className="text-xs text-neutral-500">
                                                            {freelancer.education?.universityName || 'No university'}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                                                            {freelancer.userId?.email && (
                                                                <span>📧 {freelancer.userId.email}</span>
                                                            )}
                                                            {freelancer.location && (
                                                                <span>📍 {freelancer.location}</span>
                                                            )}
                                                            {freelancer.yearsOfExperience && (
                                                                <span>💼 {freelancer.yearsOfExperience} yrs exp</span>
                                                            )}
                                                            {freelancer.hourlyRate && (
                                                                <span>💰 ₹{freelancer.hourlyRate}/hr</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {freelancer.badgeLevel && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {freelancer.badgeLevel} Badge
                                                        </Badge>
                                                    )}
                                                    <Badge variant={
                                                        freelancer.status === 'APPROVED' ? 'success' :
                                                            freelancer.status === 'REJECTED' ? 'error' :
                                                                'warning'
                                                    }>
                                                        {freelancer.status}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
