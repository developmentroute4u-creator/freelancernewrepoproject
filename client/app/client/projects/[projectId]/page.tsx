'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/api';

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<any>(null);
    const [freelancers, setFreelancers] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingFreelancers, setLoadingFreelancers] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (projectId) {
            loadProject();
        }
    }, [projectId]);

    const loadProject = async () => {
        try {
            console.log('🔄 Frontend: Loading project:', projectId);
            const { data } = await api.get(`/projects/${projectId}`);
            console.log('✅ Frontend: Project loaded:', data);
            setProject(data);
            setError(null);

            // If no freelancer is selected, load available freelancers
            const hasFreelancer = data.freelancerId && (typeof data.freelancerId === 'object' ? data.freelancerId._id : data.freelancerId);
            if (!hasFreelancer) {
                loadFreelancers();
            }
        } catch (error: any) {
            console.error('❌ Frontend: Error loading project:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to load project';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const loadFreelancers = async () => {
        setLoadingFreelancers(true);
        try {
            const { data } = await api.get(`/freelancers/by-project/${projectId}`);
            setFreelancers(data || []);
        } catch (error: any) {
            console.error('Error loading freelancers:', error);
            setFreelancers([]);
        } finally {
            setLoadingFreelancers(false);
        }
    };

    const toggleSelection = (freelancerId: string) => {
        setSelectedIds(prev =>
            prev.includes(freelancerId)
                ? prev.filter(id => id !== freelancerId)
                : [...prev, freelancerId]
        );
    };

    const sendInvitations = async () => {
        if (selectedIds.length === 0) {
            alert('Please select at least one freelancer');
            return;
        }

        setSending(true);
        try {
            await api.post(`/projects/${projectId}/invite-freelancers`, {
                freelancerIds: selectedIds,
            });

            alert(`Successfully sent ${selectedIds.length} invitation(s)!`);
            // Reload project to see updated state
            loadProject();
        } catch (error: any) {
            console.error('Error sending invitations:', error);
            alert(error.response?.data?.error || 'Failed to send invitations');
        } finally {
            setSending(false);
        }
    };

    const completeProject = async () => {
        if (!confirm('Are you sure you want to mark this project as completed? This will indicate that the work is done and payment can be processed.')) {
            return;
        }

        try {
            await api.patch(`/projects/${projectId}/state`, {
                state: 'COMPLETED'
            });
            alert('Project marked as completed!');
            loadProject();
        } catch (error: any) {
            console.error('Error completing project:', error);
            alert(error.response?.data?.error || 'Failed to complete project');
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

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        <Button onClick={() => router.push('/client/dashboard')}>
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
                        <Button onClick={() => router.push('/client/dashboard')}>
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const scope = project.scopeId;
    const hasFreelancer = project.freelancerId && (typeof project.freelancerId === 'object' ? project.freelancerId._id : project.freelancerId);

    // If no freelancer is selected, show freelancer selection
    if (!hasFreelancer) {
        return (
            <div className="container mx-auto py-8 max-w-6xl">
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => router.push('/client/dashboard')}>
                        ← Back to Dashboard
                    </Button>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">{project.name || 'Project Details'}</CardTitle>
                            <CardDescription>Select a freelancer to assign to this project</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium">Project Name</p>
                                    <p className="text-sm text-muted-foreground">{project.name || 'Unnamed Project'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Status</p>
                                    <Badge variant={project.state === 'ACTIVE' ? 'primary' : 'neutral'}>
                                        {project.state}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Available Freelancers</CardTitle>
                            <CardDescription>
                                Select freelancers to invite to your project. They will be notified and can accept or reject the invitation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingFreelancers ? (
                                <div className="py-12 text-center">
                                    <p className="text-muted-foreground">Loading freelancers...</p>
                                </div>
                            ) : freelancers.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-muted-foreground mb-2">No Freelancer</p>
                                    <p className="text-sm text-muted-foreground">
                                        We'll select it right now. Please select a freelancer or check back later.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {selectedIds.length > 0 && (
                                        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                            <p className="text-sm font-medium">
                                                {selectedIds.length} freelancer(s) selected
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {freelancers.map((freelancer) => (
                                            <Card key={freelancer._id} className={selectedIds.includes(freelancer._id) ? 'border-blue-500 border-2' : ''}>
                                                <CardContent className="p-6">
                                                    <div className="flex items-start gap-4">
                                                        <Checkbox
                                                            checked={selectedIds.includes(freelancer._id)}
                                                            onChange={() => toggleSelection(freelancer._id)}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <h3 className="text-lg font-semibold">{freelancer.fullName}</h3>
                                                                    <p className="text-sm text-muted-foreground">{freelancer.userId?.email}</p>
                                                                </div>
                                                                <Badge variant={
                                                                    freelancer.badgeLevel === 'HIGH' ? 'primary' :
                                                                        freelancer.badgeLevel === 'MEDIUM' ? 'neutral' : 'outline'
                                                                }>
                                                                    {freelancer.badgeLevel} Level
                                                                </Badge>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                                <div>
                                                                    <p className="text-sm font-medium">Field</p>
                                                                    <p className="text-sm text-muted-foreground">{freelancer.education?.field || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">Experience</p>
                                                                    <p className="text-sm text-muted-foreground">{freelancer.yearsOfExperience || 0} years</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">Location</p>
                                                                    <p className="text-sm text-muted-foreground">{freelancer.location}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">Hourly Rate</p>
                                                                    <p className="text-sm text-muted-foreground">₹{freelancer.hourlyRate || 'N/A'}/hr</p>
                                                                </div>
                                                            </div>

                                                            {freelancer.education?.innerFields && freelancer.education.innerFields.length > 0 && (
                                                                <div className="mt-4">
                                                                    <p className="text-sm font-medium mb-2">Specializations</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {freelancer.education.innerFields.map((field: string, idx: number) => (
                                                                            <Badge key={idx} variant="outline">{field}</Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    <div className="mt-6 flex justify-end gap-4">
                                        <Button variant="outline" onClick={() => router.push('/client/dashboard')}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={sendInvitations}
                                            disabled={selectedIds.length === 0 || sending}
                                        >
                                            {sending ? 'Sending...' : `Send ${selectedIds.length} Invitation(s)`}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // If freelancer is selected, show full details
    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.push('/client/dashboard')}>
                    ← Back to Dashboard
                </Button>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl">{project.name || 'Project Details'}</CardTitle>
                                <CardDescription>View and manage your project</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {project.state === 'ACTIVE' && (
                                    <Button size="sm" onClick={completeProject} className="bg-green-600 hover:bg-green-700 text-white mr-2">
                                        Mark Completed & Pay
                                    </Button>
                                )}
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
                            {project.freelancerId && (
                                <div className="col-span-2">
                                    <p className="text-sm font-medium">Assigned Freelancer</p>
                                    <p className="text-sm text-muted-foreground">
                                        {typeof project.freelancerId === 'object'
                                            ? `${project.freelancerId.fullName} (${project.freelancerId.userId?.email || 'N/A'})`
                                            : 'Assigned'}
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
                            {scope.deliverables && scope.deliverables.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">📦 Deliverables</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {scope.deliverables.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {scope.inclusions && scope.inclusions.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">✅ What's Included</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {scope.inclusions.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {scope.exclusions && scope.exclusions.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">❌ What's Excluded</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {scope.exclusions.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {scope.revisionLimits && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">🔄 Revision Limits</h3>
                                    <p className="text-sm">Up to <strong>{scope.revisionLimits}</strong> rounds of revisions included</p>
                                </div>
                            )}

                            {scope.completionCriteria && scope.completionCriteria.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">🎯 Completion Criteria</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {scope.completionCriteria.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
