'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { FIELDS } from '@/lib/fieldConfig';

const settingsSchema = z.object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    industry: z.string().min(1, 'Industry is required'),
    teamSize: z.enum(['1-10', '11-50', '51-200', '200+']),
    contactPersonName: z.string().min(2, 'Contact person name is required'),
    phoneNumber: z.string().min(10, 'Valid phone number is required'),
    typeOfFreelancerNeeded: z.array(z.string()).min(1, 'Select at least one field'),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function ClientSettings() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedFields, setSelectedFields] = useState<string[]>([]);

    const form = useForm<SettingsForm>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            companyName: '',
            industry: '',
            teamSize: '1-10',
            contactPersonName: '',
            phoneNumber: '',
            typeOfFreelancerNeeded: [],
        },
    });

    useEffect(() => {
        loadClientProfile();
    }, []);

    const loadClientProfile = async () => {
        try {
            const { data } = await api.get('/clients/me');
            form.reset({
                companyName: data.companyName,
                industry: data.industry,
                teamSize: data.teamSize,
                contactPersonName: data.contactPersonName,
                phoneNumber: data.phoneNumber,
                typeOfFreelancerNeeded: data.typeOfFreelancerNeeded,
            });
            setSelectedFields(data.typeOfFreelancerNeeded);
        } catch (error: any) {
            console.error('Error loading profile:', error);
            if (error.response?.status === 404) {
                router.push('/client/onboarding');
            }
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: SettingsForm) => {
        setSaving(true);
        try {
            await api.patch('/clients/me', data);
            alert('Settings updated successfully!');
        } catch (error: any) {
            console.error('Error updating settings:', error);
            alert(error.response?.data?.error || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const toggleField = (field: string) => {
        const updated = selectedFields.includes(field)
            ? selectedFields.filter(f => f !== field)
            : [...selectedFields, field];
        setSelectedFields(updated);
        form.setValue('typeOfFreelancerNeeded', updated, { shouldValidate: true });
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <p>Loading settings...</p>
            </div>
        );
    }

    const fieldNames = Object.keys(FIELDS);

    return (
        <div className="container mx-auto py-8 max-w-3xl">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.push('/client/dashboard')}>
                    ← Back to Dashboard
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                        Update your company profile and preferences
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <Label>Company Name *</Label>
                            <Input
                                {...form.register('companyName')}
                                placeholder="Your Company Name"
                            />
                            {form.formState.errors.companyName && (
                                <p className="text-sm text-red-500 mt-1">
                                    {form.formState.errors.companyName.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>Industry *</Label>
                            <Input
                                {...form.register('industry')}
                                placeholder="E.g., Technology, Healthcare, Finance"
                            />
                            {form.formState.errors.industry && (
                                <p className="text-sm text-red-500 mt-1">
                                    {form.formState.errors.industry.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>Team Size *</Label>
                            <Select
                                value={form.watch('teamSize')}
                                onValueChange={(value: any) => form.setValue('teamSize', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1-10">1-10 employees</SelectItem>
                                    <SelectItem value="11-50">11-50 employees</SelectItem>
                                    <SelectItem value="51-200">51-200 employees</SelectItem>
                                    <SelectItem value="200+">200+ employees</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Contact Person Name *</Label>
                            <Input
                                {...form.register('contactPersonName')}
                                placeholder="Full Name"
                            />
                            {form.formState.errors.contactPersonName && (
                                <p className="text-sm text-red-500 mt-1">
                                    {form.formState.errors.contactPersonName.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>Phone Number *</Label>
                            <Input
                                {...form.register('phoneNumber')}
                                placeholder="+91 1234567890"
                            />
                            {form.formState.errors.phoneNumber && (
                                <p className="text-sm text-red-500 mt-1">
                                    {form.formState.errors.phoneNumber.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>Type of Freelancers Needed * (Select all that apply)</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {fieldNames.map((field) => {
                                    const isSelected = selectedFields.includes(field);
                                    return (
                                        <Button
                                            key={field}
                                            type="button"
                                            variant={isSelected ? 'solid' : 'outline'}
                                            size="sm"
                                            className={
                                                isSelected
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                                                    : 'border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700'
                                            }
                                            onClick={() => toggleField(field)}
                                        >
                                            {field}
                                        </Button>
                                    );
                                })}
                            </div>
                            {form.formState.errors.typeOfFreelancerNeeded && (
                                <p className="text-sm text-red-500 mt-1">
                                    {form.formState.errors.typeOfFreelancerNeeded.message}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button type="submit" disabled={saving} className="flex-1">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/client/dashboard')}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
