'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Users, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { Sidebar } from '@/components/ui/sidebar'
import { TopBar } from '@/components/ui/topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/skeleton'

export default function FreelancersPage() {
    const router = useRouter()
    const [freelancers, setFreelancers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadFreelancers()
    }, [])

    const loadFreelancers = async () => {
        try {
            const { data } = await api.get('/admin/freelancers')
            setFreelancers(data)
        } catch (error) {
            console.error('Error loading freelancers:', error)
        } finally {
            setLoading(false)
        }
    }

    const navItems = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: Shield },
        { label: 'Freelancers', href: '/admin/dashboard/freelancers', icon: Users },
    ]

    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar
                    logo={<div className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /><span className="text-xl font-bold text-primary">Admin</span></div>}
                    items={navItems}
                />
                <div className="flex-1">
                    <TopBar title="Freelancers" />
                    <main className="container-custom py-8">
                        <div className="grid gap-4">
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
            <Sidebar
                logo={<div className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /><span className="text-xl font-bold text-primary">Admin</span></div>}
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

            <div className="flex flex-1 flex-col overflow-hidden">
                <TopBar
                    title="Freelancers"
                    subtitle={`${freelancers.length} total freelancers`}
                    user={{ name: 'Admin' }}
                />

                <main className="flex-1 overflow-y-auto">
                    <div className="container-custom py-8 space-y-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/admin/dashboard')}
                            className="mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>

                        {freelancers.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Users className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Freelancers</h3>
                                    <p className="text-neutral-600">No freelancers have registered yet</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {freelancers.map((freelancer: any) => (
                                    <Card key={freelancer._id} hover>
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-neutral-900">
                                                            {freelancer.userId?.email || 'Unknown'}
                                                        </h3>
                                                        <Badge variant={
                                                            freelancer.status === 'APPROVED' ? 'success' :
                                                                freelancer.status === 'REJECTED' ? 'error' :
                                                                    'warning'
                                                        }>
                                                            {freelancer.status}
                                                        </Badge>
                                                        {freelancer.badgeLevel && (
                                                            <Badge variant="outline">
                                                                {freelancer.badgeLevel} Badge
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1 text-sm text-neutral-600">
                                                        <p><strong>Field:</strong> {freelancer.education?.field || 'N/A'}</p>
                                                        <p><strong>Degree:</strong> {freelancer.education?.degree || 'N/A'}</p>
                                                        <p><strong>University:</strong> {freelancer.education?.universityName || 'N/A'}</p>
                                                        {freelancer.hourlyRate && (
                                                            <p><strong>Hourly Rate:</strong> ${freelancer.hourlyRate}/hr</p>
                                                        )}
                                                        {freelancer.badgeScore && (
                                                            <p><strong>Badge Score:</strong> {freelancer.badgeScore}/100</p>
                                                        )}
                                                        <p><strong>Joined:</strong> {new Date(freelancer.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
