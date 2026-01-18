'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { FIELDS } from '@/lib/fieldConfig';

const intentSchema = z.object({
  projectName: z.string().min(3, 'Project name must be at least 3 characters'),
  field: z.string().min(1, 'Field is required'),
  innerFields: z.array(z.string()).min(1, 'Select at least one specialization'),
  goalOfWork: z.string().min(20, 'Please provide a detailed goal (minimum 20 characters)'),
  usageContext: z.string().min(20, 'Please provide usage context (minimum 20 characters)'),
  priority: z.enum(['SPEED', 'QUALITY', 'DEPTH']),
  deadline: z.string().min(1, 'Deadline is required'),
  references: z.string().optional(),
  targetAudience: z.string().min(10, 'Please describe the target audience'),
  existingAssets: z.string().optional(),
  specificRequirements: z.string().optional(),
});

type IntentForm = z.infer<typeof intentSchema>;

interface GeneratedScope {
  _id: string;
  // SOW Structure
  projectOverview?: string;
  inScopeItems?: string[];
  outOfScopeItems?: string[];
  assumptions?: string[];
  deliverables: string[];
  timeline?: string[];
  acceptanceCriteria?: string[];
  // Legacy fields (for backward compatibility)
  inclusions: string[];
  exclusions: string[];
  completionCriteria: string[];
  revisionLimits: number;
  scopeMode: string;
  isLocked: boolean;
  pricing?: {
    finalPrice: number;
    currency: string;
    clientExplanation: string;
    freelancerExplanation: string;
    priceRange?: {
      min: number;
      max: number;
    };
  };
}

function CreateProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const freelancerId = searchParams.get('freelancerId');

  const [step, setStep] = useState<'intent' | 'preview' | 'fullScope' | 'accountability'>('intent');
  const [loading, setLoading] = useState(false);
  const [generatedScope, setGeneratedScope] = useState<GeneratedScope | null>(null);
  const [selectedField, setSelectedField] = useState('');
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [selectedScopeMode, setSelectedScopeMode] = useState<'PLATFORM_SCOPE' | 'OWN_SCOPE' | null>(null);
  const [selectedAccountabilityMode, setSelectedAccountabilityMode] = useState<'ACCOUNTABILITY' | 'BASIC' | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  const form = useForm<IntentForm>({
    resolver: zodResolver(intentSchema),
    defaultValues: {
      projectName: '',
      field: '',
      innerFields: [],
      priority: 'QUALITY',
      goalOfWork: '',
      usageContext: '',
      targetAudience: '',
      deadline: '',
      references: '',
      existingAssets: '',
      specificRequirements: ''
    }
  });

  const onSubmitIntent = async (data: IntentForm) => {
    setLoading(true);
    try {
      // Store project name for later use
      setProjectName(data.projectName);

      const intentAnswers = {
        goalOfWork: data.goalOfWork,
        usageContext: data.usageContext,
        priority: data.priority,
        deadline: new Date(data.deadline),
        references: data.references ? [data.references] : []
      };

      const { data: scope } = await api.post('/scopes/generate', {
        field: data.field,
        innerFields: data.innerFields,
        intentAnswers
      });

      setGeneratedScope(scope);

      // Calculate price after scope is generated
      try {
        const tempProjectId = 'temp_' + Date.now();
        const pricingResponse = await api.post('/pricing/calculate', {
          scopeId: scope._id,
          projectId: tempProjectId,
        });

        console.log('💰 Price calculated:', pricingResponse.data);
        setGeneratedScope({
          ...scope,
          pricing: pricingResponse.data,
        });
      } catch (pricingError) {
        console.error('⚠️ Error calculating price:', pricingError);
      }

      setStep('preview');
    } catch (error: any) {
      console.error('Error generating scope:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to generate scope. Please try again.';
      alert(`Scope Generation Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshScope = async () => {
    if (!generatedScope) return;

    setRefreshLoading(true);
    try {
      const { data: scope } = await api.post(`/scopes/${generatedScope._id}/refresh`);
      setGeneratedScope(scope);
      alert('Scope has been refreshed successfully!');
    } catch (error: any) {
      console.error('Error refreshing scope:', error);
      alert(error.response?.data?.error || 'Failed to refresh scope. Please try again.');
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleUseScope = (scopeMode: 'PLATFORM_SCOPE' | 'OWN_SCOPE') => {
    setSelectedScopeMode(scopeMode);
    setStep('fullScope'); // Show full scope first
  };

  const handleAccountabilitySelection = (mode: 'ACCOUNTABILITY' | 'BASIC') => {
    setSelectedAccountabilityMode(mode);
  };

  const confirmAndLockScope = async () => {
    if (!generatedScope || !selectedScopeMode || !selectedAccountabilityMode || !projectName) {
      alert('Please select accountability mode and provide a project name');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/scopes/${generatedScope._id}/lock`, { scopeMode: selectedScopeMode });

      // Create project
      const { data: project } = await api.post('/projects', {
        name: projectName,
        scopeId: generatedScope._id,
        accountabilityMode: selectedAccountabilityMode
      });

      // Redirect to find freelancer page
      router.push(`/client/projects/${project._id}/find-freelancer`);
    } catch (error) {
      console.error('Error locking scope:', error);
      alert('Failed to lock scope. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldNames = Object.keys(FIELDS);
  const selectedFieldSubFields = selectedField ? FIELDS[selectedField as keyof typeof FIELDS] : [];

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {step === 'intent' && (
        <Card>
          <CardHeader>
            <CardTitle>Project Intent Questions</CardTitle>
            <CardDescription>
              Answer these questions to help us generate a comprehensive project scope
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmitIntent as any)} className="space-y-6">
              <div>
                <Label>Project Name *</Label>
                <Input
                  {...form.register('projectName')}
                  placeholder="E.g., E-commerce Website Redesign"
                />
                {form.formState.errors.projectName && (
                  <p className="text-sm text-red-500 mt-1">{String(form.formState.errors.projectName.message)}</p>
                )}
              </div>

              <div>
                <Label>Field *</Label>
                <Select
                  value={form.watch('field')}
                  onValueChange={(value) => {
                    form.setValue('field', value, { shouldValidate: true });
                    setSelectedField(value);
                    form.setValue('innerFields', []);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldNames.map((field) => (
                      <SelectItem key={field} value={field}>{field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.field && (
                  <p className="text-sm text-red-500 mt-1">{String(form.formState.errors.field.message)}</p>
                )}
              </div>

              {selectedField && (
                <div>
                  <Label>Specializations * (Select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {selectedFieldSubFields.map((subField) => {
                      const isSelected = form.watch('innerFields').includes(subField);
                      return (
                        <Button
                          key={subField}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const current = form.watch('innerFields');
                            const updated = isSelected
                              ? current.filter(f => f !== subField)
                              : [...current, subField];
                            form.setValue('innerFields', updated, { shouldValidate: true });
                          }}
                        >
                          {subField}
                        </Button>
                      );
                    })}
                  </div>
                  {form.formState.errors.innerFields && (
                    <p className="text-sm text-red-500 mt-1">{String(form.formState.errors.innerFields.message)}</p>
                  )}
                </div>
              )}

              <div>
                <Label>What is the primary goal of this project? *</Label>
                <Textarea
                  {...form.register('goalOfWork')}
                  placeholder="E.g., Create a modern e-commerce website to sell handmade products online with integrated payment processing..."
                  rows={4}
                />
                {form.formState.errors.goalOfWork && (
                  <p className="text-sm text-red-500 mt-1">{String(form.formState.errors.goalOfWork.message)}</p>
                )}
              </div>

              <div>
                <Label>How will this work be used? *</Label>
                <Textarea
                  {...form.register('usageContext')}
                  placeholder="E.g., The website will be used by customers to browse products, add to cart, checkout, and track orders..."
                  rows={4}
                />
                {form.formState.errors.usageContext && (
                  <p className="text-sm text-red-500 mt-1">{String(form.formState.errors.usageContext.message)}</p>
                )}
              </div>

              <div>
                <Label>Who is the target audience? *</Label>
                <Textarea
                  {...form.register('targetAudience')}
                  placeholder="E.g., Young professionals aged 25-35 who value sustainability and handmade products..."
                  rows={3}
                />
                {form.formState.errors.targetAudience && (
                  <p className="text-sm text-red-500 mt-1">{String(form.formState.errors.targetAudience.message)}</p>
                )}
              </div>

              <div>
                <Label>Priority *</Label>
                <Select
                  value={form.watch('priority')}
                  onValueChange={(value: any) => form.setValue('priority', value, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SPEED">Speed - Fast delivery with good quality</SelectItem>
                    <SelectItem value="QUALITY">Quality - High quality, take necessary time</SelectItem>
                    <SelectItem value="DEPTH">Depth - Comprehensive and thorough work</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Deadline *</Label>
                <Input
                  type="date"
                  {...form.register('deadline')}
                  min={new Date().toISOString().split('T')[0]}
                />
                {form.formState.errors.deadline && (
                  <p className="text-sm text-red-500 mt-1">{String(form.formState.errors.deadline.message)}</p>
                )}
              </div>

              <div>
                <Label>References (Optional)</Label>
                <Textarea
                  {...form.register('references')}
                  placeholder="Paste URLs or describe reference materials that inspire you..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Existing Assets (Optional)</Label>
                <Textarea
                  {...form.register('existingAssets')}
                  placeholder="E.g., Brand logo, color palette, content, images..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Specific Requirements (Optional)</Label>
                <Textarea
                  {...form.register('specificRequirements')}
                  placeholder="E.g., Must be mobile-responsive, must support payment gateway..."
                  rows={2}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Generating Scope...' : 'Generate Project Scope'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && generatedScope && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Statement of Work (SOW) - Preview</CardTitle>
                  <CardDescription>
                    Preview the scope generated for your project. Select a scope mode to view full details.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleRefreshScope}
                  disabled={refreshLoading}
                  variant="outline"
                  size="sm"
                >
                  {refreshLoading ? 'Refreshing...' : '🔄 Rewrite Scope'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preview - Limited View */}
              {/* Project Overview Preview */}
              {generatedScope.projectOverview && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">📋 Project Overview</h3>
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">{generatedScope.projectOverview}</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">(Preview - Full details will be shown after scope selection)</p>
                </div>
              )}

              {/* Deliverables Preview - First 3 */}
              <div>
                <h3 className="font-semibold text-lg mb-2">📦 Deliverables</h3>
                <ul className="list-disc list-inside space-y-1">
                  {generatedScope.deliverables.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="text-sm">{item}</li>
                  ))}
                  {generatedScope.deliverables.length > 3 && (
                    <li className="text-sm text-muted-foreground italic">
                      ... and {generatedScope.deliverables.length - 3} more items
                    </li>
                  )}
                </ul>
              </div>

              {/* In-Scope Items Preview - First 3 */}
              {(generatedScope.inScopeItems && generatedScope.inScopeItems.length > 0 ? generatedScope.inScopeItems : generatedScope.inclusions) && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">✅ In-Scope Items</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {(generatedScope.inScopeItems || generatedScope.inclusions).slice(0, 3).map((item, idx) => (
                      <li key={idx} className="text-sm">{item}</li>
                    ))}
                    {(generatedScope.inScopeItems || generatedScope.inclusions).length > 3 && (
                      <li className="text-sm text-muted-foreground italic">
                        ... and {(generatedScope.inScopeItems || generatedScope.inclusions).length - 3} more items
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Out-of-Scope Items Preview - First 3 */}
              {(generatedScope.outOfScopeItems && generatedScope.outOfScopeItems.length > 0 ? generatedScope.outOfScopeItems : generatedScope.exclusions) && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">❌ Out-of-Scope Items</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {(generatedScope.outOfScopeItems || generatedScope.exclusions).slice(0, 3).map((item, idx) => (
                      <li key={idx} className="text-sm">{item}</li>
                    ))}
                    {(generatedScope.outOfScopeItems || generatedScope.exclusions).length > 3 && (
                      <li className="text-sm text-muted-foreground italic">
                        ... and {(generatedScope.outOfScopeItems || generatedScope.exclusions).length - 3} more items
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-center text-muted-foreground">
                  Select a scope mode below to view the complete detailed scope
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Display */}
          {generatedScope.pricing && (
            <Card className="border-2 border-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">💰 Estimated Project Price</CardTitle>
                <CardDescription>Based on scope complexity and platform fair pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-green-600">
                    ₹{generatedScope.pricing.finalPrice?.toLocaleString() || 'Calculating...'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Indian Rupees (INR)</p>
                </div>
                {generatedScope.pricing.clientExplanation && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm whitespace-pre-line">{generatedScope.pricing.clientExplanation}</p>
                  </div>
                )}
                <div className="mt-4 text-xs text-center text-muted-foreground">
                  This is a fixed price. Final price confirmed when you select a scope mode.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scope Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Scope Mode</CardTitle>
              <CardDescription>Select how this scope will be managed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 border-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg">Platform Scope (Recommended)</CardTitle>
                    <Badge className="w-fit">Paid</Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">✅ Scope is locked and enforceable</p>
                    <p className="text-sm">✅ Platform resolves disputes</p>
                    <p className="text-sm">✅ Final authority on completion</p>
                    <p className="text-sm">✅ Accountability mode included</p>
                    <Button
                      onClick={() => handleUseScope('PLATFORM_SCOPE')}
                      disabled={loading}
                      className="w-full mt-4"
                    >
                      Use Platform Scope
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Own Scope</CardTitle>
                    <Badge variant="outline" className="w-fit">Free</Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">⚠️ Platform not responsible</p>
                    <p className="text-sm">⚠️ No dispute resolution</p>
                    <p className="text-sm">⚠️ Basic connection only</p>
                    <p className="text-sm">⚠️ You manage everything</p>
                    <Button
                      onClick={() => handleUseScope('OWN_SCOPE')}
                      disabled={loading}
                      variant="outline"
                      className="w-full mt-4"
                    >
                      Use Own Scope
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Button
                onClick={() => setStep('intent')}
                variant="ghost"
                className="w-full"
              >
                ← Back to Edit Intent
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'fullScope' && generatedScope && selectedScopeMode && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Complete Statement of Work (SOW)</CardTitle>
                  <CardDescription>
                    Full detailed scope for your project - {selectedScopeMode === 'PLATFORM_SCOPE' ? 'Platform Scope' : 'Own Scope'}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setStep('preview')}
                  variant="ghost"
                  size="sm"
                >
                  ← Back to Preview
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Full Project Overview */}
              {generatedScope.projectOverview && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">📋 Project Overview</h3>
                  <p className="text-sm whitespace-pre-wrap">{generatedScope.projectOverview}</p>
                </div>
              )}

              {/* Full In-Scope Items */}
              {(generatedScope.inScopeItems && generatedScope.inScopeItems.length > 0 ? generatedScope.inScopeItems : generatedScope.inclusions) && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">✅ In-Scope Items</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {(generatedScope.inScopeItems || generatedScope.inclusions).map((item, idx) => (
                      <li key={idx} className="text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Out-of-Scope Items */}
              {(generatedScope.outOfScopeItems && generatedScope.outOfScopeItems.length > 0 ? generatedScope.outOfScopeItems : generatedScope.exclusions) && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">❌ Out-of-Scope Items</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {(generatedScope.outOfScopeItems || generatedScope.exclusions).map((item, idx) => (
                      <li key={idx} className="text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Assumptions */}
              {generatedScope.assumptions && generatedScope.assumptions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">📝 Assumptions</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {generatedScope.assumptions.map((item, idx) => (
                      <li key={idx} className="text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Deliverables */}
              <div>
                <h3 className="font-semibold text-lg mb-2">📦 Deliverables</h3>
                <ul className="list-disc list-inside space-y-1">
                  {generatedScope.deliverables.map((item, idx) => (
                    <li key={idx} className="text-sm">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Full Timeline */}
              {generatedScope.timeline && generatedScope.timeline.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">📅 Timeline</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {generatedScope.timeline.map((item, idx) => (
                      <li key={idx} className="text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Revision Limits */}
              <div>
                <h3 className="font-semibold text-lg mb-2">🔄 Revision Limits</h3>
                <p className="text-sm">Up to <strong>{generatedScope.revisionLimits}</strong> rounds of revisions included</p>
              </div>

              {/* Full Acceptance Criteria */}
              {(generatedScope.acceptanceCriteria && generatedScope.acceptanceCriteria.length > 0 ? generatedScope.acceptanceCriteria : generatedScope.completionCriteria) && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">🎯 Acceptance Criteria</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {(generatedScope.acceptanceCriteria || generatedScope.completionCriteria).map((item, idx) => (
                      <li key={idx} className="text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confirm and Proceed */}
          <Card>
            <CardHeader>
              <CardTitle>Confirm Scope</CardTitle>
              <CardDescription>
                Review the complete scope above. Click continue to select accountability mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setStep('accountability')}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                Continue to Accountability Mode Selection
              </Button>
              <Button
                onClick={() => setStep('preview')}
                variant="ghost"
                className="w-full"
              >
                ← Back to Preview
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'accountability' && generatedScope && selectedScopeMode && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Select Accountability Mode</CardTitle>
                  <CardDescription>
                    Choose how you want the platform to handle project accountability and dispute resolution
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setStep('fullScope')}
                  variant="ghost"
                  size="sm"
                >
                  ← Back to Scope
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ACCOUNTABILITY Mode - Yes */}
                <Card 
                  className={`border-2 cursor-pointer transition-all ${
                    selectedAccountabilityMode === 'ACCOUNTABILITY' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                  onClick={() => handleAccountabilitySelection('ACCOUNTABILITY')}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Yes - Enable Accountability Mode</CardTitle>
                      {selectedAccountabilityMode === 'ACCOUNTABILITY' && (
                        <Badge className="bg-green-500">Selected</Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="w-fit mt-2">Recommended</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-semibold text-sm mb-2 text-green-700">Benefits for You (Client):</p>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Platform enforces scope compliance</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Automatic dispute resolution support</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Quality assurance and milestone tracking</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Platform acts as final authority on completion</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Protected payments with escrow-like security</span>
                        </li>
                      </ul>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="font-semibold text-sm mb-2 text-green-700">Benefits for Freelancer:</p>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Clear scope boundaries and expectations</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Fair dispute resolution process</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Protected from scope creep</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Guaranteed payment for completed work</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Professional project management support</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* BASIC Mode - No */}
                <Card 
                  className={`border-2 cursor-pointer transition-all ${
                    selectedAccountabilityMode === 'BASIC' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleAccountabilitySelection('BASIC')}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">No - Basic Mode</CardTitle>
                      {selectedAccountabilityMode === 'BASIC' && (
                        <Badge className="bg-blue-500">Selected</Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="w-fit mt-2">Free</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-semibold text-sm mb-2 text-blue-700">Benefits for You (Client):</p>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>No additional platform fees</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Full control over project management</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Direct communication with freelancer</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Flexible scope adjustments</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">⚠️</span>
                          <span>You handle all disputes yourself</span>
                        </li>
                      </ul>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="font-semibold text-sm mb-2 text-blue-700">Benefits for Freelancer:</p>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>More flexibility in work approach</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Direct client relationship</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Faster decision-making process</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span>Less formal process overhead</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">⚠️</span>
                          <span>No platform protection for disputes</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={confirmAndLockScope}
                  disabled={loading || !selectedAccountabilityMode}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Creating Project...' : `Confirm and Create Project`}
                </Button>
                <Button
                  onClick={() => setStep('fullScope')}
                  variant="ghost"
                  className="w-full mt-2"
                >
                  ← Back to Scope
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function CreateProject() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="animate-pulse h-64 bg-muted rounded" />
      </div>
    }>
      <CreateProjectContent />
    </Suspense>
  );
}
