'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';

// Helper to transform empty/NaN values to undefined for optional number fields
const optionalNumber = z.preprocess(
  (val) => {
    // Handle all empty/NaN cases first
    if (val === '' || val === null || val === undefined) {
      return undefined;
    }
    // Handle NaN
    if (typeof val === 'number' && isNaN(val)) {
      return undefined;
    }
    // Convert string to number
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '') return undefined;
      const num = parseFloat(trimmed);
      return isNaN(num) ? undefined : num;
    }
    // If it's already a valid number, return it
    if (typeof val === 'number') {
      return val >= 0 ? val : undefined;
    }
    return undefined;
  },
  z.union([z.number().min(0), z.undefined()])
);

// Helper for comfort range (must be positive if provided)
const optionalPositiveNumber = z.preprocess(
  (val) => {
    // Handle all empty/NaN cases first
    if (val === '' || val === null || val === undefined) {
      return undefined;
    }
    // Handle NaN
    if (typeof val === 'number' && isNaN(val)) {
      return undefined;
    }
    // Convert string to number
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '') return undefined;
      const num = parseFloat(trimmed);
      return isNaN(num) ? undefined : num;
    }
    // If it's already a valid number, return it (must be positive)
    if (typeof val === 'number') {
      return val > 0 ? val : undefined;
    }
    return undefined;
  },
  z.union([z.number().positive(), z.undefined()])
);

const personalDetailsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  mobileNumber: z.string().min(10, 'Valid mobile number is required'),
  yearsOfExperience: optionalNumber,
  location: z.string().min(1, 'Location is required'),
  expectedComfortRangeMin: optionalPositiveNumber,
  expectedComfortRangeMax: optionalPositiveNumber,
  availability: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT_BASED', 'HOURLY_BASED'], {
    required_error: 'Availability is required',
  }),
}).refine(
  (data) => {
    if (data.expectedComfortRangeMin && data.expectedComfortRangeMax) {
      return data.expectedComfortRangeMin <= data.expectedComfortRangeMax;
    }
    return true;
  },
  {
    message: 'Minimum range must be less than or equal to maximum range',
    path: ['expectedComfortRangeMax'],
  }
);

const educationSchema = z.object({
  universityName: z.string().min(1, 'University name is required'),
  degree: z.string().min(1, 'Degree is required'),
});

const portfolioSchema = z.object({
  portfolioUrls: z.array(z.string().url('Please enter a valid URL')).min(1, 'At least one portfolio URL is required'),
});

export default function FreelancerOnboarding() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('personal');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const personalForm = useForm({
    resolver: zodResolver(personalDetailsSchema),
  });

  const educationForm = useForm({
    resolver: zodResolver(educationSchema),
  });

  const portfolioForm = useForm({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      portfolioUrls: [''],
    },
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/auth/signin');
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (userData.role !== 'FREELANCER') {
        router.push('/');
        return;
      }
    } catch (e) {
      router.push('/auth/signin');
    }

    // Check if profile already exists - if so, redirect to dashboard
    // Since new signup flow includes all data collection, onboarding is no longer needed
    const loadExistingProfile = async () => {
      try {
        const { data: freelancer } = await api.get('/freelancers/me');

        // If profile exists, redirect to dashboard
        if (freelancer) {
          router.push('/freelancer/dashboard');
          return;
        }
      } catch (error: any) {
        // Profile doesn't exist yet, that's okay - user will create it
        if (error.response?.status !== 404) {
          console.error('Error loading profile:', error);
        }
      }
    };

    loadExistingProfile();
  }, [router]);

  const onPersonalSubmit = async (data: z.infer<typeof personalDetailsSchema>) => {
    setError('');
    setLoading(true);
    try {
      // Clean up optional fields - remove undefined, null, or NaN values
      const cleanedData: any = {
        ...data,
        yearsOfExperience: data.yearsOfExperience && !isNaN(data.yearsOfExperience) ? data.yearsOfExperience : undefined,
        expectedComfortRangeMin: data.expectedComfortRangeMin && !isNaN(data.expectedComfortRangeMin) ? data.expectedComfortRangeMin : undefined,
        expectedComfortRangeMax: data.expectedComfortRangeMax && !isNaN(data.expectedComfortRangeMax) ? data.expectedComfortRangeMax : undefined,
      };

      // Remove undefined values from the payload
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined || cleanedData[key] === null || (typeof cleanedData[key] === 'number' && isNaN(cleanedData[key]))) {
          delete cleanedData[key];
        }
      });

      await api.post('/freelancers', cleanedData);
      setActiveTab('education');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save personal details';
      setError(errorMessage);
      console.error('Error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const onEducationSubmit = async (data: z.infer<typeof educationSchema>) => {
    setError('');
    setLoading(true);
    try {
      // Check if profile exists, if not create it with education
      try {
        await api.get('/freelancers/me');
        // Profile exists, update it
        await api.patch('/freelancers/me', {
          education: {
            universityName: data.universityName,
            degree: data.degree,
          },
        });
      } catch (getError: any) {
        // Profile doesn't exist, need to create it first with personal details
        if (getError.response?.status === 404) {
          setError('Please complete Personal Details first');
          setActiveTab('personal');
          setLoading(false);
          return;
        }
        throw getError;
      }
      setActiveTab('portfolio');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save education details';
      setError(errorMessage);
      console.error('Error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const onPortfolioSubmit = async (data: z.infer<typeof portfolioSchema>) => {
    setError('');
    setLoading(true);
    try {
      // Check if profile exists
      try {
        await api.get('/freelancers/me');
        // Profile exists, update it
        const urls = data.portfolioUrls?.filter(url => url.trim() !== '') || [];
        await api.patch('/freelancers/me', {
          portfolioUrls: urls,
        });
        router.push('/freelancer/test');
      } catch (getError: any) {
        // Profile doesn't exist
        if (getError.response?.status === 404) {
          setError('Please complete Personal Details and Education first');
          setActiveTab('personal');
          setLoading(false);
          return;
        }
        throw getError;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save portfolio';
      setError(errorMessage);
      console.error('Error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };


  const addPortfolioUrl = () => {
    const current = portfolioForm.getValues('portfolioUrls') || [];
    portfolioForm.setValue('portfolioUrls', [...current, '']);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Freelancer Onboarding</CardTitle>
          <CardDescription>Complete your profile to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Details</TabsTrigger>
              <TabsTrigger value="education">Skills & Education</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <form onSubmit={personalForm.handleSubmit(onPersonalSubmit as any)} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    {...personalForm.register('fullName')}
                  />
                  {personalForm.formState.errors.fullName && (
                    <p className="text-sm text-red-500">{String(personalForm.formState.errors.fullName.message)}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    {...personalForm.register('mobileNumber')}
                  />
                  {personalForm.formState.errors.mobileNumber && (
                    <p className="text-sm text-red-500">{String(personalForm.formState.errors.mobileNumber.message)}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="yearsOfExperience">Years of Experience (Optional)</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    {...personalForm.register('yearsOfExperience', {
                      setValueAs: (v: any) => {
                        if (v === '' || v === null || v === undefined) return undefined;
                        const num = typeof v === 'string' ? parseFloat(v) : Number(v);
                        return isNaN(num) ? undefined : num;
                      }
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    {...personalForm.register('location')}
                  />
                  {personalForm.formState.errors.location && (
                    <p className="text-sm text-red-500">{String(personalForm.formState.errors.location.message)}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expectedComfortRangeMin">Expected Comfort Range - Min (INR, Optional)</Label>
                    <Input
                      id="expectedComfortRangeMin"
                      type="number"
                      {...personalForm.register('expectedComfortRangeMin', {
                        setValueAs: (v: any) => {
                          if (v === '' || v === null || v === undefined) return undefined;
                          const num = typeof v === 'string' ? parseFloat(v) : Number(v);
                          return isNaN(num) ? undefined : num;
                        }
                      })}
                      placeholder="e.g., 50000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedComfortRangeMax">Expected Comfort Range - Max (INR, Optional)</Label>
                    <Input
                      id="expectedComfortRangeMax"
                      type="number"
                      {...personalForm.register('expectedComfortRangeMax', {
                        setValueAs: (v: any) => {
                          if (v === '' || v === null || v === undefined) return undefined;
                          const num = typeof v === 'string' ? parseFloat(v) : Number(v);
                          return isNaN(num) ? undefined : num;
                        }
                      })}
                      placeholder="e.g., 80000"
                    />
                    {personalForm.formState.errors.expectedComfortRangeMax && (
                      <p className="text-sm text-red-500 mt-1">{String(personalForm.formState.errors.expectedComfortRangeMax.message)}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Internal matching only, not used for bidding</p>

                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <Select
                    value={personalForm.watch('availability')}
                    onValueChange={(value) => personalForm.setValue('availability', value as any, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full-Time</SelectItem>
                      <SelectItem value="PART_TIME">Part-Time</SelectItem>
                      <SelectItem value="CONTRACT_BASED">Contract-Based</SelectItem>
                      <SelectItem value="HOURLY_BASED">Hourly-Based</SelectItem>
                    </SelectContent>
                  </Select>
                  {personalForm.formState.errors.availability && (
                    <p className="text-sm text-red-500">{String(personalForm.formState.errors.availability.message)}</p>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Continue'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="education">
              <form onSubmit={educationForm.handleSubmit(onEducationSubmit as any)} className="space-y-4">
                <div>
                  <Label htmlFor="universityName">University Name</Label>
                  <Input
                    id="universityName"
                    {...educationForm.register('universityName')}
                  />
                  {educationForm.formState.errors.universityName && (
                    <p className="text-sm text-red-500">{String(educationForm.formState.errors.universityName.message)}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="degree">Degree</Label>
                  <Input
                    id="degree"
                    {...educationForm.register('degree')}
                  />
                  {educationForm.formState.errors.degree && (
                    <p className="text-sm text-red-500">{String(educationForm.formState.errors.degree.message)}</p>
                  )}
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Skills will be selected when you generate your skill tests.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Continue'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="portfolio">
              <form onSubmit={portfolioForm.handleSubmit(onPortfolioSubmit)} className="space-y-4">
                <div>
                  <Label>Portfolio URLs</Label>
                  {portfolioForm.watch('portfolioUrls')?.map((url, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        {...portfolioForm.register(`portfolioUrls.${index}`)}
                        placeholder="https://example.com/portfolio"
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPortfolioUrl}
                    className="mt-2"
                  >
                    Add URL
                  </Button>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Continue to Skill Test'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
