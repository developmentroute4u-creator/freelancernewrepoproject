import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { Scope, ScopeMode } from '../models/Scope.js';
import { Project } from '../models/Project.js';
import { generateScope } from '../utils/gemini.js';
import { logAudit, AuditAction } from '../utils/auditLogger.js';

const router = express.Router();

router.use(authenticate);

// Generate scope from intent answers
router.post('/generate', authorize(UserRole.CLIENT), async (req: AuthRequest, res) => {
  try {
    const { field, innerFields, intentAnswers } = req.body;

    // Validate required fields
    if (!field || !innerFields || !Array.isArray(innerFields) || innerFields.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields. Please select a field and at least one specialization.'
      });
    }

    if (!intentAnswers || !intentAnswers.goalOfWork || !intentAnswers.usageContext) {
      return res.status(400).json({
        error: 'Please provide complete intent answers including goal and usage context.'
      });
    }

    console.log('🔄 Generating scope for:', { field, innerFields: innerFields.length });

    // Generate scope using Gemini
    const generatedScope = await generateScope({
      field,
      innerFields,
      intentAnswers,
    });

    // Validate Gemini response
    if (!generatedScope || !generatedScope.deliverables || !generatedScope.inclusions) {
      throw new Error('Invalid scope generated. Please try again.');
    }

    console.log('✅ Scope generated successfully');

    // Flatten assumptions if it's an object (new structure)
    const assumptionsArray = Array.isArray(generatedScope.assumptions)
      ? generatedScope.assumptions
      : [
        ...(generatedScope.assumptions?.technical || []),
        ...(generatedScope.assumptions?.nonTechnical || [])
      ];

    const scope = await Scope.create({
      field,
      innerFields,
      intentAnswers,
      // SOW Structure
      projectOverview: generatedScope.projectOverview,
      inScopeItems: generatedScope.inScopeItems,
      outOfScopeItems: generatedScope.outOfScopeItems,
      assumptions: assumptionsArray,
      deliverables: generatedScope.deliverables,
      timeline: generatedScope.timeline,
      acceptanceCriteria: generatedScope.acceptanceCriteria,
      // Legacy fields (for backward compatibility)
      inclusions: generatedScope.inclusions || generatedScope.inScopeItems,
      exclusions: generatedScope.exclusions || generatedScope.outOfScopeItems,
      completionCriteria: generatedScope.completionCriteria || generatedScope.acceptanceCriteria,
      revisionLimits: generatedScope.revisionLimits,
      scopeMode: ScopeMode.PLATFORM_SCOPE, // Default, can be changed
      isLocked: false,
    });

    console.log('✅ Scope saved to database:', scope._id);

    await logAudit({
      action: AuditAction.SCOPE_CREATED,
      userId: req.userId!,
      entityType: 'Scope',
      entityId: scope._id.toString(),
      metadata: { field },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(scope);
  } catch (error: any) {
    console.error('❌ Scope generation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate scope. Please try again.'
    });
  }
});

// Get scope preview
router.get('/:scopeId/preview', authorize(UserRole.CLIENT, UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { scopeId } = req.params;
    const scope = await Scope.findById(scopeId);

    if (!scope) {
      return res.status(404).json({ error: 'Scope not found' });
    }

    res.json(scope);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Lock scope (after client confirms)
router.post('/:scopeId/lock', authorize(UserRole.CLIENT), async (req: AuthRequest, res) => {
  try {
    const { scopeId } = req.params;
    const { scopeMode } = req.body;

    console.log('🔄 Locking scope:', { scopeId, scopeMode });

    if (!scopeMode) {
      return res.status(400).json({ error: 'scopeMode is required' });
    }

    const scope = await Scope.findById(scopeId);
    if (!scope) {
      console.error('❌ Scope not found:', scopeId);
      return res.status(404).json({ error: 'Scope not found' });
    }

    if (scope.isLocked) {
      // If already locked to the same mode, treat as success
      if (scope.scopeMode === scopeMode) {
        console.log('ℹ️ Scope already locked to this mode, proceeding:', scopeId);
        return res.json(scope);
      }
      console.error('❌ Scope already locked to different mode:', scopeId, { currentMode: scope.scopeMode, requestedMode: scopeMode });
      return res.status(400).json({ error: 'Scope is already locked to a different mode' });
    }

    scope.scopeMode = scopeMode;
    scope.isLocked = true;
    scope.lockedAt = new Date();
    await scope.save();

    console.log('✅ Scope locked successfully:', scopeId);

    await logAudit({
      action: AuditAction.SCOPE_LOCKED,
      userId: req.userId!,
      entityType: 'Scope',
      entityId: scope._id.toString(),
      metadata: { scopeMode },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(scope);
  } catch (error: any) {
    console.error('❌ Scope lock error:', error);
    res.status(500).json({
      error: error.message || 'Failed to lock scope. Please try again.'
    });
  }
});

// Mark scope as paid (for viewing full scope)
router.post('/:scopeId/pay', authorize(UserRole.CLIENT), async (req: AuthRequest, res) => {
  try {
    const { scopeId } = req.params;
    const scope = await Scope.findById(scopeId);

    if (!scope) {
      return res.status(404).json({ error: 'Scope not found' });
    }

    if (scope.isPaid) {
      return res.json(scope);
    }

    // Mark as paid (in a real app, integrate with payment gateway here)
    scope.isPaid = true;
    scope.paidAt = new Date();
    await scope.save();

    await logAudit({
      action: AuditAction.SCOPE_LOCKED, // Reuse action for scope payment
      userId: req.userId!,
      entityType: 'Scope',
      entityId: scope._id.toString(),
      metadata: { action: 'SCOPE_PAID' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(scope);
  } catch (error: any) {
    console.error('❌ Scope payment error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process payment. Please try again.'
    });
  }
});

// Refresh/rewrite scope (regenerate with same intent answers)
router.post('/:scopeId/refresh', authorize(UserRole.CLIENT), async (req: AuthRequest, res) => {
  try {
    const { scopeId } = req.params;
    const scope = await Scope.findById(scopeId);

    if (!scope) {
      return res.status(404).json({ error: 'Scope not found' });
    }

    if (scope.isLocked) {
      return res.status(400).json({ error: 'Cannot refresh locked scope' });
    }

    console.log('🔄 Refreshing scope:', scopeId);

    // Regenerate scope using same intent answers
    const generatedScope = await generateScope({
      field: scope.field,
      innerFields: scope.innerFields,
      intentAnswers: scope.intentAnswers,
    });

    // Validate Gemini response
    if (!generatedScope || !generatedScope.deliverables || !generatedScope.inclusions) {
      throw new Error('Invalid scope generated. Please try again.');
    }

    // Flatten assumptions if it's an object (new structure)
    const assumptionsArray = Array.isArray(generatedScope.assumptions)
      ? generatedScope.assumptions
      : [
        ...(generatedScope.assumptions?.technical || []),
        ...(generatedScope.assumptions?.nonTechnical || [])
      ];

    // Update scope with new generated content (SOW Structure)
    scope.projectOverview = generatedScope.projectOverview;
    scope.inScopeItems = generatedScope.inScopeItems;
    scope.outOfScopeItems = generatedScope.outOfScopeItems;
    scope.assumptions = assumptionsArray;
    scope.deliverables = generatedScope.deliverables;
    scope.timeline = generatedScope.timeline;
    scope.acceptanceCriteria = generatedScope.acceptanceCriteria;
    // Legacy fields (for backward compatibility)
    scope.inclusions = generatedScope.inclusions || generatedScope.inScopeItems;
    scope.exclusions = generatedScope.exclusions || generatedScope.outOfScopeItems;
    scope.completionCriteria = generatedScope.completionCriteria || generatedScope.acceptanceCriteria;
    scope.revisionLimits = generatedScope.revisionLimits;
    scope.isPaid = false; // Reset payment when refreshing
    scope.paidAt = undefined;
    await scope.save();

    console.log('✅ Scope refreshed successfully:', scopeId);

    await logAudit({
      action: AuditAction.SCOPE_CREATED, // Reuse action for scope refresh
      userId: req.userId!,
      entityType: 'Scope',
      entityId: scope._id.toString(),
      metadata: { action: 'SCOPE_REFRESHED' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(scope);
  } catch (error: any) {
    console.error('❌ Scope refresh error:', error);
    res.status(500).json({
      error: error.message || 'Failed to refresh scope. Please try again.'
    });
  }
});

// Get scope by ID
router.get('/:scopeId', async (req: AuthRequest, res) => {
  try {
    const { scopeId } = req.params;
    const scope = await Scope.findById(scopeId);

    if (!scope) {
      return res.status(404).json({ error: 'Scope not found' });
    }

    res.json(scope);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
