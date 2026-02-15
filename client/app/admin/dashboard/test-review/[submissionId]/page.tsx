'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Shield, ArrowLeft, CheckCircle2, XCircle, User, Mail, MapPin, Briefcase, GraduationCap, Award } from 'lucide-react'
import api from '@/lib/api'
import { Sidebar } from '@/components/ui/sidebar'
import { TopBar } from '@/components/ui/topbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SkeletonCard } from '@/components/ui/skeleton'

export default function TestReviewDetailPage() {
    const router = useRouter()
    const params = useParams()
    const submissionId = params.submissionId as string

    const [submission, setSubmission] = useState<any>(null)
    const [freelancer, setFreelancer] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)

    // Form state for approval
    const [badgeLevel, setBadgeLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW')
    const [score, setScore] = useState(70)
    const [feedback, setFeedback] = useState('')
    const [strengths, setStrengths] = useState('')
    const [improvementAreas, setImprovementAreas] = useState('')
    const [hourlyRate, setHourlyRate] = useState('')

    // Form state for rejection
    const [rejectionFeedback, setRejectionFeedback] = useState('')

    useEffect(() => {
        loadData()
    }, [submissionId])

    const loadData = async () => {
        try {
            const [submissionsRes, freelancerRes] = await Promise.all([
                api.get(`/admin/test-submissions`),
                api.get(`/admin/test-submissions`).then(async (res) => {
                    const found = res.data.find((s: any) => s._id === submissionId)
                    if (found?.freelancerId?._id) {
                        return api.get(`/admin/freelancers/${found.freelancerId._id}`)
                    }
                    return null
                })
            ])

            const found = submissionsRes.data.find((s: any) => s._id === submissionId)
            setSubmission(found)
            if (freelancerRes) {
                setFreelancer(freelancerRes.data)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        // Validation
        if (!feedback.trim()) {
            alert('❌ Error: Please provide overall feedback before approving.')
            return
        }

        if (feedback.trim().length < 20) {
            alert('❌ Error: Feedback must be at least 20 characters long.')
            return
        }

        if (score < 0 || score > 100) {
            alert('❌ Error: Score must be between 0 and 100.')
            return
        }

        if (score < 50) {
            const confirmLowScore = confirm(`⚠️ Warning: The score is ${score}/100 which is below 50. Are you sure you want to approve this submission with a low score?`)
            if (!confirmLowScore) return
        }

        // Confirmation
        const confirmApproval = confirm(
            `✅ Confirm Approval\n\n` +
            `Freelancer: ${submission.freelancerId?.fullName || 'Unknown'}\n` +
            `Badge Level: ${submission.testId?.testLevel}\n` +
            `Score: ${score}/100\n\n` +
            `This will award the badge and approve the freelancer. Continue?`
        )
        if (!confirmApproval) return

        setProcessing(true)
        try {
            const strengthsArray = strengths.split('\n').filter(s => s.trim())
            const improvementAreasArray = improvementAreas.split('\n').filter(s => s.trim())

            await api.post(`/admin/test-submissions/${submissionId}/review`, {
                badgeLevel: submission.testId?.testLevel, // Use the level from the test the freelancer took
                score,
                feedback,
                strengths: strengthsArray,
                improvementAreas: improvementAreasArray,
                hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
            })

            alert(
                `✅ Success!\n\n` +
                `Test approved and ${submission.testId?.testLevel} badge awarded to ${submission.freelancerId?.fullName}.\n\n` +
                `The freelancer will see the approval on their dashboard.`
            )
            router.push('/admin/dashboard/test-review')
        } catch (error: any) {
            console.error('Approval error:', error)
            const errorMessage = error.response?.data?.error || 'Failed to approve test. Please try again.'
            alert(`❌ Error: ${errorMessage}`)
        } finally {
            setProcessing(false)
        }
    }

    const handleReject = async () => {
        // Validation
        if (!rejectionFeedback.trim()) {
            alert('❌ Error: Please provide rejection feedback explaining why the submission is being rejected.')
            return
        }

        if (rejectionFeedback.trim().length < 30) {
            alert('❌ Error: Rejection feedback must be at least 30 characters long to provide meaningful guidance to the freelancer.')
            return
        }

        // Confirmation
        const confirmRejection = confirm(
            `⚠️ Confirm Rejection\n\n` +
            `Freelancer: ${submission.freelancerId?.fullName || 'Unknown'}\n` +
            `Test Level: ${submission.testId?.testLevel}\n\n` +
            `This will reject the submission. The freelancer can retake the test.\n\n` +
            `Continue with rejection?`
        )
        if (!confirmRejection) return

        setProcessing(true)
        try {
            await api.post(`/admin/test-submissions/${submissionId}/reject`, {
                feedback: rejectionFeedback,
            })

            alert(
                `✅ Submission Rejected\n\n` +
                `The freelancer has been notified and can retake the test.\n` +
                `Your feedback will help them improve.`
            )
            router.push('/admin/dashboard/test-review')
        } catch (error: any) {
            console.error('Rejection error:', error)
            const errorMessage = error.response?.data?.error || 'Failed to reject test. Please try again.'
            alert(`❌ Error: ${errorMessage}`)
        } finally {
            setProcessing(false)
        }
    }

    const navItems = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: Shield },
    ]

    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar
                    logo={<div className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /><span className="text-xl font-bold text-primary">Admin</span></div>}
                    items={navItems}
                />
                <div className="flex-1">
                    <TopBar title="Review Test Submission" />
                    <main className="container-custom py-8">
                        <SkeletonCard />
                    </main>
                </div>
            </div>
        )
    }

    if (!submission) {
        return (
            <div className="flex h-screen">
                <Sidebar
                    logo={<div className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /><span className="text-xl font-bold text-primary">Admin</span></div>}
                    items={navItems}
                />
                <div className="flex-1">
                    <TopBar title="Review Test Submission" />
                    <main className="container-custom py-8">
                        <Card>
                            <CardContent className="p-12 text-center">
                                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Submission Not Found</h3>
                                <Button onClick={() => router.push('/admin/dashboard/test-review')}>
                                    Back to Test Review
                                </Button>
                            </CardContent>
                        </Card>
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
                    title="Review Test Submission"
                    subtitle={submission.freelancerId?.fullName || 'Unknown'}
                    user={{ name: 'Admin' }}
                />

                <main className="flex-1 overflow-y-auto">
                    <div className="container-custom py-8 space-y-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/admin/dashboard/test-review')}
                            className="mb-6"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Test Review
                        </Button>

                        {/* Freelancer Profile */}
                        {freelancer && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Freelancer Profile
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <User className="h-5 w-5 text-neutral-500 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-500">Full Name</p>
                                                    <p className="text-base font-semibold text-neutral-900">{freelancer.fullName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Mail className="h-5 w-5 text-neutral-500 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-500">Email</p>
                                                    <p className="text-base text-neutral-900">{freelancer.userId?.email || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <MapPin className="h-5 w-5 text-neutral-500 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-500">Location</p>
                                                    <p className="text-base text-neutral-900">{freelancer.location || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Briefcase className="h-5 w-5 text-neutral-500 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-500">Experience</p>
                                                    <p className="text-base text-neutral-900">{freelancer.yearsOfExperience || 0} years</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <GraduationCap className="h-5 w-5 text-neutral-500 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-500">Education</p>
                                                    <p className="text-base font-semibold text-neutral-900">{freelancer.education?.degree || 'N/A'}</p>
                                                    <p className="text-sm text-neutral-600">{freelancer.education?.field || 'N/A'}</p>
                                                    <p className="text-sm text-neutral-600">{freelancer.education?.universityName || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Award className="h-5 w-5 text-neutral-500 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-500">Current Status</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant={
                                                            freelancer.status === 'APPROVED' ? 'success' :
                                                                freelancer.status === 'REJECTED' ? 'error' :
                                                                    'warning'
                                                        }>
                                                            {freelancer.status}
                                                        </Badge>
                                                        {freelancer.badgeLevel && (
                                                            <Badge variant="outline">{freelancer.badgeLevel} Badge</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {freelancer.portfolioUrls && freelancer.portfolioUrls.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-500 mb-2">Portfolio</p>
                                                    {freelancer.portfolioUrls.map((url: string, idx: number) => (
                                                        <a
                                                            key={idx}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-primary-600 hover:underline block"
                                                        >
                                                            Portfolio Link {idx + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Test Submission Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Test Submission Details</CardTitle>
                                <CardDescription>Review the test submission and questions/answers</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-500">Field</p>
                                        <p className="text-base font-semibold text-neutral-900">{submission.testId?.field || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-500">Level</p>
                                        <Badge>{submission.testId?.testLevel || 'N/A'}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-500">Submitted Date</p>
                                        <p className="text-base text-neutral-900">{new Date(submission.submittedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-500">Submitted Time</p>
                                        <p className="text-base text-neutral-900">{new Date(submission.submittedAt).toLocaleTimeString()}</p>
                                    </div>
                                </div>

                                {/* Submission Links */}
                                {(submission.githubRepositoryLink || submission.figmaLink || submission.liveWebsiteUrl || submission.demoVideoUrl || submission.zipFileUrl) && (
                                    <div className="pt-4 border-t">
                                        <p className="text-sm font-medium text-neutral-500 mb-3">Submitted Links</p>
                                        <div className="space-y-3">
                                            {submission.githubRepositoryLink && (
                                                <div className="bg-neutral-50 p-3 rounded-lg">
                                                    <p className="text-xs font-medium text-neutral-600 mb-1">GitHub Repository</p>
                                                    <a
                                                        href={submission.githubRepositoryLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary-600 hover:underline break-all text-sm"
                                                    >
                                                        {submission.githubRepositoryLink}
                                                    </a>
                                                </div>
                                            )}
                                            {submission.figmaLink && (
                                                <div className="bg-neutral-50 p-3 rounded-lg">
                                                    <p className="text-xs font-medium text-neutral-600 mb-1">Figma Design Link</p>
                                                    <a
                                                        href={submission.figmaLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary-600 hover:underline break-all text-sm"
                                                    >
                                                        {submission.figmaLink}
                                                    </a>
                                                </div>
                                            )}
                                            {submission.liveWebsiteUrl && (
                                                <div className="bg-neutral-50 p-3 rounded-lg">
                                                    <p className="text-xs font-medium text-neutral-600 mb-1">Live Website URL</p>
                                                    <a
                                                        href={submission.liveWebsiteUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary-600 hover:underline break-all text-sm"
                                                    >
                                                        {submission.liveWebsiteUrl}
                                                    </a>
                                                </div>
                                            )}
                                            {submission.demoVideoUrl && (
                                                <div className="bg-neutral-50 p-3 rounded-lg">
                                                    <p className="text-xs font-medium text-neutral-600 mb-1">Demo Video URL</p>
                                                    <a
                                                        href={submission.demoVideoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary-600 hover:underline break-all text-sm"
                                                    >
                                                        {submission.demoVideoUrl}
                                                    </a>
                                                </div>
                                            )}
                                            {submission.zipFileUrl && (
                                                <div className="bg-neutral-50 p-3 rounded-lg">
                                                    <p className="text-xs font-medium text-neutral-600 mb-1">ZIP File Download</p>
                                                    <a
                                                        href={submission.zipFileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary-600 hover:underline break-all text-sm"
                                                    >
                                                        {submission.zipFileUrl}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {submission.notes && (
                                    <div className="pt-4 border-t">
                                        <p className="text-sm font-medium text-neutral-500 mb-2">Freelancer Notes</p>
                                        <p className="text-neutral-700 bg-neutral-50 p-3 rounded">{submission.notes}</p>
                                    </div>
                                )}


                                {/* Complete Test Details */}
                                {submission.testId && (
                                    <div className="pt-4 border-t">
                                        <p className="text-lg font-semibold text-neutral-900 mb-4">Complete Test Given to Freelancer</p>

                                        <div className="space-y-4">
                                            {/* Test Title */}
                                            <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded">
                                                <p className="text-sm font-medium text-primary-700 mb-1">Test Title</p>
                                                <p className="text-base font-semibold text-neutral-900">{submission.testId.title}</p>
                                            </div>

                                            {/* Test Description */}
                                            <div className="bg-neutral-50 p-4 rounded-lg">
                                                <p className="text-sm font-medium text-neutral-700 mb-2">Description</p>
                                                <p className="text-neutral-900 whitespace-pre-wrap">{submission.testId.description}</p>
                                            </div>

                                            {/* Test Instructions */}
                                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                                <p className="text-sm font-medium text-blue-700 mb-2">Instructions</p>
                                                <p className="text-neutral-900 whitespace-pre-wrap">{submission.testId.instructions}</p>
                                            </div>

                                            {/* Inner Fields if available */}
                                            {submission.testId.innerFields && submission.testId.innerFields.length > 0 && (
                                                <div className="bg-neutral-50 p-4 rounded-lg">
                                                    <p className="text-sm font-medium text-neutral-700 mb-2">Specific Areas Covered</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {submission.testId.innerFields.map((field: string, idx: number) => (
                                                            <Badge key={idx} variant="outline">{field}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Approve Section */}
                        <Card className="border-2 border-success-200">
                            <CardHeader className="bg-success-50">
                                <CardTitle className="flex items-center gap-2 text-success-900">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Approve & Award Badge
                                </CardTitle>
                                <CardDescription>Award a badge and approve this freelancer</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-base font-semibold">Badge Level (Selected by Freelancer)</Label>
                                        <div className="w-full mt-2 p-3 border-2 border-neutral-200 rounded-lg bg-neutral-50 text-neutral-700 font-medium">
                                            {submission.testId?.testLevel === 'LOW' && '🥉 Low (Entry Level)'}
                                            {submission.testId?.testLevel === 'MEDIUM' && '🥈 Medium (Intermediate)'}
                                            {submission.testId?.testLevel === 'HIGH' && '🥇 High (Expert)'}
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1">This is the badge level the freelancer selected for their test</p>
                                    </div>

                                    <div>
                                        <Label>Score (0-100) *</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={score}
                                            onChange={(e) => setScore(parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Hourly Rate (INR) - Optional</Label>
                                    <Input
                                        type="number"
                                        placeholder="e.g., 500"
                                        value={hourlyRate}
                                        onChange={(e) => setHourlyRate(e.target.value)}
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">Set the hourly rate for this freelancer (visible to clients)</p>
                                </div>

                                <div>
                                    <Label>Overall Feedback *</Label>
                                    <Textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Provide detailed feedback on the overall submission quality, skills demonstrated, and areas of excellence..."
                                        rows={4}
                                        className={feedback.trim().length > 0 && feedback.trim().length < 20 ? 'border-red-400' : ''}
                                    />
                                    <p className={`text-xs mt-1 ${feedback.trim().length === 0 ? 'text-neutral-500' :
                                        feedback.trim().length < 20 ? 'text-red-600 font-medium' :
                                            'text-green-600 font-medium'
                                        }`}>
                                        {feedback.trim().length}/20 characters minimum
                                        {feedback.trim().length > 0 && feedback.trim().length < 20 && ` (${20 - feedback.trim().length} more needed)`}
                                        {feedback.trim().length >= 20 && ' ✓'}
                                    </p>
                                </div>

                                <div>
                                    <Label>Strengths (one per line)</Label>
                                    <Textarea
                                        value={strengths}
                                        onChange={(e) => setStrengths(e.target.value)}
                                        placeholder="List key strengths demonstrated in the submission (one per line)&#10;Example:&#10;Strong problem-solving skills&#10;Excellent code quality&#10;Good communication"
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <Label>Areas for Improvement (one per line)</Label>
                                    <Textarea
                                        value={improvementAreas}
                                        onChange={(e) => setImprovementAreas(e.target.value)}
                                        placeholder="List areas where the freelancer can improve (one per line)&#10;Example:&#10;Could optimize performance further&#10;Documentation could be more detailed"
                                        rows={3}
                                    />
                                </div>

                                <Button
                                    onClick={handleApprove}
                                    disabled={processing || feedback.trim().length < 20}
                                    className={`w-full text-white font-semibold ${feedback.trim().length < 20 ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    style={{ backgroundColor: '#10b981', fontSize: '16px', padding: '24px' }}
                                    size="lg"
                                >
                                    {processing ? 'Processing...' :
                                        feedback.trim().length < 20 ? '✓ Approve & Award Badge (Complete feedback first)' :
                                            '✓ Approve & Award Badge'}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Reject Section */}
                        <Card className="border-2 border-error-200">
                            <CardHeader className="bg-error-50">
                                <CardTitle className="flex items-center gap-2 text-error-900">
                                    <XCircle className="h-5 w-5" />
                                    Reject Submission
                                </CardTitle>
                                <CardDescription>Reject this submission with detailed feedback</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div>
                                    <Label>Rejection Feedback *</Label>
                                    <Textarea
                                        value={rejectionFeedback}
                                        onChange={(e) => setRejectionFeedback(e.target.value)}
                                        placeholder="Provide clear, constructive feedback explaining why the submission is being rejected and what the freelancer needs to improve for their next attempt..."
                                        rows={5}
                                        className={rejectionFeedback.trim().length > 0 && rejectionFeedback.trim().length < 30 ? 'border-red-400' : ''}
                                    />
                                    <p className={`text-xs mt-1 ${rejectionFeedback.trim().length === 0 ? 'text-neutral-500' :
                                        rejectionFeedback.trim().length < 30 ? 'text-red-600 font-medium' :
                                            'text-green-600 font-medium'
                                        }`}>
                                        {rejectionFeedback.trim().length}/30 characters minimum
                                        {rejectionFeedback.trim().length > 0 && rejectionFeedback.trim().length < 30 && ` (${30 - rejectionFeedback.trim().length} more needed)`}
                                        {rejectionFeedback.trim().length >= 30 && ' ✓'}
                                    </p>
                                </div>

                                <Button
                                    onClick={handleReject}
                                    disabled={processing || rejectionFeedback.trim().length < 30}
                                    variant="destructive"
                                    className="w-full"
                                    size="lg"
                                >
                                    {processing ? 'Processing...' :
                                        rejectionFeedback.trim().length < 30 ? '✗ Reject Submission (Complete feedback first)' :
                                            '✗ Reject Submission'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}
