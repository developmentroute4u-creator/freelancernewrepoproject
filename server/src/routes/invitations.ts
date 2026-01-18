import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { ProjectInvitation, InvitationStatus } from '../models/ProjectInvitation.js';
import { Project, ProjectState } from '../models/Project.js';
import { Freelancer } from '../models/Freelancer.js';
import { Scope } from '../models/Scope.js';
import { logAudit, AuditAction } from '../utils/auditLogger.js';
import mongoose from 'mongoose';

const router = express.Router();

router.use(authenticate);

// Get all invitations for logged-in freelancer
router.get('/freelancer/me', authorize(UserRole.FREELANCER), async (req: AuthRequest, res) => {
    try {
        const freelancer = await Freelancer.findOne({ userId: req.userId });
        if (!freelancer) {
            return res.status(404).json({ error: 'Freelancer profile not found' });
        }

        const invitations = await ProjectInvitation.find({
            freelancerId: freelancer._id,
        })
            .populate({
                path: 'projectId',
                populate: [
                    { path: 'clientId' },
                    { path: 'scopeId' }
                ]
            })
            .sort({ createdAt: -1 });

        // Check for expired invitations and update them
        const now = new Date();
        const expiredInvitations = invitations.filter(inv => 
            inv.status === InvitationStatus.PENDING && 
            inv.expiresAt && 
            new Date(inv.expiresAt) < now
        );

        if (expiredInvitations.length > 0) {
            await ProjectInvitation.updateMany(
                { _id: { $in: expiredInvitations.map(inv => inv._id) } },
                { $set: { status: InvitationStatus.EXPIRED } }
            );
            
            // Reload invitations after updating expired ones
            const updatedInvitations = await ProjectInvitation.find({
                freelancerId: freelancer._id,
            })
                .populate({
                    path: 'projectId',
                    populate: [
                        { path: 'clientId' },
                        { path: 'scopeId' }
                    ]
                })
                .sort({ createdAt: -1 });
            
            return res.json(updatedInvitations);
        }

        res.json(invitations);
    } catch (error: any) {
        console.error('❌ Error fetching invitations:', error);
        res.status(500).json({ error: error.message });
    }
});

// Accept invitation
router.post('/:invitationId/accept', authorize(UserRole.FREELANCER), async (req: AuthRequest, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { invitationId } = req.params;

        const freelancer = await Freelancer.findOne({ userId: req.userId });
        if (!freelancer) {
            await session.abortTransaction();
            return res.status(404).json({ error: 'Freelancer profile not found' });
        }

        // Find the invitation
        const invitation = await ProjectInvitation.findById(invitationId).session(session);
        if (!invitation) {
            await session.abortTransaction();
            return res.status(404).json({ error: 'Invitation not found' });
        }

        // Verify this invitation is for the logged-in freelancer
        if (invitation.freelancerId.toString() !== freelancer._id.toString()) {
            await session.abortTransaction();
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Check if invitation is still pending
        if (invitation.status !== InvitationStatus.PENDING) {
            await session.abortTransaction();
            return res.status(400).json({ error: `Invitation is ${invitation.status.toLowerCase()}` });
        }

        // Check if project is still available
        const project = await Project.findById(invitation.projectId).session(session);
        if (!project) {
            await session.abortTransaction();
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.freelancerId) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Project already assigned to another freelancer' });
        }

        console.log('✅ Accepting invitation:', invitationId);

        // Accept this invitation
        invitation.status = InvitationStatus.ACCEPTED;
        invitation.respondedAt = new Date();
        await invitation.save({ session });

        // Assign freelancer to project
        project.freelancerId = freelancer._id;
        project.state = ProjectState.ACTIVE;
        await project.save({ session });

        // Decline all other pending invitations for this project
        await ProjectInvitation.updateMany(
            {
                projectId: project._id,
                _id: { $ne: invitation._id },
                status: InvitationStatus.PENDING,
            },
            {
                $set: {
                    status: InvitationStatus.DECLINED,
                    respondedAt: new Date(),
                },
            },
            { session }
        );

        await logAudit({
            action: AuditAction.PROJECT_UPDATED,
            userId: req.userId!,
            entityType: 'Project',
            entityId: project._id.toString(),
            metadata: { action: 'freelancer_accepted', freelancerId: freelancer._id },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        await session.commitTransaction();

        console.log('✅ Invitation accepted, project assigned');

        res.json({
            message: 'Invitation accepted successfully',
            project,
            invitation,
        });
    } catch (error: any) {
        await session.abortTransaction();
        console.error('❌ Error accepting invitation:', error);
        res.status(500).json({ error: error.message });
    } finally {
        session.endSession();
    }
});

// Reject invitation
router.post('/:invitationId/reject', authorize(UserRole.FREELANCER), async (req: AuthRequest, res) => {
    try {
        const { invitationId } = req.params;

        const freelancer = await Freelancer.findOne({ userId: req.userId });
        if (!freelancer) {
            return res.status(404).json({ error: 'Freelancer profile not found' });
        }

        const invitation = await ProjectInvitation.findById(invitationId);
        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        if (invitation.freelancerId.toString() !== freelancer._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (invitation.status !== InvitationStatus.PENDING) {
            return res.status(400).json({ error: `Invitation is already ${invitation.status.toLowerCase()}` });
        }

        invitation.status = InvitationStatus.DECLINED;
        invitation.respondedAt = new Date();
        await invitation.save();

        console.log('✅ Invitation rejected:', invitationId);

        await logAudit({
            action: AuditAction.PROJECT_UPDATED,
            userId: req.userId!,
            entityType: 'ProjectInvitation',
            entityId: invitation._id.toString(),
            metadata: { action: 'invitation_rejected' },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        res.json({
            message: 'Invitation rejected successfully',
            invitation,
        });
    } catch (error: any) {
        console.error('❌ Error rejecting invitation:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
