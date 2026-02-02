'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

export default function FreelancerProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (projectId) {
            loadProject();
        }
    }, [projectId]);

    const loadProject = async () => {
        try {
            console.log('🔄 Loading project:', projectId);
            const { data } = await api.get(`/projects/${projectId}`);
            console.log('✅ Project loaded:', data);
            setProject(data);
            setError(null);
        } catch (error: any) {
            console.error('❌ Error loading project:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to load project';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const confirmPayment = async () => {
        if (!confirm('Are you sure you want to confirm payment reception? This will close the project.')) {
            return;
        }

        try {
            await api.patch(`/projects/${projectId}/state`, {
                state: 'CLOSED'
            });
            alert('Project closed successfully!');
            loadProject();
        } catch (error: any) {
            console.error('Error closing project:', error);
            alert(error.response?.data?.error || 'Failed to close project');
        }
    };

    const reportIssue = async () => {
        const reason = prompt('Please describe the issue with the payment:');
        if (!reason) return;

        try {
            await api.patch(`/projects/${projectId}/state`, {
                state: 'DISPUTED'
            });
            alert('Project marked as disputed. Support will contact you.');
            loadProject();
        } catch (error: any) {
            console.error('Error reporting issue:', error);
            alert(error.response?.data?.error || 'Failed to report issue');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p>Loading project...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ... error and no project checks ...

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        <Button onClick={() => router.push('/freelancer/dashboard')}>
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Project not found</p>
                        <Button onClick={() => router.push('/freelancer/dashboard')}>
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const scope = project.scopeId;

    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.push('/freelancer/dashboard')}>
                    ← Back to Dashboard
                </Button>
            </div>

            <div className="space-y-6">
                {project.state === 'COMPLETED' && (
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-green-800 mb-2">Project Completed</h3>
                            <p className="text-green-700 mb-4">The client has marked this project as completed. Please confirm if you have received the payment.</p>
                            <div className="flex gap-4">
                                <Button onClick={confirmPayment} className="bg-green-600 hover:bg-green-700">Confirm Payment Received</Button>
                                <Button onClick={reportIssue} variant="destructive">Report Issue</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl">{project.name || 'Project Details'}</CardTitle>
                                <CardDescription>View project details and scope</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant={project.state === 'ACTIVE' ? 'primary' : 'neutral'}>
                                    {project.state}
                                </Badge>
                                <Badge variant="outline">
                                    {project.accountabilityMode}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium">Project Name</p>
                                <p className="text-sm text-muted-foreground">{project.name || 'Unnamed Project'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Created</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(project.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            {project.clientId && (
                                <div className="col-span-2">
                                    <p className="text-sm font-medium">Client</p>
                                    <p className="text-sm text-muted-foreground">
                                        {typeof project.clientId === 'object'
                                            ? project.clientId.companyName || 'N/A'
                                            : 'N/A'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {scope && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Scope</CardTitle>
                            <CardDescription>
                                {scope.scopeMode === 'PLATFORM_SCOPE' ? 'Platform-managed scope' : 'Self-managed scope'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Field</h3>
                                <p className="text-sm text-muted-foreground">{scope.field}</p>
                            </div>

                            {scope.innerFields && scope.innerFields.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Specializations</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {scope.innerFields.map((field: string, idx: number) => (
                                            <Badge key={idx} variant="outline">{field}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {scope.projectOverview && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Project Overview</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{scope.projectOverview}</p>
                                </div>
                            )}

                            {scope.deliverables && scope.deliverables.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">📦 Deliverables</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {scope.deliverables.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {scope.inScopeItems && scope.inScopeItems.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">✅ In Scope Items</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {scope.inScopeItems.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {scope.inclusions && scope.inclusions.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">✅ What's Included</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {scope.inclusions.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {scope.outOfScopeItems && scope.outOfScopeItems.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">❌ Out of Scope Items</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {scope.outOfScopeItems.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {scope.exclusions && scope.exclusions.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">❌ What's Excluded</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {scope.exclusions.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {scope.assumptions && scope.assumptions.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">💡 Assumptions</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {scope.assumptions.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {scope.timeline && scope.timeline.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">📅 Timeline</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {scope.timeline.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {scope.acceptanceCriteria && scope.acceptanceCriteria.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">🎯 Acceptance Criteria</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {scope.acceptanceCriteria.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {scope.completionCriteria && scope.completionCriteria.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">🎯 Completion Criteria</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {scope.completionCriteria.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {scope.revisionLimits && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">🔄 Revision Limits</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Up to <strong>{scope.revisionLimits}</strong> rounds of revisions included
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
