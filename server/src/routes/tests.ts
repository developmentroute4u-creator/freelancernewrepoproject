import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { Test } from '../models/Test.js';
import { TestSubmission } from '../models/TestSubmission.js';

const router = express.Router();

router.use(authenticate);

// Get test by ID
router.get('/:testId', async (req: AuthRequest, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json(test);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get test submission
router.get('/:testId/submission', authorize(UserRole.FREELANCER, UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { testId } = req.params;
    const submission = await TestSubmission.findOne({ testId })
      .populate('testId')
      .populate('reviewedBy', 'email');
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json(submission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
