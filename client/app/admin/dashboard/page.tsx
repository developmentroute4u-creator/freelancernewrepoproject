'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LogoutButton from '@/components/LogoutButton';
import api from '@/lib/api';

interface TestSubmission {
    _id: string;
    testId: {
        title: string;
        field: string;
        testLevel: string;
    };
    freelancerId: {
        _id: string;
        fullName: string;
        email: string;
    };
    status: string;
    createdAt: string;
}

export default function AdminDashboard() {
    const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        try {
            const { data } = await api.get('/admin/submissions');
            setSubmissions(data);
        } catch (error) {
            console.error('Error loading submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="container mx-auto py-8">Loading...</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage test submissions and platform settings
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/pricing">
                        <Button variant="outline">💰 Pricing Management</Button>
                    </Link>
                    <LogoutButton />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Total Submissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{submissions.length}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Pending Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-yellow-600">
                            {submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW').length}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Approved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-600">
                            {submissions.filter(s => s.status === 'REVIEWED').length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Submissions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Test Submissions</CardTitle>
                        <CardDescription>Latest freelancer test submissions awaiting review</CardDescription>
                    </div>
                    <Link href="/admin/dashboard/assignments">
                        <Button variant="outline">See All Submissions</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {submissions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No submissions yet</p>
                    ) : (
                        <div className="space-y-4">
                            {submissions.slice(0, 5).map((submission) => (
                                <div key={submission._id} className="flex justify-between items-center p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-semibold">{submission.freelancerId.fullName}</p>
                                        <p className="text-sm text-muted-foreground">{submission.testId.title}</p>
                                        <p className="text-xs text-muted-foreground">{submission.testId.field}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant={
                                            submission.status === 'REVIEWED' ? 'default' :
                                                submission.status === 'SUBMITTED' ? 'secondary' :
                                                    submission.status === 'UNDER_REVIEW' ? 'secondary' : 'destructive'
                                        }>
                                            {submission.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
