'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface Project {
    _id: string;
    state: string;
    accountabilityMode: string;
    freelancerId?: {
        fullName: string;
        badgeLevel: string;
    };
    scopeId: {
        field: string;
        scopeMode: string;
    };
    createdAt: string;
}

export default function ClientProjects() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const { data } = await api.get('/projects');
            setProjects(data);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStateColor = (state: string) => {
        switch (state) {
            case 'ACTIVE': return 'bg-green-500';
            case 'COMPLETED': return 'bg-blue-500';
            case 'DISPUTED': return 'bg-red-500';
            case 'CLOSED': return 'bg-gray-500';
            default: return 'bg-yellow-500';
        }
    };

    if (loading) {
        return <div className="container mx-auto py-8">Loading projects...</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">My Projects</h1>
                    <p className="text-muted-foreground">Manage your freelance projects</p>
                </div>
                <Button onClick={() => router.push('/client/discover')}>
                    + New Project
                </Button>
            </div>

            {projects.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">No projects yet</p>
                        <Button onClick={() => router.push('/client/discover')}>
                            Find Freelancers
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {projects.map((project) => (
                        <Card key={project._id} className="hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => router.push(`/client/projects/${project._id}`)}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{project.scopeId.field} Project</CardTitle>
                                        <CardDescription className="mt-1">
                                            {project.freelancerId
                                                ? `with ${project.freelancerId.fullName}`
                                                : 'Waiting for freelancer acceptance'}
                                        </CardDescription>
                                    </div>
                                    <Badge className={`${getStateColor(project.state)} text-white`}>
                                        {project.state}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    {project.freelancerId && (
                                        <Badge variant="outline">
                                            {project.freelancerId.badgeLevel} Badge
                                        </Badge>
                                    )}
                                    <Badge variant="outline">
                                        {project.scopeId.scopeMode === 'PLATFORM_SCOPE' ? 'Platform Scope' : 'Own Scope'}
                                    </Badge>
                                    <Badge variant="outline">
                                        {project.accountabilityMode === 'ACCOUNTABILITY' ? 'Accountability Mode' : 'Basic Mode'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Created: {new Date(project.createdAt).toLocaleDateString()}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
