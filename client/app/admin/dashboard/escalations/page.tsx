'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';

interface Escalation {
    _id: string;
    projectId: {
        _id: string;
        scopeId: {
            field: string;
        };
        clientId: {
            companyName: string;
        };
        freelancerId: {
            fullName: string;
        };
    };
    issueType: string;
    description: string;
    evidence: string[];
    status: string;
    createdAt: string;
}

export default function AdminEscalations() {
    const [escalations, setEscalations] = useState<Escalation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [resolution, setResolution] = useState('');
    const [resolutionDecision, setResolutionDecision] = useState('');

    useEffect(() => {
        loadEscalations();
    }, []);

    const loadEscalations = async () => {
        try {
            const { data } = await api.get('/admin/escalations?status=PENDING');
            setEscalations(data);
        } catch (error) {
            console.error('Error loading escalations:', error);
        } finally {
            setLoading(false);
        }
    };

    const openResolveDialog = (escalation: Escalation) => {
        setSelectedEscalation(escalation);
        setResolution('');
        setResolutionDecision('');
        setResolveDialogOpen(true);
    };

    const submitResolution = async () => {
        if (!selectedEscalation) return;

        try {
            await api.post(`/admin/escalations/${selectedEscalation._id}/resolve`, {
                resolution,
                resolutionDecision
            });

            setResolveDialogOpen(false);
            loadEscalations();
        } catch (error) {
            console.error('Error resolving escalation:', error);
        }
    };

    const getIssueTypeColor = (type: string) => {
        switch (type) {
            case 'SCOPE_VIOLATION': return 'bg-red-500';
            case 'QUALITY_ISSUE': return 'bg-orange-500';
            case 'DELAY': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    if (loading) {
        return <div className="container mx-auto py-8">Loading escalations...</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Escalation Management</h1>
                <p className="text-muted-foreground">
                    Resolve project disputes with final authority
                </p>
            </div>

            {escalations.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No pending escalations</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {escalations.map((escalation) => (
                        <Card key={escalation._id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{escalation.projectId.scopeId.field} Project</CardTitle>
                                        <CardDescription className="mt-1">
                                            {escalation.projectId.clientId.companyName} vs {escalation.projectId.freelancerId.fullName}
                                        </CardDescription>
                                    </div>
                                    <Badge className={`${getIssueTypeColor(escalation.issueType)} text-white`}>
                                        {escalation.issueType.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium mb-1">Issue Description:</p>
                                        <p className="text-sm text-muted-foreground">{escalation.description}</p>
                                    </div>

                                    {escalation.evidence && escalation.evidence.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium mb-1">Evidence:</p>
                                            <div className="space-y-1">
                                                {escalation.evidence.map((url, idx) => (
                                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block">
                                                        Evidence {idx + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-sm text-muted-foreground">
                                        Raised: {new Date(escalation.createdAt).toLocaleDateString()}
                                    </p>

                                    <Button onClick={() => openResolveDialog(escalation)} className="w-full mt-2">
                                        Resolve Escalation
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Resolve Escalation</DialogTitle>
                        <DialogDescription>
                            Make a final decision on this dispute
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Resolution Decision *</Label>
                            <Select
                                value={resolutionDecision}
                                onValueChange={setResolutionDecision}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select decision" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="REWORK">Rework - Freelancer must redo work</SelectItem>
                                    <SelectItem value="REPLACEMENT">Replacement - Assign new freelancer</SelectItem>
                                    <SelectItem value="REFUND">Refund - Return payment to client</SelectItem>
                                    <SelectItem value="CLOSURE">Closure - Close project as-is</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Decision Explanation *</Label>
                            <Textarea
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                placeholder="Provide detailed explanation of your decision..."
                                rows={6}
                            />
                        </div>

                        {selectedEscalation && (
                            <div className="p-4 bg-gray-50 rounded">
                                <p className="text-sm font-medium mb-2">Project Details:</p>
                                <p className="text-sm">Field: {selectedEscalation.projectId.scopeId.field}</p>
                                <p className="text-sm">Client: {selectedEscalation.projectId.clientId.companyName}</p>
                                <p className="text-sm">Freelancer: {selectedEscalation.projectId.freelancerId.fullName}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submitResolution}
                            disabled={!resolutionDecision || !resolution}
                        >
                            Submit Final Decision
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
