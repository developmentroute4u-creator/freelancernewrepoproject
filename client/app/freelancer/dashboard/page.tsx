/**
 * FREELANCER DASHBOARD - Premium Design System Redesign
 * 
 * Clean, professional, calm aesthetic
 * Focus on clarity and hierarchy
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  Clock,
  ClipboardCheck
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
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const freelancerRef = useRef<any>(null)

  // Keep ref in sync with state
  useEffect(() => {
    freelancerRef.current = freelancer
  }, [freelancer])

  useEffect(() => {
    loadData()
  }, [])

  // Function to check and update status - uses ref to get latest values
  // Memoized with useCallback to prevent stale closures in intervals
  const checkStatus = useCallback(async (showNotification = true) => {
    try {
      const currentFreelancer = freelancerRef.current
      if (!currentFreelancer) {
        console.log('⚠️ No freelancer data in ref, skipping status check')
        return
      }

      console.log('🔍 Checking for status updates...')
      const res = await api.get('/freelancers/me')
      const updatedFreelancer = res.data

      console.log('📥 Received update:', {
        status: updatedFreelancer.status,
        badgeLevel: updatedFreelancer.badgeLevel,
        badgeScore: updatedFreelancer.badgeScore
      })

      // Check if status or badge changed using ref (latest values)
      const statusChanged = updatedFreelancer.status !== currentFreelancer.status
      const badgeChanged = updatedFreelancer.badgeLevel !== currentFreelancer.badgeLevel

      // Show a notification only if status changed from UNDER_REVIEW and showNotification is true
      if (showNotification && statusChanged && currentFreelancer.status === 'UNDER_REVIEW' && updatedFreelancer.status === 'APPROVED') {
        alert(`🎉 Congratulations! Your test has been approved and you've been awarded a ${updatedFreelancer.badgeLevel} level badge!`)
      } else if (showNotification && statusChanged && currentFreelancer.status === 'UNDER_REVIEW' && updatedFreelancer.status === 'REJECTED') {
        alert('Your test submission was not approved. You can retake the test to try again.')
      }

      // Always update to ensure we have the latest data
      if (statusChanged || badgeChanged) {
        console.log('✅ Status updated!', {
          oldStatus: currentFreelancer.status,
          newStatus: updatedFreelancer.status,
          oldBadge: currentFreelancer.badgeLevel,
          newBadge: updatedFreelancer.badgeLevel
        })
      }

      // Update the freelancer data - this will trigger re-render
      setFreelancer(updatedFreelancer)

      // If status is no longer UNDER_REVIEW, stop polling
      if (updatedFreelancer.status !== 'UNDER_REVIEW' && statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current)
        statusCheckIntervalRef.current = null
        console.log('🛑 Auto-refresh stopped - status changed to', updatedFreelancer.status)
      }
    } catch (error) {
      console.error('❌ Auto-refresh error:', error)
    }
  }, []) // Empty deps because we use refs for all values

  // Auto-refresh when status is UNDER_REVIEW to detect admin approval/rejection
  useEffect(() => {
    if (!freelancer) return

    const currentStatus = freelancer.status
    console.log('📊 Current freelancer status:', currentStatus, 'Badge:', freelancer.badgeLevel)

    // Clear any existing interval
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current)
      statusCheckIntervalRef.current = null
    }

    // Check immediately when freelancer data is available
    checkStatus(true)

    // If status is UNDER_REVIEW, check every 5 seconds
    if (currentStatus === 'UNDER_REVIEW') {
      console.log('🔄 Auto-refresh enabled: Checking for status updates every 5 seconds...')
      statusCheckIntervalRef.current = setInterval(() => {
        checkStatus(true)
      }, 5000)
    }

    // Cleanup function
    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current)
        statusCheckIntervalRef.current = null
        console.log('🛑 Auto-refresh disabled (cleanup)')
      }
    }
  }, [freelancer?._id, freelancer?.status]) // Re-run when freelancer ID or status changes


  const loadData = async () => {
    try {
      const [freelancerRes, projectsRes, submissionsRes, invitationsRes] = await Promise.allSettled([
        api.get('/freelancers/me'),
        api.get('/projects'),
        api.get('/freelancers/test-submissions'),
        api.get('/invitations/freelancer/me'),
      ])

      // Extract data from settled promises
      const freelancerData = freelancerRes.status === 'fulfilled' ? freelancerRes.value.data : null
      const projectsData = projectsRes.status === 'fulfilled' ? projectsRes.value.data : []
      const submissionsData = submissionsRes.status === 'fulfilled' ? submissionsRes.value.data : []
      const invitationsData = invitationsRes.status === 'fulfilled' ? invitationsRes.value.data : []

      // Log errors for failed requests
      if (freelancerRes.status === 'rejected') {
        console.error('Error loading freelancer data:', freelancerRes.reason)
      }
      if (projectsRes.status === 'rejected') {
        console.error('Error loading projects:', projectsRes.reason)
      }
      if (submissionsRes.status === 'rejected') {
        console.error('Error loading test submissions:', submissionsRes.reason)
      }
      if (invitationsRes.status === 'rejected') {
        console.warn('Error loading invitations (may not exist yet):', invitationsRes.reason?.response?.status === 404 ? '404 - No invitations' : invitationsRes.reason)
      }

      console.log('=== DASHBOARD DEBUG ===')
      console.log('Freelancer data:', freelancerData)
      console.log('Freelancer status:', freelancerData?.status)
      console.log('Freelancer badgeLevel:', freelancerData?.badgeLevel)
      console.log('Freelancer badgeScore:', freelancerData?.badgeScore)
      console.log('Freelancer badgeFeedback:', freelancerData?.badgeFeedback)
      console.log('Test submissions:', submissionsData)
      console.log('Test submissions count:', submissionsData?.length)
      console.log('======================')

      // Additional debug for badge display
      console.log('🎯 BADGE DISPLAY DEBUG:')
      console.log('Will show badge?', !!freelancerData?.badgeLevel)
      console.log('Badge level value:', freelancerData?.badgeLevel)
      console.log('Status value:', freelancerData?.status)
      console.log('Expected to show:',
        freelancerData?.badgeLevel ? 'BADGE' :
          freelancerData?.status === 'UNDER_REVIEW' ? 'UNDER REVIEW' :
            freelancerData?.status === 'REJECTED' ? 'REJECTED' :
              'PENDING (Take Test)'
      )
      console.log('======================')

      if (freelancerData) {
        setFreelancer(freelancerData)
      }
      setProjects(projectsData)
      setTestSubmissions(submissionsData)
      setInvitations(invitationsData)
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
    { label: 'Test', href: '/freelancer/dashboard/test', icon: ClipboardCheck },
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
            {/* Test Status Banner - Single unified status display */}
            <Card className={`border-2 ${freelancer?.status === 'APPROVED' && freelancer?.badgeLevel
              ? 'border-green-400 bg-green-50'
              : freelancer?.status === 'REJECTED'
                ? 'border-red-400 bg-red-50'
                : 'border-yellow-400 bg-yellow-50'
              }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${freelancer?.status === 'APPROVED' && freelancer?.badgeLevel
                      ? 'bg-green-400'
                      : freelancer?.status === 'REJECTED'
                        ? 'bg-red-400'
                        : 'bg-yellow-400'
                      }`}>
                      {freelancer?.status === 'APPROVED' && freelancer?.badgeLevel ? (
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : freelancer?.status === 'REJECTED' ? (
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-lg font-semibold ${freelancer?.status === 'APPROVED' && freelancer?.badgeLevel
                          ? 'text-green-900'
                          : freelancer?.status === 'REJECTED'
                            ? 'text-red-900'
                            : 'text-yellow-900'
                          }`}>
                          {freelancer?.status === 'APPROVED' && freelancer?.badgeLevel
                            ? 'Test Approved'
                            : freelancer?.status === 'REJECTED'
                              ? 'Test Rejected'
                              : 'Under Review'}
                        </h3>
                        <Badge className={`text-white text-xs ${freelancer?.status === 'APPROVED' && freelancer?.badgeLevel
                          ? 'bg-green-500 hover:bg-green-600'
                          : freelancer?.status === 'REJECTED'
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-yellow-500 hover:bg-yellow-600'
                          }`}>
                          {freelancer?.status === 'APPROVED' && freelancer?.badgeLevel
                            ? 'APPROVED'
                            : freelancer?.status === 'REJECTED'
                              ? 'REJECTED'
                              : 'UNDER REVIEW'}
                        </Badge>
                      </div>
                      <p className={`text-sm ${freelancer?.status === 'APPROVED' && freelancer?.badgeLevel
                        ? 'text-green-800'
                        : freelancer?.status === 'REJECTED'
                          ? 'text-red-800'
                          : 'text-yellow-800'
                        }`}>
                        {freelancer?.status === 'APPROVED' && freelancer?.badgeLevel
                          ? `Awarded ${freelancer.badgeLevel} badge`
                          : freelancer?.status === 'REJECTED'
                            ? 'You can retake the test'
                            : 'Your profile is being reviewed by admin'}
                      </p>
                      {freelancer?.status === 'UNDER_REVIEW' && (
                        <p className="text-xs text-yellow-700 mt-1">
                          ⏱️ Auto-checking every 5 seconds
                        </p>
                      )}
                    </div>
                  </div>
                  {freelancer?.status === 'UNDER_REVIEW' && (
                    <Button
                      onClick={async () => {
                        setLoading(true)
                        try {
                          await checkStatus(true)
                        } finally {
                          setLoading(false)
                        }
                      }}
                      disabled={loading}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      size="sm"
                    >
                      {loading ? 'Checking...' : '🔄 Check Status'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Badge Display Logic:
                - If APPROVED with badge: Show the badge (this is the highest approved badge)
                  - If they have rejectedTestLevel, it means they tried a higher level and failed, so show retest option
                - If REJECTED with badge: Show the lower badge they had before with retest option
                - If REJECTED without badge: Show retest card below
            */}
            {((freelancer?.status === 'APPROVED' && freelancer?.badgeLevel) ||
              (freelancer?.status === 'REJECTED' && freelancer?.badgeLevel)) && (
                <BadgeDisplay
                  level={freelancer?.badgeLevel}
                  score={freelancer?.badgeScore}
                  field={freelancer?.education?.field}
                  status={
                    freelancer?.status === 'REJECTED' || freelancer?.rejectedTestLevel
                      ? 'REJECTED'
                      : freelancer?.status
                  }
                />
              )}

            {/* Show retest button if rejected and no badge */}
            {freelancer?.status === 'REJECTED' && !freelancer?.badgeLevel && (
              <Card className="border-2 border-red-400 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-400">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-red-900 mb-1">Test Rejected</h3>
                        <p className="text-sm text-red-800">
                          Your test submission did not meet the requirements. You can retake the test to try again.
                        </p>
                        {freelancer?.badgeFeedback && (
                          <p className="text-xs text-red-700 mt-2">
                            Feedback: {freelancer.badgeFeedback}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push('/freelancer/test')}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      Retake Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}


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
                    <Card key={project._id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-neutral-200">
                      <CardHeader className="pb-3 border-b bg-neutral-50/50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-xl font-bold text-primary-900">
                              {project.name || 'Untitled Project'}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                              <span className="font-semibold text-primary-700">
                                {project.clientId?.companyName || 'Private Client'}
                              </span>
                              <span>•</span>
                              <span>{project.clientId?.industry || 'General'}</span>
                            </div>
                          </div>
                          <Badge variant={
                            project.state === 'ACTIVE' ? 'success' :
                              project.state === 'IN_PROGRESS' ? 'info' :
                                project.state === 'COMPLETED' ? 'primary' :
                                  'neutral'
                          } className="capitalize">
                            {project.state?.replace('_', ' ').toLowerCase() || 'Pending'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Field & Domain</p>
                            <p className="text-sm font-medium text-neutral-800">{project.scopeId?.field || 'General'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Accountability</p>
                            <Badge variant={project.accountabilityMode === 'ACCOUNTABILITY' ? 'info' : 'outline'} className="text-[10px] h-5">
                              {project.accountabilityMode === 'ACCOUNTABILITY' ? '🛡️ Platform Verified' : 'Standard'}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Target Deadline</p>
                            <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-800">
                              <Clock className="h-4 w-4 text-accent-600" />
                              {project.scopeId?.intentAnswers?.deadline
                                ? new Date(project.scopeId.intentAnswers.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'No deadline'}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Specializations</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {project.scopeId?.innerFields?.slice(0, 2).map((field: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-neutral-200 text-neutral-600">
                                  {field}
                                </Badge>
                              ))}
                              {project.scopeId?.innerFields?.length > 2 && (
                                <span className="text-[10px] text-neutral-400">+{project.scopeId.innerFields.length - 2} more</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="solid"
                          size="lg"
                          className="w-full shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                          onClick={() => router.push(`/freelancer/projects/${project._id}`)}
                        >
                          View Project Details
                        </Button>
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