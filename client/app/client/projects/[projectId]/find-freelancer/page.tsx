'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/api';

export default function FindFreelancerPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;

    const [freelancers, setFreelancers] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadFreelancers();
    }, [projectId]);

    const loadFreelancers = async () => {
        try {
            const { data } = await api.get(`/freelancers/by-project/${projectId}`);
            setFreelancers(data);
        } catch (error) {
            console.error('Error loading freelancers:', error);
            alert('Failed to load freelancers');
        } finally {
            setLoading(false);
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
            router.push(`/client/projects/${projectId}`);
        } catch (error: any) {
            console.error('Error sending invitations:', error);
            alert(error.response?.data?.error || 'Failed to send invitations');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <p>Loading freelancers...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.push(`/client/projects/${projectId}`)}>
                    ← Back to Project
                </Button>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Find Freelancers</CardTitle>
                    <CardDescription>
                        Select freelancers to invite to your project. They will be notified and can accept or reject the invitation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {selectedIds.length > 0 && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium">
                                {selectedIds.length} freelancer(s) selected
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {freelancers.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                            No freelancers found matching your project requirements.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Try broadening your project scope or check back later.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {freelancers.map((freelancer) => (
                        <Card key={freelancer._id} className={selectedIds.includes(freelancer._id) ? 'border-blue-500 border-2' : ''}>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <Checkbox
                                        checked={selectedIds.includes(freelancer._id)}
                                        onCheckedChange={() => toggleSelection(freelancer._id)}
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-lg font-semibold">{freelancer.fullName}</h3>
                                                <p className="text-sm text-muted-foreground">{freelancer.userId?.email}</p>
                                            </div>
                                            <Badge variant={
                                                freelancer.badgeLevel === 'HIGH' ? 'default' :
                                                    freelancer.badgeLevel === 'MEDIUM' ? 'secondary' : 'outline'
                                            }>
                                                {freelancer.badgeLevel} Level
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <p className="text-sm font-medium">Field</p>
                                                <p className="text-sm text-muted-foreground">{freelancer.field}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Experience</p>
                                                <p className="text-sm text-muted-foreground">{freelancer.yearsOfExperience} years</p>
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

                                        {freelancer.skills && freelancer.skills.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm font-medium mb-2">Skills</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {freelancer.skills.map((skill: string, idx: number) => (
                                                        <Badge key={idx} variant="outline">{skill}</Badge>
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
            )}

            {freelancers.length > 0 && (
                <div className="mt-6 flex justify-end gap-4">
                    <Button variant="outline" onClick={() => router.push(`/client/projects/${projectId}`)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={sendInvitations}
                        disabled={selectedIds.length === 0 || sending}
                    >
                        {sending ? 'Sending...' : `Send ${selectedIds.length} Invitation(s)`}
                    </Button>
                </div>
            )}
        </div>
    );
}
