'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import api from '@/lib/api';

export default function InvitationsPage() {
    const router = useRouter();
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedScope, setSelectedScope] = useState<any>(null);
    const [scopeDialogOpen, setScopeDialogOpen] = useState(false);

    useEffect(() => {
        loadInvitations();
    }, []);

    const loadInvitations = async () => {
        try {
            const { data } = await api.get('/invitations/freelancer/me');
            setInvitations(data || []);
        } catch (error: any) {
            console.error('Error loading invitations:', error);
            if (error.response?.status === 404) {
                setInvitations([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const acceptInvitation = async (invitationId: string) => {
        try {
            await api.post(`/invitations/${invitationId}/accept`);
            alert('Invitation accepted! Project assigned to you.');
            router.push('/freelancer/dashboard');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to accept invitation');
            loadInvitations(); // Reload in case status changed
        }
    };

    const rejectInvitation = async (invitationId: string) => {
        if (!confirm('Are you sure you want to reject this invitation?')) return;

        try {
            await api.post(`/invitations/${invitationId}/reject`);
            alert('Invitation rejected');
            loadInvitations();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to reject invitation');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <p>Loading invitations...</p>
            </div>
        );
    }

    const pendingInvitations = invitations.filter(inv => inv.status === 'PENDING');
    const otherInvitations = invitations.filter(inv => inv.status !== 'PENDING');

    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.push('/freelancer/dashboard')}>
                    ← Back to Dashboard
                </Button>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Project Invitations</CardTitle>
                    <CardDescription>
                        Review and respond to project invitations from clients
                    </CardDescription>
                </CardHeader>
            </Card>

            {pendingInvitations.length === 0 && otherInvitations.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No invitations yet</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {pendingInvitations.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
                            <div className="space-y-4">
                                {pendingInvitations.map((invitation) => (
                                    <Card key={invitation._id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle>Project Invitation</CardTitle>
                                                    <CardDescription>
                                                        From: {invitation.projectId?.clientId?.companyName || 'Client'}
                                                    </CardDescription>
                                                </div>
                                                <Badge>Pending</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {invitation.projectId?.scopeId && (
                                                <>
                                                    <div>
                                                        <p className="text-sm font-medium">Field</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {invitation.projectId.scopeId.field}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-medium">Specializations</p>
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            {invitation.projectId.scopeId.innerFields?.map((field: string, idx: number) => (
                                                                <Badge key={idx} variant="outline">{field}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {invitation.projectId.scopeId.deliverables && (
                                                        <div>
                                                            <p className="text-sm font-medium mb-2">Deliverables</p>
                                                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                                {invitation.projectId.scopeId.deliverables.slice(0, 3).map((item: string, idx: number) => (
                                                                    <li key={idx}>{item}</li>
                                                                ))}
                                                                {invitation.projectId.scopeId.deliverables.length > 3 && (
                                                                    <li>... and {invitation.projectId.scopeId.deliverables.length - 3} more</li>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <p className="text-sm font-medium">Scope Mode</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {invitation.projectId.scopeId.scopeMode === 'PLATFORM_SCOPE'
                                                                ? 'Platform-managed (Paid)'
                                                                : 'Self-managed (Free)'}
                                                        </p>
                                                    </div>
                                                </>
                                            )}

                                            <div className="flex gap-2 pt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedScope(invitation.projectId?.scopeId);
                                                        setScopeDialogOpen(true);
                                                    }}
                                                >
                                                    View Full Scope
                                                </Button>
                                                <Button
                                                    onClick={() => acceptInvitation(invitation._id)}
                                                    className="flex-1"
                                                >
                                                    Accept & Assign to Me
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => rejectInvitation(invitation._id)}
                                                    className="flex-1"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {otherInvitations.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Past Invitations</h2>
                            <div className="space-y-4">
                                {otherInvitations.map((invitation) => (
                                    <Card key={invitation._id}>
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">
                                                        {invitation.projectId?.clientId?.companyName || 'Project'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {invitation.projectId?.scopeId?.field}
                                                    </p>
                                                </div>
                                                <Badge variant={
                                                    invitation.status === 'ACCEPTED' ? 'success' :
                                                        invitation.status === 'DECLINED' ? 'error' : 'neutral'
                                                }>
                                                    {invitation.status}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* View Full Scope Dialog */}
            <Dialog open={scopeDialogOpen} onOpenChange={setScopeDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Full Project Scope</DialogTitle>
                        <DialogDescription>
                            Complete project scope, flow, and requirements
                        </DialogDescription>
                    </DialogHeader>
                    {selectedScope && (
                        <div className="space-y-6 mt-4">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Field</h3>
                                <p className="text-sm text-muted-foreground">{selectedScope.field}</p>
                            </div>

                            {selectedScope.innerFields && selectedScope.innerFields.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Specializations</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedScope.innerFields.map((field: string, idx: number) => (
                                            <Badge key={idx} variant="outline">{field}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedScope.projectOverview && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Project Overview</h3>
                                    <p className="text-sm text-muted-foreground">{selectedScope.projectOverview}</p>
                                </div>
                            )}

                            {selectedScope.deliverables && selectedScope.deliverables.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">📦 Deliverables</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {selectedScope.deliverables.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedScope.inScopeItems && selectedScope.inScopeItems.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">✅ In Scope Items</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {selectedScope.inScopeItems.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedScope.inclusions && selectedScope.inclusions.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">✅ What's Included</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {selectedScope.inclusions.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedScope.outOfScopeItems && selectedScope.outOfScopeItems.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">❌ Out of Scope Items</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {selectedScope.outOfScopeItems.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedScope.exclusions && selectedScope.exclusions.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">❌ What's Excluded</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {selectedScope.exclusions.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedScope.assumptions && selectedScope.assumptions.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">💡 Assumptions</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {selectedScope.assumptions.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedScope.timeline && selectedScope.timeline.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">📅 Timeline</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {selectedScope.timeline.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedScope.acceptanceCriteria && selectedScope.acceptanceCriteria.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">🎯 Acceptance Criteria</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {selectedScope.acceptanceCriteria.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedScope.completionCriteria && selectedScope.completionCriteria.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">🎯 Completion Criteria</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {selectedScope.completionCriteria.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedScope.revisionLimits && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">🔄 Revision Limits</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Up to <strong>{selectedScope.revisionLimits}</strong> rounds of revisions included
                                    </p>
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold text-lg mb-2">Scope Mode</h3>
                                <p className="text-sm text-muted-foreground">
                                    {selectedScope.scopeMode === 'PLATFORM_SCOPE'
                                        ? 'Platform-managed (Paid)'
                                        : 'Self-managed (Free)'}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
