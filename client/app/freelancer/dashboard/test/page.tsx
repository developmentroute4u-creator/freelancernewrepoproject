'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sidebar } from '@/components/ui/sidebar'
import { TopBar } from '@/components/ui/topbar'
import { LayoutDashboard, Briefcase, Mail, Settings, ArrowUp, ArrowDown, Award, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { SkeletonCard } from '@/components/ui/skeleton'

export default function FreelancerTestPage() {
  const router = useRouter()
  const [freelancer, setFreelancer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [availableLevels, setAvailableLevels] = useState<{
    higher: string | null
    lower: string[]
  }>({ higher: null, lower: [] })

  useEffect(() => {
    loadFreelancer()
  }, [])

  useEffect(() => {
    if (freelancer) {
      calculateAvailableLevels()
    }
  }, [freelancer])

  const loadFreelancer = async () => {
    try {
      const res = await api.get('/freelancers/me')
      setFreelancer(res.data)
    } catch (error) {
      console.error('Error loading freelancer:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAvailableLevels = () => {
    if (!freelancer) return

    const levelHierarchy: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 }
    let higher: string | null = null
    const lower: string[] = []

    // If freelancer has an approved badge
    if (freelancer.status === 'APPROVED' && freelancer.badgeLevel) {
      const currentLevel = levelHierarchy[freelancer.badgeLevel]

      // Can take next higher level
      if (freelancer.badgeLevel === 'LOW') {
        higher = 'MEDIUM'
      } else if (freelancer.badgeLevel === 'MEDIUM') {
        higher = 'HIGH'
      }
      // HIGH badge - no higher level available
    }

    // If freelancer was rejected
    if (freelancer.rejectedTestLevel) {
      const rejectedLevel = levelHierarchy[freelancer.rejectedTestLevel]

      // Can only take lower levels
      if (rejectedLevel >= 3) {
        // Rejected at HIGH, can take MEDIUM or LOW
        lower.push('MEDIUM', 'LOW')
      } else if (rejectedLevel >= 2) {
        // Rejected at MEDIUM, can take LOW
        lower.push('LOW')
      }
      // Rejected at LOW - no retake allowed
    }

    // If no badge and not rejected, can take any level (but we'll show as "higher" options)
    if (!freelancer.badgeLevel && !freelancer.rejectedTestLevel) {
      // For new freelancers, all levels are available
      // We'll show them as options to start
    }

    setAvailableLevels({ higher, lower })
  }

  const handleTakeTest = (level: string) => {
    router.push(`/freelancer/test?level=${level}`)
  }

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      LOW: 'Entry Level (2-4 hours)',
      MEDIUM: 'Intermediate (4-8 hours)',
      HIGH: 'Advanced (8-16 hours)',
    }
    return labels[level] || level
  }

  const getLevelDescription = (level: string) => {
    const descriptions: Record<string, string> = {
      LOW: 'Perfect for beginners. Focus on fundamental skills and basic execution.',
      MEDIUM: 'For intermediate freelancers. Requires structured thinking and best practices.',
      HIGH: 'For advanced freelancers. Complex, open-ended problems requiring expertise.',
    }
    return descriptions[level] || ''
  }

  const navItems = [
    { label: 'Dashboard', href: '/freelancer/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/freelancer/projects', icon: Briefcase },
    { label: 'Invitations', href: '/freelancer/invitations', icon: Mail },
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
          <TopBar title="Take Test" />
          <main className="container-custom py-8">
            <SkeletonCard />
          </main>
        </div>
      </div>
    )
  }

  const hasBadge = freelancer?.status === 'APPROVED' && freelancer?.badgeLevel
  const wasRejected = !!freelancer?.rejectedTestLevel
  const canTakeHigher = !!availableLevels.higher
  const canTakeLower = availableLevels.lower.length > 0
  const noTestsAvailable = !canTakeHigher && !canTakeLower && hasBadge && freelancer?.badgeLevel === 'HIGH'

  return (
    <div className="flex h-screen bg-background">
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

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title="Take Skill Test"
          subtitle="Choose your test level"
          user={{
            name: freelancer?.fullName || 'Freelancer',
            email: freelancer?.email,
          }}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="container-custom py-8 space-y-8">
            {/* Current Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Current Status</CardTitle>
                <CardDescription>Your badge and test eligibility information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasBadge ? (
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Current Badge: {freelancer.badgeLevel}</p>
                      <p className="text-sm text-muted-foreground">
                        You have an approved {freelancer.badgeLevel} level badge
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {freelancer.badgeLevel}
                    </Badge>
                  </div>
                ) : wasRejected ? (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium">Rejected at {freelancer.rejectedTestLevel} Level</p>
                      <p className="text-sm text-muted-foreground">
                        You can retake the test at a lower level
                      </p>
                    </div>
                    <Badge variant="error" className="ml-auto">
                      REJECTED
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">No Badge Yet</p>
                      <p className="text-sm text-muted-foreground">
                        Take a test to get started and earn your first badge
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Higher Level Test */}
            {canTakeHigher && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-5 w-5 text-green-600" />
                    <CardTitle>Take Higher Level Test</CardTitle>
                  </div>
                  <CardDescription>
                    Progress to the next badge level
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {availableLevels.higher} Level Test
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {getLevelLabel(availableLevels.higher!)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getLevelDescription(availableLevels.higher!)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleTakeTest(availableLevels.higher!)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <ArrowUp className="mr-2 h-4 w-4" />
                    Take {availableLevels.higher} Level Test
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Lower Level Tests */}
            {canTakeLower && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-5 w-5 text-blue-600" />
                    <CardTitle>Retake at Lower Level</CardTitle>
                  </div>
                  <CardDescription>
                    You can retake the test at these lower levels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availableLevels.lower.map((level) => (
                    <div key={level} className="p-4 bg-white rounded-lg border">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            {level} Level Test
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {getLevelLabel(level)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getLevelDescription(level)}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleTakeTest(level)}
                        variant="outline"
                        className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                        size="lg"
                      >
                        <ArrowDown className="mr-2 h-4 w-4" />
                        Take {level} Level Test
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* No Tests Available */}
            {noTestsAvailable && (
              <Card className="border-2 border-gray-200 bg-gray-50">
                <CardHeader>
                  <CardTitle>Maximum Level Reached</CardTitle>
                  <CardDescription>You have achieved the highest badge level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg">
                    <Award className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="font-semibold">Congratulations!</p>
                      <p className="text-sm text-muted-foreground">
                        You have reached the HIGH badge level. No further tests are available.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* New Freelancer - Show All Levels */}
            {!hasBadge && !wasRejected && !noTestsAvailable && (
              <Card className="border-2 border-primary-200 bg-primary-50">
                <CardHeader>
                  <CardTitle>Get Started with Your First Test</CardTitle>
                  <CardDescription>Choose a test level to begin your journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['LOW', 'MEDIUM', 'HIGH'].map((level) => (
                    <div key={level} className="p-4 bg-white rounded-lg border">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            {level} Level Test
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {getLevelLabel(level)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getLevelDescription(level)}
                          </p>
                        </div>
                        <Badge variant="outline">{level}</Badge>
                      </div>
                      <Button
                        onClick={() => handleTakeTest(level)}
                        className="w-full"
                        size="lg"
                      >
                        Take {level} Level Test
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
