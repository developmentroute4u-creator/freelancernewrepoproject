// Invite freelancers to project
router.post('/:projectId/invite-freelancers', authorize(UserRole.CLIENT), async (req: AuthRequest, res) => {
    try {
        const { projectId } = req.params;
        const { freelancerIds } = req.body;

        if (!Array.isArray(freelancerIds) || freelancerIds.length === 0) {
            return res.status(400).json({ error: 'Please provide at least one freelancer ID' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.freelancerId) {
            return res.status(400).json({ error: 'Project already has an assigned freelancer' });
        }

        // Create invitations
        const invitations = await Promise.all(
            freelancerIds.map(async (freelancerId) => {
                try {
                    return await ProjectInvitation.create({
                        projectId: project._id,
                        freelancerId,
                        status: InvitationStatus.PENDING,
                    });
                } catch (error: any) {
                    if (error.code === 11000) {
                        // Duplicate invitation - freelancer already invited
                        return null;
                    }
                    throw error;
                }
            })
        );

        const createdInvitations = invitations.filter(inv => inv !== null);

        // Update project state
        project.state = ProjectState.PENDING_ACCEPTANCE;
        await project.save();

        console.log(`✅ Sent ${createdInvitations.length} invitations for project ${projectId}`);

        res.json({
            message: `Sent ${createdInvitations.length} invitation(s) successfully`,
            invitations: createdInvitations,
        });
    } catch (error: any) {
        console.error('❌ Error sending invitations:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
