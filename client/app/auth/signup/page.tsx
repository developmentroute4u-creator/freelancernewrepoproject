'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Users, Briefcase, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { FIELDS } from '@/lib/fieldConfig'

type Step = 'role' | 'details' | 'education' | 'skills' | 'test' | 'portfolio' | 'submitting'

export default function SignUp() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('role')
  const [role, setRole] = useState<'FREELANCER' | 'CLIENT' | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    fullName: '',
    mobileNumber: '',
    location: '',
    availability: '',
    yearsOfExperience: '',
    universityName: '',
    degree: '',
    field: '',
    innerFields: [] as string[],
    portfolioUrls: [''],
    testLevel: 'LOW',
  })

  // Test state
  const [generatedTest, setGeneratedTest] = useState<any>(null)
  const [testSubmission, setTestSubmission] = useState({
    zipFileUrl: '',
    githubRepositoryLink: '',
    figmaLink: '',
    liveWebsiteUrl: '',
    demoVideoUrl: '',
  })
  const [generatingTest, setGeneratingTest] = useState(false)

  const handleRoleSelect = (selectedRole: 'FREELANCER' | 'CLIENT') => {
    setRole(selectedRole)
    setStep('details')
  }

  const handleClientRegister = async () => {
    setError('')
    setLoading(true)

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters long')
      setLoading(false)
      return
    }

    if (!formData.email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { data } = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'CLIENT',
      })
      localStorage.setItem('token', data.token)
      router.push('/client/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const validateBasicDetails = () => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters long')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    if (!formData.fullName.trim()) {
      setError('Full name is required')
      return false
    }
    if (!formData.mobileNumber.trim()) {
      setError('Mobile number is required')
      return false
    }
    if (!formData.location.trim()) {
      setError('Location is required')
      return false
    }
    if (!formData.availability) {
      setError('Availability is required')
      return false
    }
    return true
  }

  const validateEducation = () => {
    if (!formData.universityName.trim()) {
      setError('University name is required')
      return false
    }
    if (!formData.degree.trim()) {
      setError('Degree is required')
      return false
    }
    return true
  }

  const validateSkills = () => {
    if (!formData.field) {
      setError('Please select a field')
      return false
    }
    if (formData.innerFields.length === 0) {
      setError('Please select at least one specialization')
      return false
    }
    return true
  }

  const generateTest = async () => {
    setError('')
    setGeneratingTest(true)
    try {
      const { data } = await api.post('/auth/generate-test', {
        fields: [{
          field: formData.field,
          innerFields: formData.innerFields,
        }],
        testLevel: formData.testLevel,
      })
      setGeneratedTest(data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate test')
    } finally {
      setGeneratingTest(false)
    }
  }

  const validateTestSubmission = () => {
    if (!testSubmission.zipFileUrl && !testSubmission.githubRepositoryLink && !testSubmission.figmaLink) {
      setError('Please provide at least one submission link (ZIP, GitHub, or Figma)')
      return false
    }
    return true
  }

  const handleFinalSubmit = async () => {
    setError('')
    setLoading(true)
    setStep('submitting')

    try {
      const { data } = await api.post('/auth/register-with-test', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        mobileNumber: formData.mobileNumber,
        location: formData.location,
        availability: formData.availability,
        yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined,
        education: {
          universityName: formData.universityName,
          degree: formData.degree,
          field: formData.field,
          innerFields: formData.innerFields,
        },
        portfolioUrls: formData.portfolioUrls.filter(url => url.trim() !== ''),
        testLevel: formData.testLevel,
        testSubmission: {
          zipFileUrl: testSubmission.zipFileUrl || undefined,
          githubRepositoryLink: testSubmission.githubRepositoryLink || undefined,
          figmaLink: testSubmission.figmaLink || undefined,
          liveWebsiteUrl: testSubmission.liveWebsiteUrl || undefined,
          demoVideoUrl: testSubmission.demoVideoUrl || undefined,
        },
      })

      localStorage.setItem('token', data.token)

      // Show success and redirect
      setTimeout(() => {
        router.push('/freelancer/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
      setStep('portfolio') // Go back to portfolio step
      setLoading(false)
    }
  }

  const toggleInnerField = (innerField: string) => {
    setFormData(prev => ({
      ...prev,
      innerFields: prev.innerFields.includes(innerField)
        ? prev.innerFields.filter(f => f !== innerField)
        : [...prev.innerFields, innerField]
    }))
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

  // Format test instructions
  const formatInstructions = (text: string) => {
    if (!text) return text
    const lines = text.split('\n')
    let formatted = ''
    let inList = false

    lines.forEach((line) => {
      const trimmedLine = line.trim()
      if (trimmedLine.match(/^\*\s*\*\*.*\*\*/)) {
        const content = trimmedLine.replace(/^\*\s*\*\*(.*)\*\*(.*)/, '<strong>$1</strong>$2')
        formatted += `<li>${content}</li>\n`
        inList = true
      } else if (trimmedLine.startsWith('* ')) {
        const content = trimmedLine.substring(2)
        formatted += `<li>${content}</li>\n`
        inList = true
      } else if (trimmedLine.startsWith('🔹')) {
        if (inList) {
          formatted += '</ul>\n'
          inList = false
        }
        formatted += `<h4 class="font-semibold text-lg mt-4 mb-2 flex items-center"><span class="mr-2">🔹</span>${trimmedLine.substring(2)}</h4>\n`
      } else if (trimmedLine) {
        if (inList) {
          formatted += '</ul>\n'
          inList = false
        }
        formatted += `<p class="mb-2">${trimmedLine}</p>\n`
      } else {
        if (inList) {
          formatted += '</ul>\n'
          inList = false
        }
        formatted += '<br/>\n'
      }
    })

    if (inList) {
      formatted += '</ul>\n'
    }

    formatted = formatted.replace(/(<li>.*<\/li>\n)+/g, (match) => {
      return `<ul class="list-disc list-inside space-y-2 ml-4 mb-4">\n${match}</ul>\n`
    })

    return formatted
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-background to-accent-50 p-4">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">
            {step === 'role' ? 'Create Account' : role === 'FREELANCER' ? 'Freelancer Registration' : 'Client Registration'}
          </h1>
          {role === 'FREELANCER' && step !== 'role' && step !== 'submitting' && (
            <div className="mt-4 flex justify-center gap-2">
              {['details', 'education', 'skills', 'test', 'portfolio'].map((s, i) => (
                <div
                  key={s}
                  className={`h-2 w-12 rounded-full ${['details', 'education', 'skills', 'test', 'portfolio'].indexOf(step) >= i
                    ? 'bg-primary'
                    : 'bg-neutral-200'
                    }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Role Selection */}
        {step === 'role' && (
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
                  Complete skill test and offer your services
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
        )}

        {/* Client Details */}
        {step === 'details' && role === 'CLIENT' && (
          <Card>
            <CardHeader>
              <CardTitle>Client Registration</CardTitle>
              <CardDescription>Create your account to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleClientRegister(); }} className="space-y-4">
                {error && (
                  <Alert variant="error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>

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
            </CardContent>
          </Card>
        )}

        {/* Freelancer - Basic Details */}
        {step === 'details' && role === 'FREELANCER' && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {error && (
                  <Alert variant="error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name (for account)</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Years of Experience (Optional)</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.yearsOfExperience}
                      onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(value) => setFormData({ ...formData, availability: value })}
                  >
                    <SelectTrigger id="availability">
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full-Time</SelectItem>
                      <SelectItem value="PART_TIME">Part-Time</SelectItem>
                      <SelectItem value="CONTRACT_BASED">Contract-Based</SelectItem>
                      <SelectItem value="HOURLY_BASED">Hourly-Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('role')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      setError('')
                      if (validateBasicDetails()) {
                        setStep('education')
                      }
                    }}
                  >
                    Next: Education
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Freelancer - Education */}
        {step === 'education' && role === 'FREELANCER' && (
          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
              <CardDescription>Your educational background</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {error && (
                  <Alert variant="error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="university">University Name</Label>
                  <Input
                    id="university"
                    value={formData.universityName}
                    onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="degree">Degree</Label>
                  <Input
                    id="degree"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('details')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      setError('')
                      if (validateEducation()) {
                        setStep('skills')
                      }
                    }}
                  >
                    Next: Skills
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Freelancer - Skills Selection */}
        {step === 'skills' && role === 'FREELANCER' && (
          <Card>
            <CardHeader>
              <CardTitle>Skills & Specializations</CardTitle>
              <CardDescription>Select your field and specializations for the skill test</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {error && (
                  <Alert variant="error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="field">Field</Label>
                  <Select
                    value={formData.field}
                    onValueChange={(value) => setFormData({ ...formData, field: value, innerFields: [] })}
                  >
                    <SelectTrigger id="field">
                      <SelectValue placeholder="Select your field" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(FIELDS).map((field) => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.field && (
                  <div>
                    <Label>Specializations (Select at least one)</Label>
                    <div className="mt-2 grid grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4">
                      {FIELDS[formData.field].map((innerField) => (
                        <div key={innerField} className="flex items-center space-x-2">
                          <Checkbox
                            id={`inner-${innerField}`}
                            checked={formData.innerFields.includes(innerField)}
                            onChange={() => toggleInnerField(innerField)}
                          />
                          <Label
                            htmlFor={`inner-${innerField}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {innerField}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="testLevel">Test Difficulty Level</Label>
                  <Select
                    value={formData.testLevel}
                    onValueChange={(value) => setFormData({ ...formData, testLevel: value })}
                  >
                    <SelectTrigger id="testLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low - Entry Level (2-4 hours)</SelectItem>
                      <SelectItem value="MEDIUM">Medium - Intermediate (4-8 hours)</SelectItem>
                      <SelectItem value="HIGH">High - Advanced (8-16 hours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('education')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      setError('')
                      if (validateSkills()) {
                        setStep('test')
                        generateTest()
                      }
                    }}
                  >
                    Generate Test
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Freelancer - Test */}
        {step === 'test' && role === 'FREELANCER' && (
          <div className="space-y-6">
            {generatingTest ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                  <p className="mt-4 text-neutral-600">Generating your skill test...</p>
                </CardContent>
              </Card>
            ) : generatedTest ? (
              <>
                <Card className="border-2">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {generatedTest.title}
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                        {formData.testLevel} Level
                      </span>
                      <span className="text-gray-600">
                        Field: <span className="font-semibold">{formData.field}</span>
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="bg-white border-2 border-blue-100 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <div className="w-1 h-8 bg-blue-600 rounded-full mr-3"></div>
                        <h3 className="font-bold text-xl text-gray-900">Problem Statement</h3>
                      </div>
                      <div className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
                        {generatedTest.description}
                      </div>
                    </div>

                    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <div className="w-1 h-8 bg-gray-600 rounded-full mr-3"></div>
                        <h3 className="font-bold text-xl text-gray-900">Assignment Brief</h3>
                      </div>
                      <div
                        className="text-gray-700 leading-relaxed text-base"
                        dangerouslySetInnerHTML={{ __html: formatInstructions(generatedTest.instructions) }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Submit Your Work</CardTitle>
                    <CardDescription>Upload your test submission</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {error && (
                        <Alert variant="error">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div>
                        <Label htmlFor="zipUrl">ZIP File URL (Required if no GitHub/Figma)</Label>
                        <Input
                          id="zipUrl"
                          value={testSubmission.zipFileUrl}
                          onChange={(e) => setTestSubmission({ ...testSubmission, zipFileUrl: e.target.value })}
                          placeholder="https://example.com/submission.zip"
                        />
                      </div>

                      <div>
                        <Label htmlFor="githubUrl">GitHub Repository Link (Required if no ZIP/Figma)</Label>
                        <Input
                          id="githubUrl"
                          value={testSubmission.githubRepositoryLink}
                          onChange={(e) => setTestSubmission({ ...testSubmission, githubRepositoryLink: e.target.value })}
                          placeholder="https://github.com/username/repo"
                        />
                      </div>

                      <div>
                        <Label htmlFor="figmaUrl">Figma Link (Optional)</Label>
                        <Input
                          id="figmaUrl"
                          value={testSubmission.figmaLink}
                          onChange={(e) => setTestSubmission({ ...testSubmission, figmaLink: e.target.value })}
                          placeholder="https://figma.com/file/..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="liveUrl">Live Website URL (Optional)</Label>
                        <Input
                          id="liveUrl"
                          value={testSubmission.liveWebsiteUrl}
                          onChange={(e) => setTestSubmission({ ...testSubmission, liveWebsiteUrl: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="videoUrl">Demo Video URL (Optional)</Label>
                        <Input
                          id="videoUrl"
                          value={testSubmission.demoVideoUrl}
                          onChange={(e) => setTestSubmission({ ...testSubmission, demoVideoUrl: e.target.value })}
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep('skills')}
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        <Button
                          type="button"
                          className="flex-1"
                          onClick={() => {
                            setError('')
                            if (validateTestSubmission()) {
                              setStep('portfolio')
                            }
                          }}
                        >
                          Next: Portfolio
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-red-600">Failed to generate test. Please try again.</p>
                  <Button className="mt-4" onClick={() => setStep('skills')}>
                    Go Back
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Freelancer - Portfolio */}
        {step === 'portfolio' && role === 'FREELANCER' && (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio (Optional)</CardTitle>
              <CardDescription>Add your portfolio URLs - you can skip this step</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {error && (
                  <Alert variant="error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label>Portfolio URLs</Label>
                  {formData.portfolioUrls.map((url, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        value={url}
                        onChange={(e) => updatePortfolioUrl(index, e.target.value)}
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

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('test')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleFinalSubmit}
                  >
                    Skip Portfolio
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={handleFinalSubmit}
                  >
                    Complete Registration
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submitting */}
        {step === 'submitting' && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
              <p className="mt-4 text-neutral-600">Creating your account and submitting test...</p>
              <p className="mt-2 text-sm text-neutral-500">This may take a moment</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-medium text-primary hover:text-primary-600">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
