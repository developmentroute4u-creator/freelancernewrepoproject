import { Router } from 'express';
import { FIELDS, getFieldNames, getSubFields } from '../config/fieldConfig.js';

const router = Router();

// GET /api/fields - Get all available fields
router.get('/', (req, res) => {
    try {
        const fieldNames = getFieldNames();
        res.json({
            fields: fieldNames,
            count: fieldNames.length,
        });
    } catch (error) {
        console.error('Error fetching fields:', error);
        res.status(500).json({ error: 'Failed to fetch fields' });
    }
});

// GET /api/fields/:fieldName/subfields - Get sub-fields for a specific field
router.get('/:fieldName/subfields', (req, res) => {
    try {
        const { fieldName } = req.params;
        const subFields = getSubFields(fieldName);

        if (subFields.length === 0) {
            return res.status(404).json({ error: 'Field not found' });
        }

        res.json({
            field: fieldName,
            subFields,
            count: subFields.length,
        });
    } catch (error) {
        console.error('Error fetching sub-fields:', error);
        res.status(500).json({ error: 'Failed to fetch sub-fields' });
    }
});

// GET /api/fields/all - Get all fields with their sub-fields
router.get('/all/complete', (req, res) => {
    try {
        res.json(FIELDS);
    } catch (error) {
        console.error('Error fetching all fields:', error);
        res.status(500).json({ error: 'Failed to fetch all fields' });
    }
});

export default router;
