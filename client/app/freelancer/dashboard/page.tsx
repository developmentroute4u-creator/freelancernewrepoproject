/**
 * FREELANCER DASHBOARD - Premium Design System Redesign
 * 
 * Clean, professional, calm aesthetic
 * Focus on clarity and hierarchy
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Mail,
  Settings,
  Award,
  DollarSign,
  TrendingUp,
  Clock
} from 'lucide-react'
import api from '@/lib/api'
import { Sidebar } from '@/components/ui/sidebar'
import { TopBar } from '@/components/ui/topbar'
import { StatCard } from '@/components/ui/stat-card'
import { BadgeDisplay } from '@/components/ui/badge-display'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export default function FreelancerDashboard() {
  const router = useRouter()
  const [freelancer, setFreelancer] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [testSubmissions, setTestSubmissions] = useState<any[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  // Enforce test completion before dashboard access
  useEffect(() => {
    if (!loading && freelancer) {
      // Check if freelancer has completed and passed a test (has badgeLevel)
      if (!freelancer.badgeLevel) {
        // Handle different statuses
        if (freelancer.status === 'PENDING') {
          // Freelancer hasn't completed onboarding
          router.push('/freelancer/onboarding')
          return
        }

        if (freelancer.status === 'REJECTED') {
          // Freelancer's test was rejected, redirect to test page for retake
          router.push('/freelancer/test')
          return
        }

        if (freelancer.status === 'UNDER_REVIEW') {
          // Test submitted but not yet reviewed - allow dashboard access with banner
          // Don't redirect, just show a banner (handled in the UI below)
          return
        }

        // No badge and not under review = needs to take test
        router.push('/freelancer/test')
        return
      }
    }
  }, [freelancer, loading, router])

  const loadData = async () => {
    try {
      const [freelancerRes, projectsRes, submissionsRes, invitationsRes] = await Promise.all([
        api.get('/freelancers/me'),
        api.get('/projects/freelancer'),
        api.get('/freelancers/test-submissions'),
        api.get('/invitations/freelancer'),
      ])

      setFreelancer(freelancerRes.data)
      setProjects(projectsRes.data)
      setTestSubmissions(submissionsRes.data)
      setInvitations(invitationsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { label: 'Dashboard', href: '/freelancer/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/freelancer/projects', icon: Briefcase, badge: projects.length },
    { label: 'Invitations', href: '/freelancer/invitations', icon: Mail, badge: invitations.length },
    {
      label: 'Test',
      href: '/freelancer/test',
      icon: FileText,
      disabled: freelancer?.status === 'UNDER_REVIEW' && !freelancer?.badgeLevel,
      badge: freelancer?.status === 'UNDER_REVIEW' && !freelancer?.badgeLevel ? 'REVIEW' : undefined
    },
    { label: 'Settings', href: '/freelancer/settings', icon: Settings },
  ]

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
              <SkeletonCard />
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
        logo={
          <div className="text-xl font-bold text-primary">
            Platform
          </div>
        }
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
          subtitle="Welcome back!"
          notificationCount={invitations.length}
          user={{
            name: freelancer?.name || 'Freelancer',
            email: freelancer?.email,
          }}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="container-custom py-8 space-y-8">
            {/* Under Review Status - Prominent Display */}
            {freelancer?.status === 'UNDER_REVIEW' && !freelancer?.badgeLevel && (
              <Card className="border-2 border-yellow-400 bg-yellow-50">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl text-yellow-900">Test Under Review</CardTitle>
                        <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">PENDING REVIEW</Badge>
                      </div>
                      <CardDescription className="text-yellow-800 text-base">
                        Your skill test submission is currently being reviewed by our admin team.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2">What happens next?</h4>
                    <ul className="space-y-2 text-sm text-yellow-800">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span>Our admin will review your test submission and evaluate your work</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span>If <strong>approved</strong>, you'll receive a badge and gain full access to projects</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span>If <strong>rejected</strong>, you can retake the same test or choose a lower difficulty level</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span><strong>You cannot take a new test</strong> while your current submission is under review</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-yellow-700">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Review typically takes 1-2 business days. You'll be notified once complete.</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Badge Section */}
            <BadgeDisplay
              level={freelancer?.badgeLevel}
              score={freelancer?.badgeScore}
              field={freelancer?.education?.field}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <StatCard
                title="Active Projects"
                value={projects.length}
                description={`${projects.filter((p: any) => p.status === 'IN_PROGRESS').length} in progress`}
                icon={Briefcase}
              />
              <StatCard
                title="Total Earnings"
                value="$0"
                description="This month"
                icon={DollarSign}
              />
              <StatCard
                title="Success Rate"
                value="100%"
                description="All projects completed"
                icon={TrendingUp}
              />
            </div>

            {/* Active Projects */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-neutral-900">Active Projects</h2>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>

              {projects.length === 0 ? (
                <EmptyState
                  icon={<Briefcase className="h-8 w-8 text-neutral-400" />}
                  title="No active projects"
                  description="You don't have any active projects yet. Check your invitations to get started."
                  action={{
                    label: 'View Invitations',
                    onClick: () => router.push('/freelancer/invitations'),
                  }}
                />
              ) : (
                <div className="grid gap-4">
                  {projects.slice(0, 3).map((project: any) => (
                    <Card key={project._id} hover>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{project.title || 'Untitled Project'}</CardTitle>
                            <CardDescription className="mt-1">
                              {project.clientId?.name || 'Client'}
                            </CardDescription>
                          </div>
                          <Badge variant={
                            project.status === 'IN_PROGRESS' ? 'info' :
                              project.status === 'COMPLETED' ? 'success' :
                                'neutral'
                          }>
                            {project.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <ProgressBar
                            value={50}
                            label="Progress"
                            showPercentage
                            variant="primary"
                          />
                          <div className="flex items-center gap-4 text-sm text-neutral-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Due: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => router.push(`/freelancer/projects/${project._id}`)}
                          >
                            View Project
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Test Submissions - Simplified */}
            {testSubmissions.length > 0 && (
              <div>
                <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Recent Test Submissions</h2>
                <div className="grid gap-4">
                  {testSubmissions.slice(0, 2).map((submission: any) => (
                    <Card key={submission._id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                            <FileText className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">
                              {submission.testId?.title || 'Test Submission'}
                            </p>
                            <p className="text-sm text-neutral-600">
                              Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          submission.status === 'REVIEWED' && !submission.rejected ? 'success' :
                            submission.rejected ? 'error' :
                              'warning'
                        }>
                          {submission.rejected ? 'Rejected' : submission.status}
                        </Badge>
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