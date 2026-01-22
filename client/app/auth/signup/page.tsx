/**
 * SIGN UP PAGE - Premium Design System
 * 
 * Clean registration flow
 * Role selection with visual cards
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Users, Briefcase } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function SignUp() {
  const router = useRouter()
  const [step, setStep] = useState<'role' | 'details'>('role')
  const [role, setRole] = useState<'FREELANCER' | 'CLIENT' | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRoleSelect = (selectedRole: 'FREELANCER' | 'CLIENT') => {
    setRole(selectedRole)
    setStep('details')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/register', {
        ...formData,
        role,
      })
      localStorage.setItem('token', data.token)

      // Redirect based on role
      if (role === 'FREELANCER') {
        router.push('/freelancer/onboarding')
      } else {
        router.push('/client/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-background to-accent-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">Create Account</h1>
          <p className="mt-2 text-neutral-600">Join our professional platform</p>
        </div>

        {step === 'role' ? (
          /* Role Selection */
          <div className="grid gap-6 md:grid-cols-2">
            <Card
              hover
              className="cursor-pointer border-2 transition-all hover:border-primary"
              onClick={() => handleRoleSelect('FREELANCER')}
            >
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                  <Users className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900">Freelancer</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Offer your professional services
                </p>
              </CardContent>
            </Card>

            <Card
              hover
              className="cursor-pointer border-2 transition-all hover:border-accent"
              onClick={() => handleRoleSelect('CLIENT')}
            >
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-50">
                  <Briefcase className="h-8 w-8 text-accent-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900">Client</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Find verified professionals
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Registration Form */
          <Card>
            <CardHeader>
              <CardTitle>Sign Up as {role === 'FREELANCER' ? 'Freelancer' : 'Client'}</CardTitle>
              <CardDescription>Create your account to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />

                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('role')}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-neutral-600">
                  Already have an account?{' '}
                  <Link href="/auth/signin" className="font-medium text-primary hover:text-primary-600">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-neutral-500">
          Professional Execution Governance Platform
        </p>
      </div>
    </div>
  )
}
