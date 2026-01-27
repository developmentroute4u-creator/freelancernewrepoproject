import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User.js';
import { Freelancer, FreelancerStatus } from '../models/Freelancer.js';
import { Test } from '../models/Test.js';
import { TestSubmission } from '../models/TestSubmission.js';
import { generateSkillTest } from '../utils/gemini.js';
import { logAudit, AuditAction } from '../utils/auditLogger.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email,
      password: hashedPassword,
      role,
    });

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    await logAudit({
      action: AuditAction.USER_CREATED,
      userId: user._id.toString(),
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { role, name: user.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register with test (for freelancers)
router.post('/register-with-test', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      fullName,
      mobileNumber,
      location,
      availability,
      education,
      portfolioUrls,
      testLevel,
      testSubmission,
      yearsOfExperience,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (!fullName || !mobileNumber || !location || !availability) {
      return res.status(400).json({ error: 'Full name, mobile number, location, and availability are required' });
    }

    if (!education || !education.universityName || !education.degree) {
      return res.status(400).json({ error: 'Education (university and degree) is required' });
    }

    if (!education.field || !education.innerFields || education.innerFields.length === 0) {
      return res.status(400).json({ error: 'Field and at least one inner field are required' });
    }

    if (!testLevel) {
      return res.status(400).json({ error: 'Test level is required' });
    }

    if (!testSubmission || (!testSubmission.zipFileUrl && !testSubmission.githubRepositoryLink && !testSubmission.figmaLink)) {
      return res.status(400).json({ error: 'Test submission (ZIP, GitHub, or Figma link) is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user account
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email,
      password: hashedPassword,
      role: UserRole.FREELANCER,
    });

    // Create freelancer profile
    const freelancer = await Freelancer.create({
      userId: user._id,
      fullName,
      mobileNumber,
      yearsOfExperience: yearsOfExperience || undefined,
      location,
      availability,
      education: {
        universityName: education.universityName,
        degree: education.degree,
        field: education.field,
        innerFields: education.innerFields,
      },
      portfolioUrls: portfolioUrls || [],
      status: FreelancerStatus.UNDER_REVIEW,
    });

    // Generate test using Gemini
    const generatedTest = await generateSkillTest({
      field: education.field,
      innerFields: education.innerFields,
      testLevel,
    });

    // Create test record
    const test = await Test.create({
      freelancerId: freelancer._id,
      field: education.field,
      innerFields: education.innerFields,
      testLevel,
      title: generatedTest.title,
      description: generatedTest.description,
      instructions: generatedTest.instructions,
      generatedBy: 'GEMINI',
    });

    // Create test submission
    await TestSubmission.create({
      testId: test._id,
      freelancerId: freelancer._id,
      zipFileUrl: testSubmission.zipFileUrl || undefined,
      githubRepositoryLink: testSubmission.githubRepositoryLink || undefined,
      figmaLink: testSubmission.figmaLink || undefined,
      liveWebsiteUrl: testSubmission.liveWebsiteUrl || undefined,
      demoVideoUrl: testSubmission.demoVideoUrl || undefined,
      status: 'SUBMITTED',
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Log audit
    await logAudit({
      action: AuditAction.USER_CREATED,
      userId: user._id.toString(),
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { role: UserRole.FREELANCER, name: user.name, testSubmitted: true },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    await logAudit({
      action: AuditAction.FREELANCER_REGISTERED,
      userId: user._id.toString(),
      entityType: 'Freelancer',
      entityId: freelancer._id.toString(),
      metadata: { field: education.field },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    await logAudit({
      action: AuditAction.TEST_SUBMITTED,
      userId: user._id.toString(),
      entityType: 'TestSubmission',
      entityId: test._id.toString(),
      metadata: { testId: test._id.toString() },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: 'Registration successful! Your test submission is under review.',
    });
  } catch (error: any) {
    console.error('Registration with test error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Generate test (public endpoint for signup)
router.post('/generate-test', async (req, res) => {
  try {
    const { fields, testLevel } = req.body;

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'Fields array is required' });
    }

    if (!testLevel) {
      return res.status(400).json({ error: 'Test level is required' });
    }

    const field = fields[0];
    if (!field.field || !field.innerFields || field.innerFields.length === 0) {
      return res.status(400).json({ error: 'Field and inner fields are required' });
    }

    // Generate test using Gemini
    const generatedTest = await generateSkillTest({
      field: field.field,
      innerFields: field.innerFields,
      testLevel,
    });

    res.json(generatedTest);
  } catch (error: any) {
    console.error('Test generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate test' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
