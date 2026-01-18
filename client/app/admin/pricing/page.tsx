'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { FIELDS } from '@/lib/fieldConfig';

interface PricingRule {
    _id: string;
    field: string;
    innerField: string;
    deliverableType: string;
    depth: string;
    minPrice: number;
    maxPrice: number;
    currency: string;
    isActive: boolean;
    lastUpdated: string;
}

interface PricingMetrics {
    acceptanceRates: {
        LOW: number;
        MEDIUM: number;
        HIGH: number;
    };
    totalProjects: number;
    acceptedProjects: number;
    rejectedProjects: number;
    avgPricePosition: string;
    recentActions: any[];
}

export default function AdminPricingPage() {
    const [rules, setRules] = useState<PricingRule[]>([]);
    const [metrics, setMetrics] = useState<PricingMetrics | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Form state for creating/updating rules
    const [formData, setFormData] = useState({
        field: '',
        innerField: '',
        deliverableType: '',
        depth: 'STANDARD',
        minPrice: '',
        maxPrice: '',
        reasoning: '',
    });

    useEffect(() => {
        loadRules();
        loadMetrics();
    }, []);

    const loadRules = async () => {
        try {
            const { data } = await api.get('/pricing/rules');
            setRules(data);
        } catch (error) {
            console.error('Error loading pricing rules:', error);
        }
    };

    const loadMetrics = async () => {
        try {
            const { data } = await api.get('/pricing/metrics');
            setMetrics(data);
        } catch (error) {
            console.error('Error loading pricing metrics:', error);
        }
    };

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/pricing/rules', {
                field: formData.field,
                innerField: formData.innerField,
                deliverableType: formData.deliverableType,
                depth: formData.depth,
                minPrice: parseFloat(formData.minPrice),
                maxPrice: parseFloat(formData.maxPrice),
            });

            alert('Pricing rule created successfully!');
            setShowCreateForm(false);
            setFormData({
                field: '',
                innerField: '',
                deliverableType: '',
                depth: 'STANDARD',
                minPrice: '',
                maxPrice: '',
                reasoning: '',
            });
            loadRules();
        } catch (error: any) {
            alert(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRule) return;

        if (!formData.reasoning) {
            alert('Please provide a reasoning for this price update');
            return;
        }

        setLoading(true);

        try {
            await api.patch(`/pricing/rules/${selectedRule._id}`, {
                minPrice: parseFloat(formData.minPrice),
                maxPrice: parseFloat(formData.maxPrice),
                reasoning: formData.reasoning,
            });

            alert('Pricing rule updated successfully!');
            setSelectedRule(null);
            setFormData({
                field: '',
                innerField: '',
                deliverableType: '',
                depth: 'STANDARD',
                minPrice: '',
                maxPrice: '',
                reasoning: '',
            });
            loadRules();
        } catch (error: any) {
            alert(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const selectRuleForEdit = (rule: PricingRule) => {
        setSelectedRule(rule);
        setFormData({
            field: rule.field,
            innerField: rule.innerField,
            deliverableType: rule.deliverableType,
            depth: rule.depth,
            minPrice: rule.minPrice.toString(),
            maxPrice: rule.maxPrice.toString(),
            reasoning: '',
        });
        setShowCreateForm(false);
    };

    const fieldNames = Object.keys(FIELDS);
    const selectedFieldSubFields = formData.field ? FIELDS[formData.field as keyof typeof FIELDS] || [] : [];

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Pricing Management</h1>

            <Tabs defaultValue="rules" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="rules">Pricing Rules</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics & Analytics</TabsTrigger>
                </TabsList>

                {/* Pricing Rules Tab */}
                <TabsContent value="rules" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold">Manage Pricing Rules</h2>
                        <Button onClick={() => {
                            setShowCreateForm(!showCreateForm);
                            setSelectedRule(null);
                            setFormData({
                                field: '',
                                innerField: '',
                                deliverableType: '',
                                depth: 'STANDARD',
                                minPrice: '',
                                maxPrice: '',
                                reasoning: '',
                            });
                        }}>
                            {showCreateForm ? 'Cancel' : 'Create New Rule'}
                        </Button>
                    </div>

                    {/* Create/Update Form */}
                    {(showCreateForm || selectedRule) && (
                        <Card className="border-2 border-blue-500">
                            <CardHeader>
                                <CardTitle>{selectedRule ? 'Update Pricing Rule' : 'Create New Pricing Rule'}</CardTitle>
                                <CardDescription>
                                    {selectedRule
                                        ? 'Update price ranges for this work unit. Reasoning is required.'
                                        : 'Define base price ranges for a new work unit'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={selectedRule ? handleUpdateRule : handleCreateRule} className="space-y-4">
                                    {!selectedRule && (
                                        <>
                                            <div>
                                                <Label>Field *</Label>
                                                <Select value={formData.field} onValueChange={(value) => setFormData({ ...formData, field: value, innerField: '' })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select field" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {fieldNames.map((field) => (
                                                            <SelectItem key={field} value={field}>{field}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Inner Field *</Label>
                                                <Select value={formData.innerField} onValueChange={(value) => setFormData({ ...formData, innerField: value })} disabled={!formData.field}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select inner field" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {selectedFieldSubFields.map((subField) => (
                                                            <SelectItem key={subField} value={subField}>{subField}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Deliverable Type *</Label>
                                                <Input
                                                    value={formData.deliverableType}
                                                    onChange={(e) => setFormData({ ...formData, deliverableType: e.target.value })}
                                                    placeholder="e.g., Landing Page, Mobile App, Blog Post"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <Label>Depth Level *</Label>
                                                <Select value={formData.depth} onValueChange={(value) => setFormData({ ...formData, depth: value })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="BASIC">Basic</SelectItem>
                                                        <SelectItem value="STANDARD">Standard</SelectItem>
                                                        <SelectItem value="COMPREHENSIVE">Comprehensive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    )}

                                    {selectedRule && (
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm"><strong>Field:</strong> {selectedRule.field}</p>
                                            <p className="text-sm"><strong>Inner Field:</strong> {selectedRule.innerField}</p>
                                            <p className="text-sm"><strong>Deliverable:</strong> {selectedRule.deliverableType}</p>
                                            <p className="text-sm"><strong>Depth:</strong> {selectedRule.depth}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Minimum Price (₹) *</Label>
                                            <Input
                                                type="number"
                                                value={formData.minPrice}
                                                onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                                                placeholder="e.g., 5000"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Maximum Price (₹) *</Label>
                                            <Input
                                                type="number"
                                                value={formData.maxPrice}
                                                onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
                                                placeholder="e.g., 20000"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {selectedRule && (
                                        <div>
                                            <Label>Reasoning for Update *</Label>
                                            <Input
                                                value={formData.reasoning}
                                                onChange={(e) => setFormData({ ...formData, reasoning: e.target.value })}
                                                placeholder="e.g., Market rate adjustment, inflation correction"
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Reasoning is required for audit trail and affects future projects only
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button type="submit" disabled={loading}>
                                            {loading ? 'Saving...' : (selectedRule ? 'Update Rule' : 'Create Rule')}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => {
                                            setShowCreateForm(false);
                                            setSelectedRule(null);
                                        }}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pricing Rules List */}
                    <div className="grid gap-4">
                        {rules.map((rule) => (
                            <Card key={rule._id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{rule.field} → {rule.innerField}</CardTitle>
                                            <CardDescription>{rule.deliverableType} ({rule.depth})</CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => selectRuleForEdit(rule)}>
                                            Edit Prices
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Min Price</p>
                                            <p className="text-xl font-bold text-green-600">₹{rule.minPrice.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Max Price</p>
                                            <p className="text-xl font-bold text-blue-600">₹{rule.maxPrice.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Status</p>
                                            <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                                                {rule.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Last updated: {new Date(rule.lastUpdated).toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}

                        {rules.length === 0 && (
                            <Card>
                                <CardContent className="text-center py-8">
                                    <p className="text-muted-foreground">No pricing rules found. Create your first rule above.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Metrics Tab */}
                <TabsContent value="metrics" className="space-y-6">
                    <h2 className="text-2xl font-semibold">Pricing Metrics & Analytics</h2>

                    {metrics && (
                        <>
                            {/* Overview Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm">Total Projects</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{metrics.totalProjects}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm">Accepted</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-green-600">{metrics.acceptedProjects}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm">Rejected</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-red-600">{metrics.rejectedProjects}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm">Avg Price Position</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{(parseFloat(metrics.avgPricePosition) * 100).toFixed(0)}%</p>
                                        <p className="text-xs text-muted-foreground">of price range</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Acceptance Rates by Badge Level */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Acceptance Rates by Badge Level</CardTitle>
                                    <CardDescription>Percentage of freelancers who accepted projects by badge tier</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <Badge variant="secondary" className="mb-2">LOW</Badge>
                                            <p className="text-2xl font-bold">{(metrics.acceptanceRates.LOW * 100).toFixed(1)}%</p>
                                        </div>
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <Badge className="mb-2">MEDIUM</Badge>
                                            <p className="text-2xl font-bold">{(metrics.acceptanceRates.MEDIUM * 100).toFixed(1)}%</p>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <Badge variant="default" className="mb-2 bg-green-600">HIGH</Badge>
                                            <p className="text-2xl font-bold">{(metrics.acceptanceRates.HIGH * 100).toFixed(1)}%</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Pricing Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Pricing Actions</CardTitle>
                                    <CardDescription>Latest 10 pricing-related activities</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {metrics.recentActions.slice(0, 10).map((action, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                                <div>
                                                    <p className="text-sm font-medium">{action.action.replace(/_/g, ' ')}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {action.performedBy?.email || 'System'}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(action.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}

                                        {metrics.recentActions.length === 0 && (
                                            <p className="text-center text-muted-foreground py-4">No recent actions</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {!metrics && (
                        <Card>
                            <CardContent className="text-center py-8">
                                <p className="text-muted-foreground">Loading metrics...</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
