'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LogoutButton from '@/components/LogoutButton';
import api from '@/lib/api';

export default function ClientDashboard() {
  const [client, setClient] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientRes, projectsRes] = await Promise.all([
        api.get('/clients/me'),
        api.get('/projects'),
      ]);

      setClient(clientRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  if (!client) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Client Dashboard</h1>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{client.companyName}</p>
            <p className="text-sm text-muted-foreground">{client.industry}</p>
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
            <CardTitle>Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{projects.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Actions</h2>
          <div className="flex gap-2">

            <Link href="/client/projects/create">
              <Button>Create Project</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-muted-foreground">No projects yet. Create a project to get started.</p>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => {
                  const hasFreelancer = project.freelancerId && (typeof project.freelancerId === 'object' ? project.freelancerId._id : project.freelancerId);
                  const freelancerName = hasFreelancer && typeof project.freelancerId === 'object' 
                    ? project.freelancerId.fullName 
                    : null;
                  
                  return (
                    <div key={project._id} className="border rounded p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-lg mb-2">{project.name || 'Unnamed Project'}</p>
                          <p><strong>State:</strong> {project.state}</p>
                          {hasFreelancer && freelancerName && (
                            <p><strong>Freelancer:</strong> {freelancerName}</p>
                          )}
                          <p><strong>Mode:</strong> {project.accountabilityMode}</p>
                        </div>
                        <Link href={`/client/projects/${project._id}`}>
                          <Button variant="outline">
                            {hasFreelancer ? 'View Details' : 'Find Freelancer'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
