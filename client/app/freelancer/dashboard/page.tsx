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

  // Determine which test levels are available based on status
  const getAvailableTestLevels = () => {
    if (!freelancer) return [];

    // If approved, no test needed
    if (freelancer.status === 'APPROVED' && freelancer.badgeLevel) {
      return [];
    }

    // If rejected, determine retake options
    if (freelancer.status === 'REJECTED' && freelancer.rejectedTestLevel) {
      const rejectedLevel = freelancer.rejectedTestLevel;
      if (rejectedLevel === 'HIGH') {
        return ['MEDIUM', 'LOW'];
      } else if (rejectedLevel === 'MEDIUM') {
        return ['LOW'];
      } else if (rejectedLevel === 'LOW') {
        return ['LOW'];
      }
    }

    // If pending or first time, can take any level
    if (freelancer.status === 'PENDING' && !freelancer.badgeLevel) {
      return ['HIGH', 'MEDIUM', 'LOW'];
    }

    return [];
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

        {/* Test Status Card */}
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

            {availableTests.length > 0 && (
              <div className="space-y-3">
                <p className="font-medium">Available Tests:</p>
                {availableTests.map(level => (
                  <Link key={level} href={`/freelancer/test?level=${level}`}>
                    <Button className="w-full" variant={level === 'HIGH' ? 'default' : 'outline'}>
                      Take {level} Level Test
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Name:</strong> {freelancer.fullName}</p>
              <p><strong>Field:</strong> {freelancer.education?.field}</p>
              <p><strong>Location:</strong> {freelancer.location}</p>
              <p><strong>Availability:</strong> {freelancer.availability}</p>
              {freelancer.badgeLevel && (
                <>
                  <p><strong>Badge:</strong> {freelancer.badgeLevel}</p>
                  <p><strong>Score:</strong> {freelancer.badgeScore}</p>
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
                                .map((submission: any) => (
                                  <Card key={submission._id} className="border-l-4 border-l-blue-500">
                                    <CardHeader>
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <CardTitle className="text-base">
                                            {submission.testId?.title || 'Test Submission'}
                                          </CardTitle>
                                          <CardDescription>
                                            {submission.testId?.testLevel || 'N/A'} Level Test
                                          </CardDescription>
                                        </div>
                                        <Badge variant="outline">
                                          {submission.status}
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
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
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
