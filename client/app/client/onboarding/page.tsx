'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/api';
import { FIELDS } from '@/lib/fieldConfig';

const clientOnboardingSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  teamSize: z.string().min(1, 'Team size is required'),
  contactPersonName: z.string().min(1, 'Contact person name is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  typeOfFreelancerNeeded: z.array(z.string()).min(1, 'Select at least one freelancer type'),
});

type ClientOnboardingForm = z.infer<typeof clientOnboardingSchema>;

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'E-commerce',
  'Education',
  'Real Estate',
  'Manufacturing',
  'Retail',
  'Hospitality',
  'Other'
];

const TEAM_SIZES = ['1-10', '11-50', '51-200', '200+'];

export default function ClientOnboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const form = useForm<ClientOnboardingForm>({
    resolver: zodResolver(clientOnboardingSchema),
    defaultValues: {
      typeOfFreelancerNeeded: []
    }
  });

  const onSubmit = async (data: ClientOnboardingForm) => {
    setLoading(true);
    setError('');

    try {
      await api.post('/clients', data);
      router.push('/client/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create client profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (field: string) => {
    const newFields = selectedFields.includes(field)
      ? selectedFields.filter(f => f !== field)
      : [...selectedFields, field];

    setSelectedFields(newFields);
    form.setValue('typeOfFreelancerNeeded', newFields, { shouldValidate: true });
  };

  const fieldNames = Object.keys(FIELDS);

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
          <CardDescription>
            Tell us about your company to help us match you with the right freelancers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                {...form.register('companyName')}
                placeholder="Acme Inc."
              />
              {form.formState.errors.companyName && (
                <p className="text-sm text-red-500 mt-1">{String(form.formState.errors.companyName.message)}</p>
              )}
            </div>

            <div>
              <Label htmlFor="industry">Industry *</Label>
              <Select
                value={form.watch('industry')}
                onValueChange={(value) => form.setValue('industry', value, { shouldValidate: true })}
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.industry && (
                <p className="text-sm text-red-500 mt-1">{String(form.formState.errors.industry.message)}</p>
              )}
            </div>

            <div>
              <Label htmlFor="teamSize">Team Size *</Label>
              <Select
                value={form.watch('teamSize')}
                onValueChange={(value) => form.setValue('teamSize', value, { shouldValidate: true })}
              >
                <SelectTrigger id="teamSize">
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} employees
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.teamSize && (
                <p className="text-sm text-red-500 mt-1">{String(form.formState.errors.teamSize.message)}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contactPersonName">Contact Person Name *</Label>
              <Input
                id="contactPersonName"
                {...form.register('contactPersonName')}
                placeholder="John Doe"
              />
              {form.formState.errors.contactPersonName && (
                <p className="text-sm text-red-500 mt-1">{String(form.formState.errors.contactPersonName.message)}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                {...form.register('phoneNumber')}
                placeholder="+1 (555) 123-4567"
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-sm text-red-500 mt-1">{String(form.formState.errors.phoneNumber.message)}</p>
              )}
            </div>

            <div>
              <Label>Type of Freelancer Needed * (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {fieldNames.map((field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={field}
                      checked={selectedFields.includes(field)}
                      onChange={() => toggleField(field)}
                    />
                    <label
                      htmlFor={field}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {field}
                    </label>
                  </div>
                ))}
              </div>
              {form.formState.errors.typeOfFreelancerNeeded && (
                <p className="text-sm text-red-500 mt-2">{String(form.formState.errors.typeOfFreelancerNeeded.message)}</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating Profile...' : 'Complete Onboarding'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
