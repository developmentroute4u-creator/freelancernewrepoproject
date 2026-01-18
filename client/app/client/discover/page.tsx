'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import api from '@/lib/api';
import { FIELDS } from '@/lib/fieldConfig';

interface Freelancer {
  _id: string;
  fullName: string;
  location: string;
  yearsOfExperience?: number;
  badgeLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  badgeScore?: number;
  education?: {
    field: string;
    innerFields: string[];
  };
  portfolioUrls: string[];
}

export default function FreelancerDiscovery() {
  const router = useRouter();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    badgeLevel: '',
    field: '',
    location: '',
    minExperience: 0,
    expectedComfortRangeMin: 0,
    expectedComfortRangeMax: 200000
  });

  useEffect(() => {
    loadFreelancers();
  }, [filters]);

  const loadFreelancers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.badgeLevel) params.badgeLevel = filters.badgeLevel;
      if (filters.field) params.field = filters.field;
      if (filters.location) params.location = filters.location;
      if (filters.minExperience > 0) params.minExperience = filters.minExperience;
      if (filters.expectedComfortRangeMin > 0) params.expectedComfortRangeMin = filters.expectedComfortRangeMin;
      if (filters.expectedComfortRangeMax < 200000) params.expectedComfortRangeMax = filters.expectedComfortRangeMax;
      if (search) params.search = search;

      const { data } = await api.get('/freelancers/discover', { params });
      setFreelancers(data);
    } catch (error) {
      console.error('Error loading freelancers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadFreelancers();
  };

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-purple-500';
      case 'MEDIUM': return 'bg-blue-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const fieldNames = Object.keys(FIELDS);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Freelancers</h1>
        <p className="text-muted-foreground">
          Find skilled freelancers based on their verified badges and expertise
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Badge Level</Label>
                <Select
                  value={filters.badgeLevel || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, badgeLevel: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Field</Label>
                <Select
                  value={filters.field || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, field: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All fields" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All fields</SelectItem>
                    {fieldNames.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Location</Label>
                <Input
                  placeholder="Enter location..."
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                />
              </div>

              <div>
                <Label>Minimum Experience (years)</Label>
                <Input
                  type="number"
                  min="0"
                  value={filters.minExperience}
                  onChange={(e) => setFilters({ ...filters, minExperience: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label>Expected Comfort Range (INR)</Label>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>₹{filters.expectedComfortRangeMin.toLocaleString()}</span>
                    <span>₹{filters.expectedComfortRangeMax.toLocaleString()}</span>
                  </div>
                  <Slider
                    min={0}
                    max={200000}
                    step={10000}
                    value={[filters.expectedComfortRangeMin, filters.expectedComfortRangeMax]}
                    onValueChange={([min, max]) => setFilters({ ...filters, expectedComfortRangeMin: min, expectedComfortRangeMax: max })}
                  />
                </div>
              </div>

              <Button
                onClick={() => setFilters({
                  badgeLevel: '',
                  field: '',
                  location: '',
                  minExperience: 0,
                  expectedComfortRangeMin: 0,
                  expectedComfortRangeMax: 200000
                })}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Freelancers List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading freelancers...</p>
            </div>
          ) : freelancers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No freelancers found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {freelancers.map((freelancer) => (
                <Card key={freelancer._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{freelancer.fullName}</CardTitle>
                        <CardDescription className="mt-1">
                          {freelancer.education?.field} • {freelancer.location}
                        </CardDescription>
                      </div>
                      <Badge className={`${getBadgeColor(freelancer.badgeLevel)} text-white`}>
                        {freelancer.badgeLevel} Badge
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {freelancer.education?.innerFields && freelancer.education.innerFields.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Specializations:</p>
                          <div className="flex flex-wrap gap-1">
                            {freelancer.education.innerFields.map((field, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {freelancer.yearsOfExperience !== undefined && (
                        <p className="text-sm">
                          <span className="font-medium">Experience:</span> {freelancer.yearsOfExperience} years
                        </p>
                      )}

                      {freelancer.badgeScore !== undefined && (
                        <p className="text-sm">
                          <span className="font-medium">Badge Score:</span> {freelancer.badgeScore}/100
                        </p>
                      )}

                      {freelancer.portfolioUrls && freelancer.portfolioUrls.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Portfolio:</p>
                          <div className="flex flex-wrap gap-2">
                            {freelancer.portfolioUrls.slice(0, 3).map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Link {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => router.push(`/client/projects/create?freelancerId=${freelancer._id}`)}
                        className="w-full mt-2"
                      >
                        Create Project with {freelancer.fullName}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
