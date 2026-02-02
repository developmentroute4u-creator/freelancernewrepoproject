/**
 * CLIENT DASHBOARD - Premium Design System Redesign
 * 
 * Clean, professional interface for clients
 * Focus on project management and freelancer discovery
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  Plus,
  Search,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react'
import api from '@/lib/api'
import { Sidebar } from '@/components/ui/sidebar'
import { TopBar } from '@/components/ui/topbar'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonCard } from '@/components/ui/skeleton'

export default function ClientDashboard() {
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [clientRes, projectsRes] = await Promise.all([
        api.get('/clients/me'),
        api.get('/projects'),
      ])

      setClient(clientRes.data)
      setProjects(projectsRes.data)
    } catch (error: any) {
      console.error('Error loading data:', error)
      // If client profile is not found, redirect to onboarding
      if (error.response?.status === 404 && error.config.url.includes('/clients/me')) {
        router.push('/client/onboarding')
      }
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { label: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/client/projects', icon: Briefcase, badge: projects.length },
    { label: 'Discover', href: '/client/discover', icon: Users },
    { label: 'Settings', href: '/client/settings', icon: Settings },
  ]

  const activeProjects = projects.filter(p => p.state === 'ACTIVE')
  const completedProjects = projects.filter(p => p.state === 'COMPLETED')

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar
          logo={<div className="text-xl font-bold text-primary">Platform</div>}
          items={navItems}
        />
        <div className="flex-1">
          <TopBar title="Dashboard" />
          <main className="container-custom py-8">
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        logo={<div className="text-xl font-bold text-primary">Platform</div>}
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

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title="Dashboard"
          subtitle="Manage your projects"
          user={{
            name: client?.name || 'Client',
            email: client?.email,
          }}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="container-custom py-8 space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card
                hover
                className="cursor-pointer border-2 border-dashed border-primary-200 bg-primary-50/30"
                onClick={() => router.push('/client/projects/create')}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                    <Plus className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-900">Create New Project</h3>
                    <p className="text-sm text-primary-700">Start a new project with scope and pricing</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                hover
                className="cursor-pointer border-2 border-dashed border-accent-200 bg-accent-50/30"
                onClick={() => router.push('/client/discover')}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-100">
                    <Search className="h-6 w-6 text-accent-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent-900">Find Freelancers</h3>
                    <p className="text-sm text-accent-700">Discover verified professionals</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <StatCard
                title="Total Projects"
                value={projects.length}
                description={`${activeProjects.length} active`}
                icon={Briefcase}
              />
              <StatCard
                title="In Progress"
                value={activeProjects.length}
                description="Currently active"
                icon={Clock}
              />
              <StatCard
                title="Completed"
                value={completedProjects.length}
                description="Successfully delivered"
                icon={CheckCircle2}
              />
            </div>

            {/* Active Projects */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-neutral-900">Active Projects</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/client/projects')}
                >
                  View All
                </Button>
              </div>

              {activeProjects.length === 0 ? (
                <EmptyState
                  icon={<Briefcase className="h-8 w-8 text-neutral-400" />}
                  title="No active projects"
                  description="Create your first project to get started with professional freelancers."
                  action={{
                    label: 'Create Project',
                    onClick: () => router.push('/client/projects/create'),
                  }}
                />
              ) : (
                <div className="grid gap-4">
                  {activeProjects.slice(0, 3).map((project: any) => (
                    <Card key={project._id} hover>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{project.name || 'Untitled Project'}</CardTitle>
                            <CardDescription className="mt-1">
                              {project.scopeId?.field || 'General'} • Created {new Date(project.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Badge variant="info">
                            {project.state}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm text-neutral-600">
                              Freelancer: {project.freelancerId?.fullName || 'Not assigned'}
                            </p>
                            {project.deadline && (
                              <p className="text-sm text-neutral-600 flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Due: {new Date(project.deadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/client/projects/${project._id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {completedProjects.length > 0 && (
              <div>
                <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Recently Completed</h2>
                <div className="grid gap-4">
                  {completedProjects.slice(0, 2).map((project: any) => (
                    <Card key={project._id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-support-50">
                            <CheckCircle2 className="h-5 w-5 text-support-600" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">
                              {project.name || 'Untitled Project'}
                            </p>
                            <p className="text-sm text-neutral-600">
                              Completed {new Date(project.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="success">Completed</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
