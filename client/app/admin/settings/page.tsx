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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function AdminSettings() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userInfo, setUserInfo] = useState<any>(null);

    const profileForm = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            email: '',
        },
    });

    const passwordForm = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const { data } = await api.get('/auth/me');
            setUserInfo(data);
            profileForm.reset({
                name: data.name,
                email: data.email,
            });
        } catch (error: any) {
            console.error('Error loading profile:', error);
            alert('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const onSubmitProfile = async (data: ProfileForm) => {
        setSaving(true);
        try {
            await api.patch('/auth/profile', data);
            alert('Profile updated successfully!');
            await loadUserProfile();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            alert(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const onSubmitPassword = async (data: PasswordForm) => {
        setSaving(true);
        try {
            await api.patch('/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            alert('Password changed successfully!');
            passwordForm.reset();
        } catch (error: any) {
            console.error('Error changing password:', error);
            alert(error.response?.data?.error || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.push('/admin/dashboard')}>
                    ← Back to Dashboard
                </Button>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold">Admin Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and preferences
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="system">System Info</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your personal information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                                <div>
                                    <Label>Name *</Label>
                                    <Input
                                        {...profileForm.register('name')}
                                        placeholder="Your Name"
                                    />
                                    {profileForm.formState.errors.name && (
                                        <p className="text-sm text-red-500 mt-1">
                                            {profileForm.formState.errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>Email *</Label>
                                    <Input
                                        {...profileForm.register('email')}
                                        type="email"
                                        placeholder="your.email@example.com"
                                        disabled
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Email cannot be changed for security reasons
                                    </p>
                                    {profileForm.formState.errors.email && (
                                        <p className="text-sm text-red-500 mt-1">
                                            {profileForm.formState.errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => profileForm.reset()}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>
                                Update your password to keep your account secure
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                                <div>
                                    <Label>Current Password *</Label>
                                    <Input
                                        {...passwordForm.register('currentPassword')}
                                        type="password"
                                        placeholder="Enter current password"
                                    />
                                    {passwordForm.formState.errors.currentPassword && (
                                        <p className="text-sm text-red-500 mt-1">
                                            {passwordForm.formState.errors.currentPassword.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>New Password *</Label>
                                    <Input
                                        {...passwordForm.register('newPassword')}
                                        type="password"
                                        placeholder="Enter new password"
                                    />
                                    {passwordForm.formState.errors.newPassword && (
                                        <p className="text-sm text-red-500 mt-1">
                                            {passwordForm.formState.errors.newPassword.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>Confirm New Password *</Label>
                                    <Input
                                        {...passwordForm.register('confirmPassword')}
                                        type="password"
                                        placeholder="Confirm new password"
                                    />
                                    {passwordForm.formState.errors.confirmPassword && (
                                        <p className="text-sm text-red-500 mt-1">
                                            {passwordForm.formState.errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? 'Changing...' : 'Change Password'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => passwordForm.reset()}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="system">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Information</CardTitle>
                            <CardDescription>
                                View your account details and system information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">User ID</p>
                                        <p className="text-sm font-mono">{userInfo?._id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Role</p>
                                        <p className="text-sm font-semibold text-blue-600">{userInfo?.role}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                                        <p className="text-sm">
                                            {userInfo?.isActive ? (
                                                <span className="text-green-600 font-medium">Active</span>
                                            ) : (
                                                <span className="text-red-600 font-medium">Inactive</span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                                        <p className="text-sm">
                                            {userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <p className="text-xs text-muted-foreground">
                                        Last updated: {userInfo?.updatedAt ? new Date(userInfo.updatedAt).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
