'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LogoutButton from '@/components/LogoutButton';
import api from '@/lib/api';

interface TestSubmission {
    _id: string;
    testId: {
        _id: string;
        title: string;
        description: string;
        field: string;
        testLevel: string;
        instructions: string;
    };
    freelancerId: {
        _id: string;
        fullName: string;
        userId: {
            email: string;
        };
        badgeLevel?: string;
        badgeScore?: number;
        badgeFeedback?: string;
        hourlyRate?: number;
    };
    status: 'SUBMITTED' | 'UNDER_REVIEW' | 'REVIEWED';
    zipFileUrl?: string;
    githubRepositoryLink?: string;
    figmaLink?: string;
    liveWebsiteUrl?: string;
    demoVideoUrl?: string;
    submittedAt?: string;
    reviewedAt?: string;
    createdAt: string;
}

// Format instructions with proper HTML lists and bold text
const formatInstructions = (text: string) => {
    if (!text) return text;

    const lines = text.split('\n');
    let formatted = '';
    let inList = false;

    lines.forEach((line) => {
        const trimmedLine = line.trim();

        // Check if line starts with asterisk bullet point
        if (trimmedLine.match(/^\*\s*\*\*.*\*\*/)) {
            // Bold bullet point (e.g., * **Scope:** ...)
            const content = trimmedLine.replace(/^\*\s*\*\*(.*)(\*\*:?\s*)(.*)/, '<strong>$1</strong>$2$3');
            if (!inList) {
                formatted += '<ul class="list-disc list-inside space-y-2 ml-4">\n';
                inList = true;
            }
            formatted += `<li>${content}</li>\n`;
        } else if (trimmedLine.startsWith('* ')) {
            // Regular bullet point
            const content = trimmedLine.substring(2).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            if (!inList) {
                formatted += '<ul class="list-disc list-inside space-y-2 ml-4">\n';
                inList = true;
            }
            formatted += `<li>${content}</li>\n`;
        } else if (trimmedLine) {
            // Regular text
            if (inList) {
                formatted += '</ul>\n';
                inList = false;
            }
            const content = trimmedLine.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            formatted += `<p class="mb-2">${content}</p>\n`;
        }
    });

    if (inList) {
        formatted += '</ul>\n';
    }

    return formatted;
};

export default function AdminAssignments() {
    const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<TestSubmission | null>(null);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

    // Review form state
    const [badgeLevel, setBadgeLevel] = useState('');
    const [score, setScore] = useState('');
    const [feedback, setFeedback] = useState('');
    const [strengths, setStrengths] = useState('');
    const [improvementAreas, setImprovementAreas] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        try {
            const { data } = await api.get('/admin/test-submissions');
            setSubmissions(data);
        } catch (error) {
            console.error('Error loading submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const openDetailsDialog = (submission: TestSubmission) => {
        setSelectedSubmission(submission);
        setDetailsDialogOpen(true);
    };

    const openReviewDialog = (submission: TestSubmission) => {
        setSelectedSubmission(submission);
        setBadgeLevel('');
        setScore('');
        setFeedback('');
        setStrengths('');
        setImprovementAreas('');
        setHourlyRate('');

        // Check if freelancer already has a badge
        checkExistingBadge(submission.freelancerId._id);

        setReviewDialogOpen(true);
    };

    const [hasExistingBadge, setHasExistingBadge] = useState(false);

    const checkExistingBadge = async (freelancerId: string) => {
        try {
            const { data } = await api.get(`/freelancers/${freelancerId}`);
            setHasExistingBadge(!!data.badgeLevel);
        } catch (error) {
            console.error('Error checking badge:', error);
            setHasExistingBadge(false);
        }
    };

    const handleReview = async () => {
        if (!selectedSubmission) return;

        try {
            await api.post(`/admin/test-submissions/${selectedSubmission._id}/review`, {
                badgeLevel: selectedSubmission.testId.testLevel, // Use the test level from the submission
                score: parseFloat(score),
                feedback,
                strengths: strengths.split(',').map(s => s.trim()).filter(Boolean),
                improvementAreas: improvementAreas.split(',').map(s => s.trim()).filter(Boolean),
                hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
            });

            alert('Badge awarded successfully!');
            setReviewDialogOpen(false);
            loadSubmissions();
        } catch (error: any) {
            alert(`Error: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleReject = async (submissionId: string) => {
        const feedback = prompt('Please provide rejection feedback:');
        if (!feedback) return;

        try {
            await api.post(`/admin/test-submissions/${submissionId}/reject`, { feedback });
            alert('Submission rejected');
            loadSubmissions();
        } catch (error: any) {
            alert(`Error: ${error.response?.data?.error || error.message}`);
        }
    };

    const getBadgeColor = (level: string) => {
        switch (level) {
            case 'HIGH': return 'bg-purple-500';
            case 'MEDIUM': return 'bg-blue-500';
            case 'LOW': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusColor = (status: string): "success" | "warning" | "error" | "info" | "neutral" | "primary" | "outline" => {
        switch (status) {
            case 'SUBMITTED': return 'warning';
            case 'UNDER_REVIEW': return 'info';
            case 'REVIEWED': return 'success';
            default: return 'neutral';
        }
    };

    if (loading) {
        return <div className="container mx-auto py-8">Loading...</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Test Submissions</h1>
                    <p className="text-muted-foreground">
                        Review freelancer test submissions and award badges
                    </p>
                </div>
                <LogoutButton />
            </div>

            {submissions.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No test submissions yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {submissions.map((submission) => (
                        <Card key={submission._id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="text-2xl mb-2">
                                            {submission.freelancerId.fullName}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {submission.freelancerId.userId?.email || 'N/A'}
                                        </p>
                                        <div className="flex gap-2 items-center">
                                            <Badge className={`${getBadgeColor(submission.testId.testLevel)} text-white`}>
                                                {submission.testId.testLevel} Level
                                            </Badge>
                                            <Badge variant="outline">{submission.testId.field}</Badge>
                                            <Badge variant={getStatusColor(submission.status)}>
                                                {submission.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-2">Test:</h3>
                                        <p className="text-muted-foreground">{submission.testId.title}</p>
                                    </div>

                                    <div className="text-sm text-muted-foreground">
                                        <p>Submitted: {new Date(submission.submittedAt || submission.createdAt).toLocaleDateString()}</p>
                                        {submission.reviewedAt && (
                                            <p>Reviewed: {new Date(submission.reviewedAt).toLocaleDateString()}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => openDetailsDialog(submission)}>
                                            View Full Details
                                        </Button>

                                        {submission.status !== 'REVIEWED' && (
                                            <>
                                                <Button size="sm" variant="solid" onClick={() => openReviewDialog(submission)}>
                                                    Review & Award Badge
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleReject(submission._id)}>
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Test Submission Details</DialogTitle>
                        <DialogDescription>
                            Full test information and submission links
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSubmission && (
                        <div className="space-y-6">
                            {/* Freelancer Info */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold mb-2">Freelancer Information</h3>
                                <p className="mb-1"><strong>Name:</strong> {selectedSubmission.freelancerId.fullName}</p>
                                <p className="mb-2"><strong>Email:</strong> {selectedSubmission.freelancerId.userId?.email || 'N/A'}</p>
                                <div className="flex gap-2 mt-2">
                                    <Badge className={`${getBadgeColor(selectedSubmission.testId.testLevel)} text-white`}>
                                        {selectedSubmission.testId.testLevel} Level
                                    </Badge>
                                    <Badge variant="outline">{selectedSubmission.testId.field}</Badge>
                                    <Badge variant={getStatusColor(selectedSubmission.status)}>
                                        {selectedSubmission.status}
                                    </Badge>
                                </div>
                            </div>

                            {/* Test Details - Freelancer Style */}
                            <Card className="border-2">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                                    <CardTitle className="text-3xl font-bold text-gray-900">
                                        {selectedSubmission.testId.title}
                                    </CardTitle>
                                    <CardDescription className="text-base mt-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                            {selectedSubmission.testId.testLevel} Level
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {selectedSubmission.testId.field}
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    {/* Freelancer Selected Badge Level */}
                                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-purple-900">
                                                    Freelancer Selected Badge Level
                                                </p>
                                                <p className="text-xs text-purple-700 mt-1">
                                                    This is the test level the freelancer chose to attempt
                                                </p>
                                            </div>
                                            <Badge className={`${getBadgeColor(selectedSubmission.testId.testLevel)} text-white text-base px-4 py-1`}>
                                                {selectedSubmission.testId.testLevel}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <h3 className="text-xl font-semibold mb-3 text-gray-900">📋 Description</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            {selectedSubmission.testId.description}
                                        </p>
                                    </div>

                                    {/* Instructions */}
                                    <div>
                                        <h3 className="text-xl font-semibold mb-3 text-gray-900">📝 Instructions</h3>
                                        <div
                                            className="prose prose-sm max-w-none text-gray-700"
                                            dangerouslySetInnerHTML={{
                                                __html: `<ul>${formatInstructions(selectedSubmission.testId.instructions || '')}</ul>`
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Submission Links */}
                            <div>
                                <h3 className="font-semibold mb-3 text-lg">Submitted Work</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedSubmission.githubRepositoryLink && (
                                        <a href={selectedSubmission.githubRepositoryLink} target="_blank" rel="noopener noreferrer"
                                            className="p-3 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                                            <span className="text-2xl">🔗</span>
                                            <div>
                                                <p className="font-semibold text-sm">GitHub Repository</p>
                                                <p className="text-xs text-blue-600 truncate">{selectedSubmission.githubRepositoryLink}</p>
                                            </div>
                                        </a>
                                    )}
                                    {selectedSubmission.figmaLink && (
                                        <a href={selectedSubmission.figmaLink} target="_blank" rel="noopener noreferrer"
                                            className="p-3 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                                            <span className="text-2xl">🎨</span>
                                            <div>
                                                <p className="font-semibold text-sm">Figma Design</p>
                                                <p className="text-xs text-blue-600 truncate">{selectedSubmission.figmaLink}</p>
                                            </div>
                                        </a>
                                    )}
                                    {selectedSubmission.liveWebsiteUrl && (
                                        <a href={selectedSubmission.liveWebsiteUrl} target="_blank" rel="noopener noreferrer"
                                            className="p-3 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                                            <span className="text-2xl">🌐</span>
                                            <div>
                                                <p className="font-semibold text-sm">Live Website</p>
                                                <p className="text-xs text-blue-600 truncate">{selectedSubmission.liveWebsiteUrl}</p>
                                            </div>
                                        </a>
                                    )}
                                    {selectedSubmission.demoVideoUrl && (
                                        <a href={selectedSubmission.demoVideoUrl} target="_blank" rel="noopener noreferrer"
                                            className="p-3 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                                            <span className="text-2xl">🎥</span>
                                            <div>
                                                <p className="font-semibold text-sm">Demo Video</p>
                                                <p className="text-xs text-blue-600 truncate">{selectedSubmission.demoVideoUrl}</p>
                                            </div>
                                        </a>
                                    )}
                                    {selectedSubmission.zipFileUrl && (
                                        <a href={selectedSubmission.zipFileUrl} target="_blank" rel="noopener noreferrer"
                                            className="p-3 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                                            <span className="text-2xl">📦</span>
                                            <div>
                                                <p className="font-semibold text-sm">ZIP File</p>
                                                <p className="text-xs text-blue-600 truncate">{selectedSubmission.zipFileUrl}</p>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>Close</Button>
                        {selectedSubmission && selectedSubmission.status !== 'REVIEWED' && (
                            <Button onClick={() => {
                                setDetailsDialogOpen(false);
                                openReviewDialog(selectedSubmission);
                            }}>
                                Review & Award Badge
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Review Dialog */}
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {hasExistingBadge ? 'Freelancer Badge Information' : 'Review Submission & Award Badge'}
                        </DialogTitle>
                        <DialogDescription>
                            {hasExistingBadge
                                ? `Badge information for ${selectedSubmission?.freelancerId.fullName} (Read-only)`
                                : `Award a badge level and set hourly rate for ${selectedSubmission?.freelancerId.fullName}`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {hasExistingBadge ? (
                        /* Display existing badge (read-only) */
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800 font-semibold mb-2">
                                    ✓ This freelancer already has an awarded badge
                                </p>
                                <p className="text-xs text-blue-700">
                                    Badges are immutable once awarded and cannot be changed.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Badge Level</Label>
                                    <div className="mt-1 p-2 bg-gray-50 rounded border">
                                        <Badge className="text-sm">
                                            {selectedSubmission?.freelancerId.badgeLevel || 'N/A'}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Score</Label>
                                    <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                                        {selectedSubmission?.freelancerId.badgeScore || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label className="text-muted-foreground">Feedback</Label>
                                <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                                    {selectedSubmission?.freelancerId.badgeFeedback || 'No feedback provided'}
                                </div>
                            </div>

                            {selectedSubmission?.freelancerId.hourlyRate && (
                                <div>
                                    <Label className="text-muted-foreground">Hourly Rate</Label>
                                    <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                                        ₹{selectedSubmission.freelancerId.hourlyRate}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Award new badge form */
                        <div className="space-y-4">
                            <div>
                                <Label>Badge Level (Freelancer Selected) *</Label>
                                <div className="mt-1 p-3 bg-gray-50 border rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedSubmission?.testId.testLevel}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            This is the test level the freelancer chose - it cannot be changed
                                        </p>
                                    </div>
                                    <Badge className={`${getBadgeColor(selectedSubmission?.testId.testLevel || '')} text-white`}>
                                        {selectedSubmission?.testId.testLevel}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <Label>Score (0-100) *</Label>
                                <Input
                                    type="number"
                                    value={score}
                                    onChange={(e) => setScore(e.target.value)}
                                    placeholder="85"
                                    min="0"
                                    max="100"
                                />
                            </div>

                            <div>
                                <Label>Hourly Rate (₹)</Label>
                                <Input
                                    type="number"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(e.target.value)}
                                    placeholder="500"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Optional: Set custom hourly rate</p>
                            </div>

                            <div>
                                <Label>Feedback *</Label>
                                <Textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Overall feedback on the submission..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label>Strengths (comma-separated)</Label>
                                <Input
                                    value={strengths}
                                    onChange={(e) => setStrengths(e.target.value)}
                                    placeholder="Clean code, Good design, Fast delivery"
                                />
                            </div>

                            <div>
                                <Label>Areas for Improvement (comma-separated)</Label>
                                <Input
                                    value={improvementAreas}
                                    onChange={(e) => setImprovementAreas(e.target.value)}
                                    placeholder="Documentation, Testing, Error handling"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                            {hasExistingBadge ? 'Close' : 'Cancel'}
                        </Button>
                        {!hasExistingBadge && (
                            <Button
                                onClick={handleReview}
                                disabled={!score || !feedback}
                            >
                                Award Badge
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
