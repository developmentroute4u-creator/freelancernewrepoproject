'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sidebar } from '@/components/ui/sidebar'
import { TopBar } from '@/components/ui/topbar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LayoutDashboard, Briefcase, Mail, FileText, Settings } from 'lucide-react'
import api from '@/lib/api'

export default function FreelancerSettingsPage() {
    const router = useRouter()
    const [freelancer, setFreelancer] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        fullName: '',
        mobileNumber: '',
        location: '',
        availability: '',
        portfolioUrls: [''],
    })

    useEffect(() => {
        loadFreelancer()
    }, [])

    const loadFreelancer = async () => {
        try {
            const { data } = await api.get('/freelancers/me')
            setFreelancer(data)
            setFormData({
                fullName: data.fullName || '',
                mobileNumber: data.mobileNumber || '',
                location: data.location || '',
                availability: data.availability || '',
                portfolioUrls: data.portfolioUrls && data.portfolioUrls.length > 0 ? data.portfolioUrls : [''],
            })
        } catch (error) {
            console.error('Error loading freelancer:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setError('')
        setMessage('')
        setSaving(true)

        try {
            await api.patch('/freelancers/me', {
                fullName: formData.fullName,
                mobileNumber: formData.mobileNumber,
                location: formData.location,
                availability: formData.availability,
                portfolioUrls: formData.portfolioUrls.filter(url => url.trim() !== ''),
            })
            setMessage('Settings saved successfully!')
            setTimeout(() => setMessage(''), 3000)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const addPortfolioUrl = () => {
        setFormData(prev => ({
            ...prev,
            portfolioUrls: [...prev.portfolioUrls, '']
        }))
    }

    const updatePortfolioUrl = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            portfolioUrls: prev.portfolioUrls.map((url, i) => i === index ? value : url)
        }))
    }

    const removePortfolioUrl = (index: number) => {
        setFormData(prev => ({
            ...prev,
            portfolioUrls: prev.portfolioUrls.filter((_, i) => i !== index)
        }))
    }

    const navItems = [
        { label: 'Dashboard', href: '/freelancer/dashboard', icon: LayoutDashboard },
        { label: 'Projects', href: '/freelancer/projects', icon: Briefcase },
        { label: 'Invitations', href: '/freelancer/invitations', icon: Mail },
        { label: 'Test', href: '/freelancer/test', icon: FileText },
        { label: 'Settings', href: '/freelancer/settings', icon: Settings },
    ]

    return (
        <div className="flex h-screen">
            <Sidebar
                logo={<div className="text-xl font-bold text-primary">Platform</div>}
                items={navItems}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar
                    title="Settings"
                    user={{
                        name: freelancer?.fullName || 'Freelancer',
                        email: '',
                    }}
                />
                <main className="flex-1 overflow-y-auto">
                    <div className="container-custom py-8 max-w-3xl">
                        {loading ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p>Loading settings...</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {message && (
                                    <Alert>
                                        <AlertDescription>{message}</AlertDescription>
                                    </Alert>
                                )}
                                {error && (
                                    <Alert variant="error">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Profile Information</CardTitle>
                                        <CardDescription>Update your personal details</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="fullName">Full Name</Label>
                                            <Input
                                                id="fullName"
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="mobile">Mobile Number</Label>
                                            <Input
                                                id="mobile"
                                                value={formData.mobileNumber}
                                                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="location">Location</Label>
                                            <Input
                                                id="location"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="availability">Availability</Label>
                                            <Input
                                                id="availability"
                                                value={formData.availability}
                                                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                                                placeholder="e.g., FULL_TIME, PART_TIME"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Portfolio URLs</CardTitle>
                                        <CardDescription>Add links to your portfolio or work samples</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {formData.portfolioUrls.map((url, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Input
                                                    value={url}
                                                    onChange={(e) => updatePortfolioUrl(index, e.target.value)}
                                                    placeholder="https://example.com/portfolio"
                                                />
                                                {formData.portfolioUrls.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => removePortfolioUrl(index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={addPortfolioUrl}
                                        >
                                            Add URL
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Education</CardTitle>
                                        <CardDescription>Your educational background (read-only)</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div>
                                            <p className="text-sm font-medium">University</p>
                                            <p className="text-sm text-muted-foreground">
                                                {freelancer?.education?.universityName || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Degree</p>
                                            <p className="text-sm text-muted-foreground">
                                                {freelancer?.education?.degree || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Field</p>
                                            <p className="text-sm text-muted-foreground">
                                                {freelancer?.education?.field || 'N/A'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex justify-end">
                                    <Button onClick={handleSave} disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
