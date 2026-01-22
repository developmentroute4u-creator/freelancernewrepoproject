'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import LogoutButton from '@/components/LogoutButton';
import api from '@/lib/api';

export default function FreelancerDashboard() {
  const [freelancer, setFreelancer] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [testSubmissions, setTestSubmissions] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [freelancerRes, projectsRes, submissionsRes, invitationsRes] = await Promise.all([
        api.get('/freelancers/me'),
        api.get('/projects'),
        api.get('/freelancers/tests/submissions'),
        api.get('/invitations/freelancer/me').catch((err) => {
          console.error('Error loading invitations:', err);
          return { data: [] };
        }),
      ]);

      setFreelancer(freelancerRes.data);
      setProjects(projectsRes.data);
      setTestSubmissions(submissionsRes.data);
      setInvitations(invitationsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Get rejected tests that can be retested
  const getRejectedTestsForRetest = () => {
    if (!testSubmissions || testSubmissions.length === 0) return [];

    const rejectedTests = testSubmissions.filter((s: any) => s.rejected === true);

    return rejectedTests.map((submission: any) => ({
      submissionId: submission._id,
      testId: submission.testId?._id,
      level: submission.testId?.testLevel,
      name: submission.testId?.title || 'Test Submission',
      field: submission.testId?.field || freelancer?.education?.field || 'General',
      innerFields: submission.testId?.innerFields || [],
      rejectionFeedback: submission.rejectionFeedback,
    }));
  };

  // Determine which test levels are available for new tests
  const getAvailableTestLevels = () => {
    if (!freelancer || !testSubmissions || testSubmissions.length === 0) {
      // If no tests taken yet, can take any level
      if (!freelancer?.badgeLevel) {
        return [
          { level: 'HIGH', name: 'HIGH Level Test', field: freelancer?.education?.field || 'General' },
          { level: 'MEDIUM', name: 'MEDIUM Level Test', field: freelancer?.education?.field || 'General' },
          { level: 'LOW', name: 'LOW Level Test', field: freelancer?.education?.field || 'General' }
        ];
      }
      return [];
    }

    // Check each test submission individually
    const passedTests = testSubmissions.filter((s: any) => s.status === 'REVIEWED' && !s.rejected);
    const rejectedTests = testSubmissions.filter((s: any) => s.rejected === true);

    // Get the highest level test that was passed
    const passedLevels = passedTests
      .map((s: any) => s.testId?.testLevel)
      .filter(Boolean)
      .sort((a: string, b: string) => {
        const priority = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (priority[b as keyof typeof priority] || 0) - (priority[a as keyof typeof priority] || 0);
      });
    const highestPassedLevel = passedLevels[0];

    // Get all rejected test levels
    const rejectedLevels = rejectedTests
      .map((s: any) => s.testId?.testLevel)
      .filter(Boolean);

    const availableTests: Array<{ level: string; name: string; field: string; testId?: string }> = [];

    // If freelancer has an approved badge, they can upgrade
    if (freelancer.status === 'APPROVED' && freelancer.badgeLevel) {
      const currentBadgeLevel = freelancer.badgeLevel;
      if (currentBadgeLevel === 'LOW') {
        availableTests.push(
          { level: 'MEDIUM', name: 'MEDIUM Level Test', field: freelancer.education?.field || 'General' },
          { level: 'HIGH', name: 'HIGH Level Test', field: freelancer.education?.field || 'General' }
        );
      } else if (currentBadgeLevel === 'MEDIUM') {
        availableTests.push(
          { level: 'HIGH', name: 'HIGH Level Test', field: freelancer.education?.field || 'General' }
        );
      }
      // If HIGH, no upgrade available
    } else {
      // If no approved badge, check rejected tests to determine what's available
      if (rejectedLevels.length > 0) {
        // Find the highest rejected level
        const rejectedLevelsSorted = rejectedLevels.sort((a: string, b: string) => {
          const priority = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (priority[b as keyof typeof priority] || 0) - (priority[a as keyof typeof priority] || 0);
        });
        const highestRejectedLevel = rejectedLevelsSorted[0];

        // Can retake at lower levels
        if (highestRejectedLevel === 'HIGH') {
          availableTests.push(
            { level: 'MEDIUM', name: 'MEDIUM Level Test', field: freelancer.education?.field || 'General' },
            { level: 'LOW', name: 'LOW Level Test', field: freelancer.education?.field || 'General' }
          );
        } else if (highestRejectedLevel === 'MEDIUM') {
          availableTests.push(
            { level: 'LOW', name: 'LOW Level Test', field: freelancer.education?.field || 'General' }
          );
        } else if (highestRejectedLevel === 'LOW') {
          availableTests.push(
            { level: 'LOW', name: 'LOW Level Test', field: freelancer.education?.field || 'General' }
          );
        }
      } else {
        // No rejected tests, can take any level if no badge
        if (!freelancer.badgeLevel) {
          availableTests.push(
            { level: 'HIGH', name: 'HIGH Level Test', field: freelancer.education?.field || 'General' },
            { level: 'MEDIUM', name: 'MEDIUM Level Test', field: freelancer.education?.field || 'General' },
            { level: 'LOW', name: 'LOW Level Test', field: freelancer.education?.field || 'General' }
          );
        }
      }
    }

    // Return available tests with level-based names (not rejected test names)
    // For option 2, we want generic level names, not specific test titles
    return availableTests.map(test => ({
      ...test,
      name: `Take ${test.level} Level Test` // Always use level-based name for new tests
    }));
  };

  const getTestStatus = () => {
    if (!freelancer) return null;

    if (freelancer.status === 'APPROVED' && freelancer.badgeLevel) {
      return {
        type: 'success',
        message: `Verified - ${freelancer.badgeLevel} Badge`,
        description: `Score: ${freelancer.badgeScore}/100`
      };
    }

    if (freelancer.status === 'REJECTED') {
      return {
        type: 'error',
        message: 'Test Rejected',
        description: freelancer.badgeFeedback || 'Please retake the test at a lower level'
      };
    }

    // Check if there's a pending submission
    const pendingSubmission = testSubmissions.find(s => s.status === 'SUBMITTED');
    if (pendingSubmission) {
      return {
        type: 'warning',
        message: 'Under Review',
        description: 'Your test submission is being reviewed by our team'
      };
    }

    return {
      type: 'info',
      message: 'No Test Taken',
      description: 'Take a skill test to get verified'
    };
  };

  if (!freelancer) {
    return <div>Loading...</div>;
  }

  const availableTests = getAvailableTestLevels();
  const rejectedTestsForRetest = getRejectedTestsForRetest();
  const testStatus = getTestStatus();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Freelancer Dashboard</h1>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{freelancer.status}</p>
            {freelancer.badgeLevel && (
              <p className="text-sm text-muted-foreground mt-2">
                Badge: {freelancer.badgeLevel} ({freelancer.badgeScore})
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {projects.filter(p => p.state === 'ACTIVE').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{testSubmissions.length}</p>
          </CardContent>
        </Card>

        <Card className={invitations.filter(inv => inv.status === 'PENDING').length > 0 ? 'border-orange-500 border-2' : ''}>
          <CardHeader>
            <CardTitle>Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {invitations.filter(inv => inv.status === 'PENDING').length}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Pending
            </p>
            {invitations.filter(inv => inv.status === 'PENDING').length > 0 && (
              <Link href="/freelancer/invitations">
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  View Invitations
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Pending Invitations Card */}
        {invitations.filter(inv => inv.status === 'PENDING').length > 0 && (
          <Card className="border-orange-500 border-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Pending Project Invitations</CardTitle>
                  <CardDescription>
                    You have {invitations.filter(inv => inv.status === 'PENDING').length} pending invitation(s)
                  </CardDescription>
                </div>
                <Link href="/freelancer/invitations">
                  <Button>View All Invitations</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invitations
                  .filter(inv => inv.status === 'PENDING')
                  .slice(0, 3)
                  .map((invitation) => (
                    <div key={invitation._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">
                            {invitation.projectId?.clientId?.companyName || 'Client'}
                          </p>
                          {invitation.projectId?.scopeId && (
                            <p className="text-sm text-muted-foreground">
                              {invitation.projectId.scopeId.field}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                      {invitation.projectId?.scopeId?.innerFields && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {invitation.projectId.scopeId.innerFields.slice(0, 3).map((field: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                          {invitation.projectId.scopeId.innerFields.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{invitation.projectId.scopeId.innerFields.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                {invitations.filter(inv => inv.status === 'PENDING').length > 3 && (
                  <div className="text-center">
                    <Link href="/freelancer/invitations">
                      <Button variant="outline">
                        View {invitations.filter(inv => inv.status === 'PENDING').length - 3} more invitation(s)
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Status Card - Show differently when 2+ tests exist */}
        {testSubmissions.length >= 2 ? (
          <Card>
            <CardHeader>
              <CardTitle>All Test Submissions</CardTitle>
              <CardDescription>You have {testSubmissions.length} test submission(s). View details below.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...testSubmissions]
                  .sort((a: any, b: any) => {
                    // Sort by reviewedAt if available, otherwise by submittedAt, most recent first
                    const dateA = a.reviewedAt ? new Date(a.reviewedAt).getTime() : new Date(a.submittedAt || a.createdAt).getTime();
                    const dateB = b.reviewedAt ? new Date(b.reviewedAt).getTime() : new Date(b.submittedAt || b.createdAt).getTime();
                    return dateB - dateA;
                  })
                  .map((submission: any, index: number) => {
                    const isReviewed = submission.status === 'REVIEWED';
                    const isUnderReview = submission.status === 'UNDER_REVIEW' || submission.status === 'SUBMITTED';
                    // Check if this specific test was rejected using the rejected field
                    const isRejected = submission.rejected === true;
                    // Check if this test was passed (reviewed but not rejected)
                    const isPassed = isReviewed && !isRejected;
                    // Check if this is the most recent approved test (not rejected) that contributed to the badge
                    const isMostRecentReviewed = isPassed && freelancer.badgeLevel && index === 0;

                    return (
                      <Card
                        key={submission._id}
                        className={`border-l-4 ${isReviewed ? 'border-l-green-500 bg-green-50/30' :
                          isUnderReview ? 'border-l-yellow-500 bg-yellow-50/30' :
                            isRejected ? 'border-l-red-500 bg-red-50/30' :
                              'border-l-blue-500 bg-blue-50/30'
                          }`}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className={`text-lg ${isRejected ? 'text-red-700' : ''}`}>
                                Test #{index + 1}: {submission.testId?.title || 'Test Submission'}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {submission.testId?.testLevel || 'N/A'} Level Test
                                {submission.testId?.field && ` • ${submission.testId.field}`}
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                isRejected ? 'destructive' :
                                  isPassed ? 'default' :
                                    isUnderReview ? 'secondary' : 'outline'
                              }
                              className={
                                isRejected ? 'bg-red-600 text-white' :
                                  isPassed ? 'bg-green-600 text-white' : ''
                              }
                            >
                              {isRejected ? '❌ FAILED' : isPassed ? '✅ PASSED' : submission.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-muted-foreground">Submitted:</p>
                                <p className="font-medium">
                                  {submission.submittedAt
                                    ? new Date(submission.submittedAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })
                                    : 'N/A'}
                                </p>
                              </div>
                              {submission.reviewedAt && (
                                <div>
                                  <p className="text-muted-foreground">Reviewed:</p>
                                  <p className="font-medium">
                                    {new Date(submission.reviewedAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                              )}
                            </div>

                            {isMostRecentReviewed && freelancer.badgeLevel && (
                              <div className="mt-3 p-3 bg-green-100 rounded border border-green-300">
                                <p className="text-muted-foreground text-xs mb-1">Current Badge Awarded:</p>
                                <p className="font-semibold text-base text-green-900">
                                  {freelancer.badgeLevel} - Score: {freelancer.badgeScore}/100
                                </p>
                              </div>
                            )}

                            {isRejected && (
                              <div className="mt-3 p-3 bg-red-100 rounded border border-red-300">
                                <p className="text-red-900 font-semibold text-sm mb-1">❌ Test Rejected by Admin</p>
                                {submission.rejectionFeedback && (
                                  <p className="text-xs text-red-800 mt-1">{submission.rejectionFeedback}</p>
                                )}
                                <p className="text-xs text-red-700 mt-2">
                                  Please retake the test at a lower level to continue.
                                </p>
                              </div>
                            )}

                            {isPassed && !isMostRecentReviewed && (
                              <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                                <p className="text-green-900 font-semibold text-sm mb-1">✅ Test Passed</p>
                                <p className="text-xs text-green-800">
                                  This test was approved and contributed to your profile
                                </p>
                              </div>
                            )}

                            {submission.testId?.description && (
                              <div className="mt-2">
                                <p className="text-muted-foreground text-xs mb-1">Description:</p>
                                <p className="text-sm">{submission.testId.description}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>

              {(rejectedTestsForRetest.length > 0 || availableTests.length > 0) && (
                <div className="mt-6 pt-6 border-t">
                  <p className="font-semibold text-lg mb-4">Your Options:</p>

                  {/* Option 1: Retest Rejected Tests */}
                  {rejectedTestsForRetest.length > 0 && (
                    <div className="mb-6">
                      <p className="font-medium mb-3 text-base">1. Retest Rejected Tests:</p>
                      <div className="space-y-2">
                        {rejectedTestsForRetest.map((rejectedTest, idx) => (
                          <div key={`retest-${rejectedTest.submissionId}-${idx}`} className="border rounded-lg p-3 bg-yellow-50/50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{rejectedTest.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {rejectedTest.level} Level • {rejectedTest.field}
                                  {rejectedTest.innerFields && rejectedTest.innerFields.length > 0 && (
                                    <span> • {rejectedTest.innerFields.join(', ')}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <Link href={`/freelancer/test?retest=${rejectedTest.testId}`}>
                              <Button className="w-full" variant="outline" size="sm">
                                🔄 Retest This Test
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Option 2: Create New Test */}
                  {availableTests.length > 0 && (
                    <div>
                      <p className="font-medium mb-3 text-base">
                        {rejectedTestsForRetest.length > 0 ? '2. ' : ''}Create New Test with Different Field/Inner Fields:
                      </p>
                      <div className="space-y-2">
                        {availableTests.map((test, idx) => (
                          <Link key={`new-${test.level}-${idx}`} href={`/freelancer/test?level=${test.level}`}>
                            <Button className="w-full" variant={test.level === 'HIGH' ? 'default' : 'outline'}>
                              {test.name || `Take ${test.level} Level Test`}
                              {test.field && test.field !== 'General' && (
                                <span className="ml-2 text-xs opacity-75">({test.field})</span>
                              )}
                            </Button>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Skill Verification Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg mb-4 ${testStatus?.type === 'success' ? 'bg-green-50 border border-green-200' :
                testStatus?.type === 'error' ? 'bg-red-50 border border-red-200' :
                  testStatus?.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-blue-50 border border-blue-200'
                }`}>
                <p className="font-semibold text-lg">{testStatus?.message}</p>
                <p className="text-sm mt-1">{testStatus?.description}</p>
              </div>

              {(rejectedTestsForRetest.length > 0 || availableTests.length > 0) && (
                <div className="space-y-4">
                  <p className="font-semibold text-base">Your Options:</p>

                  {/* Option 1: Retest Rejected Tests */}
                  {rejectedTestsForRetest.length > 0 && (
                    <div>
                      <p className="font-medium mb-3 text-sm">1. Retest Rejected Tests:</p>
                      <div className="space-y-2">
                        {rejectedTestsForRetest.map((rejectedTest, idx) => (
                          <div key={`retest-${rejectedTest.submissionId}-${idx}`} className="border rounded-lg p-3 bg-yellow-50/50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{rejectedTest.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {rejectedTest.level} Level • {rejectedTest.field}
                                  {rejectedTest.innerFields && rejectedTest.innerFields.length > 0 && (
                                    <span> • {rejectedTest.innerFields.join(', ')}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <Link href={`/freelancer/test?retest=${rejectedTest.testId}`}>
                              <Button className="w-full" variant="outline" size="sm">
                                🔄 Retest This Test
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Option 2: Create New Test */}
                  {availableTests.length > 0 && (
                    <div>
                      <p className="font-medium mb-3 text-sm">
                        {rejectedTestsForRetest.length > 0 ? '2. ' : ''}Create New Test with Different Field/Inner Fields:
                      </p>
                      <div className="space-y-2">
                        {availableTests.map((test, idx) => (
                          <Link key={`new-${test.level}-${idx}`} href={`/freelancer/test?level=${test.level}`}>
                            <Button className="w-full" variant={test.level === 'HIGH' ? 'default' : 'outline'}>
                              {test.name || `Take ${test.level} Level Test`}
                              {test.field && test.field !== 'General' && (
                                <span className="ml-2 text-xs opacity-75">({test.field})</span>
                              )}
                            </Button>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Name:</strong> {freelancer.fullName}</p>
              {/* Optional: education.field - try to get from education first, then from test submissions */}
              {(() => {
                const fieldFromEducation = freelancer.education?.field;
                // If not in education, try to get from most recent test submission
                const fieldFromTest = testSubmissions.length > 0
                  ? testSubmissions
                    .sort((a: any, b: any) => {
                      const dateA = new Date(a.submittedAt || a.createdAt).getTime();
                      const dateB = new Date(b.submittedAt || b.createdAt).getTime();
                      return dateB - dateA;
                    })[0]?.testId?.field
                  : null;
                const displayField = fieldFromEducation || fieldFromTest;

                return displayField ? (
                  <p><strong>Field:</strong> {displayField}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Field:</strong> Not provided
                  </p>
                );
              })()}

              {/* Optional: education.innerFields */}
              {freelancer.education?.innerFields && freelancer.education.innerFields.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {freelancer.education.innerFields.slice(0, 6).map((f: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {f}
                    </Badge>
                  ))}
                  {freelancer.education.innerFields.length > 6 && (
                    <Badge variant="secondary" className="text-xs">
                      +{freelancer.education.innerFields.length - 6} more
                    </Badge>
                  )}
                </div>
              )}
              <p><strong>Location:</strong> {freelancer.location}</p>
              <p><strong>Availability:</strong> {freelancer.availability}</p>
              {freelancer.badgeLevel && (
                <>
                  <p><strong>Badge:</strong> {freelancer.badgeLevel}</p>
                  <p><strong>Score:</strong> {typeof freelancer.badgeScore === 'number' ? freelancer.badgeScore : 'N/A'}</p>
                </>
              )}

              {/* See Feedback Button */}
              {(freelancer.badgeFeedback ||
                (freelancer.badgeStrengths && freelancer.badgeStrengths.length > 0) ||
                (freelancer.badgeImprovementAreas && freelancer.badgeImprovementAreas.length > 0) ||
                (testSubmissions.some(s => s.status === 'REVIEWED'))) && (
                  <div className="mt-4 pt-4 border-t">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          See Feedback
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Admin Feedback</DialogTitle>
                          <DialogDescription>
                            All feedback provided by admins after reviewing your test submissions
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 mt-4">
                          {/* Current Badge Feedback */}
                          {freelancer.badgeFeedback && (
                            <div>
                              <h3 className="font-semibold text-lg mb-2">📝 Overall Feedback</h3>
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm whitespace-pre-wrap">{freelancer.badgeFeedback}</p>
                              </div>
                            </div>
                          )}

                          {/* Strengths */}
                          {freelancer.badgeStrengths && freelancer.badgeStrengths.length > 0 && (
                            <div>
                              <h3 className="font-semibold text-lg mb-2">✅ Strengths</h3>
                              <ul className="list-disc list-inside space-y-1">
                                {freelancer.badgeStrengths.map((strength: string, idx: number) => (
                                  <li key={idx} className="text-sm">{strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Improvement Areas */}
                          {freelancer.badgeImprovementAreas && freelancer.badgeImprovementAreas.length > 0 && (
                            <div>
                              <h3 className="font-semibold text-lg mb-2">📈 Areas for Improvement</h3>
                              <ul className="list-disc list-inside space-y-1">
                                {freelancer.badgeImprovementAreas.map((area: string, idx: number) => (
                                  <li key={idx} className="text-sm">{area}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Test Submission Reviews */}
                          {testSubmissions.filter(s => s.status === 'REVIEWED').length > 0 && (
                            <div>
                              <h3 className="font-semibold text-lg mb-3">📋 Test Submission Reviews</h3>
                              <div className="space-y-4">
                                {testSubmissions
                                  .filter(s => s.status === 'REVIEWED')
                                  .map((submission: any) => {
                                    const isRejected = submission.rejected === true;
                                    const isPassed = !isRejected;
                                    return (
                                      <Card
                                        key={submission._id}
                                        className={`border-l-4 ${isRejected ? 'border-l-red-500 bg-red-50/30' : isPassed ? 'border-l-green-500 bg-green-50/30' : 'border-l-blue-500'}`}
                                      >
                                        <CardHeader>
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <CardTitle className={`text-base ${isRejected ? 'text-red-700' : isPassed ? 'text-green-700' : ''}`}>
                                                {submission.testId?.title || 'Test Submission'}
                                              </CardTitle>
                                              <CardDescription>
                                                {submission.testId?.testLevel || 'N/A'} Level Test
                                              </CardDescription>
                                            </div>
                                            <Badge
                                              variant={isRejected ? 'destructive' : isPassed ? 'default' : 'outline'}
                                              className={isRejected ? 'bg-red-600 text-white' : isPassed ? 'bg-green-600 text-white' : ''}
                                            >
                                              {isRejected ? '❌ FAILED' : isPassed ? '✅ PASSED' : submission.status}
                                            </Badge>
                                          </div>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-2 text-sm">
                                            <p>
                                              <strong>Submitted:</strong>{' '}
                                              {new Date(submission.submittedAt).toLocaleDateString()}
                                            </p>
                                            {submission.reviewedAt && (
                                              <p>
                                                <strong>Reviewed:</strong>{' '}
                                                {new Date(submission.reviewedAt).toLocaleDateString()}
                                              </p>
                                            )}
                                            {submission.testId?.field && (
                                              <p>
                                                <strong>Field:</strong> {submission.testId.field}
                                              </p>
                                            )}
                                            {isRejected && (
                                              <div className="mt-3 p-3 bg-red-100 rounded border border-red-300">
                                                <p className="text-red-900 font-semibold text-sm mb-1">❌ Test Rejected by Admin</p>
                                                {submission.rejectionFeedback && (
                                                  <p className="text-xs text-red-800 mt-1">{submission.rejectionFeedback}</p>
                                                )}
                                                <p className="text-xs text-red-700 mt-2">
                                                  Please retake the test at a lower level to continue.
                                                </p>
                                              </div>
                                            )}
                                            {isPassed && (
                                              <div className="mt-3 p-3 bg-green-100 rounded border border-green-300">
                                                <p className="text-green-900 font-semibold text-sm mb-1">✅ Test Passed</p>
                                                <p className="text-xs text-green-800">
                                                  This test was approved and contributed to your profile.
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          {/* No Feedback Message */}
                          {!freelancer.badgeFeedback &&
                            (!freelancer.badgeStrengths || freelancer.badgeStrengths.length === 0) &&
                            (!freelancer.badgeImprovementAreas || freelancer.badgeImprovementAreas.length === 0) &&
                            testSubmissions.filter(s => s.status === 'REVIEWED').length === 0 && (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">No feedback available yet.</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Feedback will appear here after your test submissions are reviewed by an admin.
                                </p>
                              </div>
                            )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
            </div>

            {/* Batch Upgrade Buttons */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-3">Upgrade Badge Level</h3>
              {freelancer.badgeLevel === 'LOW' ? (
                <div className="space-y-2">
                  <Link href={`/freelancer/test?level=MEDIUM`}>
                    <Button variant="outline" className="w-full">
                      Take MEDIUM Level Test
                    </Button>
                  </Link>
                  <Link href={`/freelancer/test?level=HIGH`}>
                    <Button variant="outline" className="w-full">
                      Take HIGH Level Test
                    </Button>
                  </Link>
                </div>
              ) : freelancer.badgeLevel === 'MEDIUM' ? (
                <div>
                  <Link href={`/freelancer/test?level=HIGH`}>
                    <Button variant="outline" className="w-full">
                      Take HIGH Level Test
                    </Button>
                  </Link>
                </div>
              ) : freelancer.badgeLevel === 'HIGH' ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-900">
                    🎉 You are at the highest badge level (HIGH). Congratulations!
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-900">
                    Take a skill test to get a badge level assigned.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-muted-foreground">No projects yet</p>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project._id} className="border rounded p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p><strong>State:</strong> {project.state}</p>
                        <p><strong>Client:</strong> {project.clientId?.companyName}</p>
                        <p><strong>Mode:</strong> {project.accountabilityMode}</p>
                        {project.scopeId && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <strong>Field:</strong> {project.scopeId.field}
                          </p>
                        )}
                      </div>
                      <Link href={`/freelancer/projects/${project._id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}