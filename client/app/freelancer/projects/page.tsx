'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sidebar } from '@/components/ui/sidebar'
import { TopBar } from '@/components/ui/topbar'
import { LayoutDashboard, Briefcase, Mail, Settings } from 'lucide-react'
import api from '@/lib/api'

export default function FreelancerProjectsPage() {
    const router = useRouter()
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadProjects()
    }, [])

    const loadProjects = async () => {
        try {
            const { data } = await api.get('/projects')
            setProjects(data || [])
        } catch (error) {
            console.error('Error loading projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const navItems = [
        { label: 'Dashboard', href: '/freelancer/dashboard', icon: LayoutDashboard },
        { label: 'Projects', href: '/freelancer/projects', icon: Briefcase, badge: projects.length },
        { label: 'Invitations', href: '/freelancer/invitations', icon: Mail },
        { label: 'Settings', href: '/freelancer/settings', icon: Settings },
    ]

    return (
        <div className="flex h-screen">
            <Sidebar
                logo={<div className="text-xl font-bold text-primary">Platform</div>}
                items={navItems}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar
                    title="My Projects"
                    user={{
                        name: 'Freelancer',
                        email: '',
                    }}
                />
                <main className="flex-1 overflow-y-auto">
                    <div className="container-custom py-8 space-y-6">
                        {loading ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p>Loading projects...</p>
                                </CardContent>
                            </Card>
                        ) : projects.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p className="text-muted-foreground mb-4">No projects yet</p>
                                    <p className="text-sm text-muted-foreground">
                                        Projects will appear here once you accept invitations
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-6">
                                {projects.map((project) => (
                                    <Card key={project._id} className="hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() => router.push(`/freelancer/projects/${project._id}`)}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle>{project.name || 'Unnamed Project'}</CardTitle>
                                                    <CardDescription>
                                                        {project.scopeId?.field || 'No field specified'}
                                                    </CardDescription>
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
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="font-medium">Client</p>
                                                    <p className="text-muted-foreground">
                                                        {typeof project.clientId === 'object'
                                                            ? project.clientId?.companyName || 'N/A'
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-medium">Created</p>
                                                    <p className="text-muted-foreground">
                                                        {new Date(project.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            {project.scopeId?.innerFields && project.scopeId.innerFields.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium mb-2">Specializations</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {project.scopeId.innerFields.map((field: string, idx: number) => (
                                                            <Badge key={idx} variant="outline" className="text-xs">
                                                                {field}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
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
