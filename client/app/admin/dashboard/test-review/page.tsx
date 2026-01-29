'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, FileText, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { Sidebar } from '@/components/ui/sidebar'
import { TopBar } from '@/components/ui/topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/skeleton'

export default function TestReviewPage() {
    const router = useRouter()
    const [submissions, setSubmissions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSubmissions()
    }, [])

    const loadSubmissions = async () => {
        try {
            const { data } = await api.get('/admin/test-submissions?status=SUBMITTED')
            setSubmissions(data)
        } catch (error) {
            console.error('Error loading submissions:', error)
        } finally {
            setLoading(false)
        }
    }

    const navItems = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: Shield },
        { label: 'Test Review', href: '/admin/dashboard/test-review', icon: FileText },
    ]

    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar
                    logo={<div className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /><span className="text-xl font-bold text-primary">Admin</span></div>}
                    items={navItems}
                />
                <div className="flex-1">
                    <TopBar title="Test Review" />
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
                    title="Test Review"
                    subtitle={`${submissions.length} pending submissions`}
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

                        {submissions.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <FileText className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Pending Submissions</h3>
                                    <p className="text-neutral-600">All test submissions have been reviewed</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {submissions.map((submission: any) => (
                                    <Card key={submission._id} hover>
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-neutral-900">
                                                            {submission.freelancerId?.userId?.email || 'Unknown Freelancer'}
                                                        </h3>
                                                        <Badge variant="warning">Pending Review</Badge>
                                                    </div>
                                                    <div className="space-y-1 text-sm text-neutral-600">
                                                        <p><strong>Field:</strong> {submission.testId?.field || 'N/A'}</p>
                                                        <p><strong>Level:</strong> {submission.testId?.testLevel || 'N/A'}</p>
                                                        <p><strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleDateString()}</p>
                                                        {submission.submissionUrl && (
                                                            <p>
                                                                <strong>Submission:</strong>{' '}
                                                                <a
                                                                    href={submission.submissionUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary-600 hover:underline"
                                                                >
                                                                    View Submission
                                                                </a>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => router.push(`/admin/dashboard/test-review/${submission._id}`)}
                                                >
                                                    Review
                                                </Button>
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
