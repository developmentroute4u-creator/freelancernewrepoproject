'use client';

import { useState, useEffect, Suspense } from 'react';

// Force dynamic rendering to avoid prerender errors with useSearchParams
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { FIELDS } from '@/lib/fieldConfig';

const fieldConfigSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  innerFields: z.array(z.string()).min(1, 'At least one inner field is required'),
});

const testSchema = z.object({
  fields: z.array(fieldConfigSchema).min(1, 'At least one field is required'),
  testLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

// Component for individual test submission
function TestSubmissionForm({ test, onSubmit, isSubmitted }: { test: any; onSubmit: (data: any, testId: string) => void; isSubmitted: boolean }) {
  const submissionForm = useForm({
    defaultValues: {
      zipFileUrl: '',
      githubRepositoryLink: '',
      figmaLink: '',
      liveWebsiteUrl: '',
      demoVideoUrl: '',
    },
  });

  if (isSubmitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submission Received for {test.field}</CardTitle>
          <CardDescription>Your test is under review</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Your Work for {test.field}</CardTitle>
        <CardDescription>Upload your test submission for this field</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submissionForm.handleSubmit((data) => onSubmit(data, test._id))} className="space-y-4">
          <div>
            <Label htmlFor={`zipFileUrl-${test._id}`}>ZIP File URL (Required if no GitHub)</Label>
            <Input
              id={`zipFileUrl-${test._id}`}
              {...submissionForm.register('zipFileUrl')}
              placeholder="https://example.com/submission.zip"
            />
          </div>

          <div>
            <Label htmlFor={`githubRepositoryLink-${test._id}`}>GitHub Repository Link (Required if no ZIP/Figma)</Label>
            <Input
              id={`githubRepositoryLink-${test._id}`}
              {...submissionForm.register('githubRepositoryLink')}
              placeholder="https://github.com/username/repo"
            />
          </div>

          <div>
            <Label htmlFor={`figmaLink-${test._id}`}>Figma Link (Optional)</Label>
            <Input
              id={`figmaLink-${test._id}`}
              {...submissionForm.register('figmaLink')}
              placeholder="https://figma.com/file/..."
            />
          </div>

          <div>
            <Label htmlFor={`liveWebsiteUrl-${test._id}`}>Live Website URL (Optional)</Label>
            <Input
              id={`liveWebsiteUrl-${test._id}`}
              {...submissionForm.register('liveWebsiteUrl')}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <Label htmlFor={`demoVideoUrl-${test._id}`}>Demo Video URL (Optional)</Label>
            <Input
              id={`demoVideoUrl-${test._id}`}
              {...submissionForm.register('demoVideoUrl')}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <Button type="submit">Submit Test for {test.field}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SkillTestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedLevel = searchParams.get('level');
  const retestTestId = searchParams.get('retest');

  const [freelancer, setFreelancer] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fieldInnerFields, setFieldInnerFields] = useState<Record<string, string[]>>({});
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [allowedLevels, setAllowedLevels] = useState<string[]>(['LOW', 'MEDIUM', 'HIGH']);
  const [rejectionMessage, setRejectionMessage] = useState<string>('');
  const [isRetest, setIsRetest] = useState(false);
  const [retestTest, setRetestTest] = useState<any>(null);

  const testForm = useForm({
    resolver: zodResolver(testSchema),
  });

  // Submission forms will be created per test

  // Format text with proper bullet points
  const formatInstructions = (text: string) => {
    if (!text) return text;

    // Replace asterisk bullet points with proper HTML list items
    const lines = text.split('\n');
    let formatted = '';
    let inList = false;

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Check if line starts with asterisk bullet point
      if (trimmedLine.match(/^\*\s*\*\*.*\*\*/)) {
        // Bold bullet point (e.g., * **Scope:** ...)
        const content = trimmedLine.replace(/^\*\s*\*\*(.*)\*\*(.*)/, '<strong>$1</strong>$2');
        formatted += `<li>${content}</li>\n`;
        inList = true;
      } else if (trimmedLine.startsWith('* ')) {
        // Regular bullet point
        const content = trimmedLine.substring(2);
        formatted += `<li>${content}</li>\n`;
        inList = true;
      } else if (trimmedLine.startsWith('🔹')) {
        // Section header
        if (inList) {
          formatted += '</ul>\n';
          inList = false;
        }
        formatted += `<h4 class="font-semibold text-lg mt-4 mb-2 flex items-center"><span class="mr-2">🔹</span>${trimmedLine.substring(2)}</h4>\n`;
      } else if (trimmedLine) {
        if (inList) {
          formatted += '</ul>\n';
          inList = false;
        }
        formatted += `<p class="mb-2">${trimmedLine}</p>\n`;
      } else {
        if (inList) {
          formatted += '</ul>\n';
          inList = false;
        }
        formatted += '<br/>\n';
      }
    });

    if (inList) {
      formatted += '</ul>\n';
    }

    // Wrap list items with ul tags
    formatted = formatted.replace(/(<li>.*<\/li>\n)+/g, (match) => {
      return `<ul class="list-disc list-inside space-y-2 ml-4 mb-4">\n${match}</ul>\n`;
    });

    return formatted;
  };

  // Helper to determine allowed levels based on rejection
  const getAllowedTestLevels = (rejectedLevel: string): string[] => {
    const levels = ['LOW', 'MEDIUM', 'HIGH'];
    const rejectedIndex = levels.indexOf(rejectedLevel);
    if (rejectedIndex !== -1) {
      return levels.slice(0, rejectedIndex);
    }
    return levels; // Should not happen if rejectedLevel is valid
  };

  useEffect(() => {
    const loadFreelancer = async () => {
      try {
        const { data } = await api.get('/freelancers/me');
        setFreelancer(data);

        // Check if this is a retest request
        if (retestTestId) {
          setIsRetest(true);
          try {
            // Load the test to retake
            const { data: testData } = await api.get(`/tests/${retestTestId}`);
            setRetestTest(testData);

            // Pre-populate fields with the test's field and innerFields
            if (testData.field) {
              setSelectedFields([testData.field]);
              setFieldInnerFields({ [testData.field]: testData.innerFields || [] });
              testForm.setValue('fields', [{ field: testData.field, innerFields: testData.innerFields || [] }]);
            }

            // Set the test level
            if (testData.testLevel) {
              testForm.setValue('testLevel', testData.testLevel);
            }
          } catch (error) {
            console.error('Error loading test for retest:', error);
            alert('Error loading test. Please try again.');
            router.push('/freelancer/dashboard');
          }
          return;
        }

        // Check if freelancer was rejected and set allowed levels
        if (data.rejectedTestLevel) {
          const allowed = getAllowedTestLevels(data.rejectedTestLevel);
          setAllowedLevels(allowed);
          setRejectionMessage(`You were rejected at ${data.rejectedTestLevel} level. You can only attempt ${allowed.join(' or ')} level tests.`);
        }

        // Check if basic education info exists (university and degree are still required)
        if (!data.education || !data.education.universityName || !data.education.degree) {
          router.push('/freelancer/onboarding');
          return;
        }

        // Initialize with the freelancer's current field if it exists, otherwise start with empty selection
        if (data.education.field) {
          const initialField = data.education.field;
          const initialInnerFields = data.education.innerFields || [];
          setSelectedFields([initialField]);
          setFieldInnerFields({ [initialField]: initialInnerFields });
          testForm.setValue('fields', [{ field: initialField, innerFields: initialInnerFields }]);
        }
      } catch (error) {
        console.error('Error loading freelancer:', error);
        router.push('/freelancer/onboarding');
      }
    };

    loadFreelancer();
  }, [retestTestId]);

  const toggleField = (field: string) => {
    const wasSelected = selectedFields.includes(field);
    const newSelectedFields = wasSelected
      ? selectedFields.filter(f => f !== field)
      : [...selectedFields, field];

    setSelectedFields(newSelectedFields);

    let newFieldInnerFields = { ...fieldInnerFields };

    if (wasSelected) {
      // Field is being deselected - remove its inner fields
      delete newFieldInnerFields[field];
    } else {
      // Field is being selected - initialize inner fields if not exists
      if (!newFieldInnerFields[field]) {
        newFieldInnerFields[field] = [];
      }
    }

    setFieldInnerFields(newFieldInnerFields);

    // Update form
    const formFields = newSelectedFields.map(f => ({
      field: f,
      innerFields: newFieldInnerFields[f] || [],
    }));
    testForm.setValue('fields', formFields, { shouldValidate: true });
  };

  const toggleInnerField = (field: string, innerField: string) => {
    const currentInnerFields = fieldInnerFields[field] || [];
    const newInnerFields = currentInnerFields.includes(innerField)
      ? currentInnerFields.filter(f => f !== innerField)
      : [...currentInnerFields, innerField];

    const newFieldInnerFields = { ...fieldInnerFields, [field]: newInnerFields };
    setFieldInnerFields(newFieldInnerFields);

    // Update form
    const formFields = selectedFields.map(f => ({
      field: f,
      innerFields: newFieldInnerFields[f] || [],
    }));
    testForm.setValue('fields', formFields, { shouldValidate: true });
  };

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string>('');

  const generateTest = async (data: z.infer<typeof testSchema>) => {
    setGenerateError('');
    setGenerating(true);
    try {
      const { data: testData } = await api.post('/freelancers/tests/generate', data);
      // Backend returns an array of tests
      setTests(Array.isArray(testData) ? testData : [testData]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to generate test';
      setGenerateError(errorMessage);
      console.error('Error generating test:', error.response?.data || error.message);
    } finally {
      setGenerating(false);
    }
  };

  const submitTest = async (data: any, testId: string) => {
    if (!data.zipFileUrl && !data.githubRepositoryLink && !data.figmaLink) {
      alert('ZIP file, GitHub repository link, or Figma link is required');
      return;
    }

    try {
      const { data: submissionData } = await api.post(
        `/freelancers/tests/${testId}/submit`,
        data
      );
      const newSubmissions = { ...submissions, [testId]: submissionData };
      setSubmissions(newSubmissions);
      // Check if all tests are submitted
      if (tests.length > 0 && Object.keys(newSubmissions).length === tests.length) {
        setTimeout(() => {
          router.push('/freelancer/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error submitting test:', error.response?.data || error.message);
    }
  };

  // If retesting, show the test directly
  useEffect(() => {
    if (isRetest && retestTest) {
      setTests([retestTest]);
    }
  }, [isRetest, retestTest]);

  if (!freelancer) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card>
          <CardContent className="py-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!freelancer.education || !freelancer.education.universityName || !freelancer.education.degree) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Education Required</CardTitle>
            <CardDescription>Please complete your education details (university and degree) first</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/freelancer/onboarding')}>
              Go to Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {isRetest && retestTest && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="font-semibold text-yellow-900">🔄 Retesting: {retestTest.title}</p>
          <p className="text-sm text-yellow-800 mt-1">
            You are retaking this test. Please submit your new solution below.
          </p>
        </div>
      )}
      {tests.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Generate Skill Test</CardTitle>
            <CardDescription>Select fields and test level to generate skill assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={testForm.handleSubmit(generateTest as any)} className="space-y-6">
              <div>
                <Label>Select Fields (Select multiple) *</Label>
                <div className="space-y-3 mt-2">
                  {Object.keys(FIELDS).map((field) => (
                    <div key={field} className="border rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`field-${field}`}
                          checked={selectedFields.includes(field)}
                          onChange={() => toggleField(field)}
                        />
                        <Label
                          htmlFor={`field-${field}`}
                          className="font-medium cursor-pointer flex-1"
                        >
                          {field}
                        </Label>
                      </div>
                      {selectedFields.includes(field) && (
                        <div className="mt-3 ml-6 space-y-2">
                          <Label className="text-sm text-muted-foreground">Inner Fields (Select at least one) *</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {FIELDS[field as keyof typeof FIELDS].map((innerField) => (
                              <div key={innerField} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`innerField-${field}-${innerField}`}
                                  checked={(fieldInnerFields[field] || []).includes(innerField)}
                                  onChange={() => toggleInnerField(field, innerField)}
                                />
                                <Label
                                  htmlFor={`innerField-${field}-${innerField}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {innerField}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {selectedFields.includes(field) &&
                            (!fieldInnerFields[field] || fieldInnerFields[field].length === 0) && (
                              <p className="text-sm text-red-500 mt-1">
                                At least one inner field is required for {field}
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {testForm.formState.errors.fields && typeof testForm.formState.errors.fields.message === 'string' && (
                  <p className="text-sm text-red-500 mt-1">{testForm.formState.errors.fields.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="testLevel">Test Level *</Label>
                <Select
                  value={testForm.watch('testLevel')}
                  onValueChange={(value) => testForm.setValue('testLevel', value as any, { shouldValidate: true })}
                >
                  <SelectTrigger id="testLevel">
                    <SelectValue placeholder="Select test level" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedLevels.includes('LOW') && <SelectItem value="LOW">Low - Entry Level (2-4 hours)</SelectItem>}
                    {allowedLevels.includes('MEDIUM') && <SelectItem value="MEDIUM">Medium - Intermediate (4-8 hours)</SelectItem>}
                    {allowedLevels.includes('HIGH') && <SelectItem value="HIGH">High - Advanced (8-16 hours)</SelectItem>}
                  </SelectContent>
                </Select>
                {testForm.formState.errors.testLevel && (
                  <p className="text-sm text-red-500 mt-1">{String(testForm.formState.errors.testLevel.message)}</p>
                )}
                {rejectionMessage && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    ⚠️ {rejectionMessage}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedFields.length > 0
                    ? `${selectedFields.length} test${selectedFields.length > 1 ? 's' : ''} will be generated - one for each selected field.`
                    : 'Select at least one field to generate tests.'}
                </p>
              </div>

              {generateError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                  {generateError}
                </div>
              )}

              <Button type="submit" disabled={generating || selectedFields.length === 0}>
                {generating ? `Generating ${selectedFields.length} Test${selectedFields.length > 1 ? 's' : ''}...` : `Generate ${selectedFields.length > 0 ? selectedFields.length : ''} Test${selectedFields.length > 1 ? 's' : ''}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {tests.map((test, index) => (
            <div key={test._id} className="space-y-6">
              <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <CardTitle className="text-3xl font-bold text-gray-900">
                    Test {index + 1} of {tests.length}: {test.title}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                      {test.testLevel} Level
                    </span>
                    <span className="text-gray-600">
                      Field: <span className="font-semibold">{test.field}</span>
                      {test.innerFields && test.innerFields.length > 0 && (
                        <> • Specializations: <span className="font-semibold">{test.innerFields.join(', ')}</span></>
                      )}
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
                      {test.description}
                    </div>
                  </div>

                  <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center mb-4">
                      <div className="w-1 h-8 bg-gray-600 rounded-full mr-3"></div>
                      <h3 className="font-bold text-xl text-gray-900">Assignment Brief</h3>
                    </div>
                    <div
                      className="text-gray-700 leading-relaxed text-base"
                      dangerouslySetInnerHTML={{ __html: formatInstructions(test.instructions) }}
                    />
                  </div>
                </CardContent>
              </Card>

              <TestSubmissionForm
                test={test}
                onSubmit={submitTest}
                isSubmitted={!!submissions[test._id]}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function SkillTestPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SkillTestPage />
    </Suspense>
  );
}