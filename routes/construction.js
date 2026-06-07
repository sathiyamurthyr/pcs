// routes/construction.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyMemberToken, verifyAnyToken } = require('../middleware/auth'); // ✅ Added verifyAnyToken

// ============================================
// Generate Request ID: CON-YYYY-XXXXX
// ============================================
async function generateReqId() {
    const year = new Date().getFullYear();
    const prefix = `CON-${year}-`;

    const [rows] = await db.query(
        "SELECT req_id FROM construction_projects WHERE req_id LIKE ? ORDER BY req_id DESC LIMIT 1",
        [`${prefix}%`]
    );

    let nextNum = 1;
    if (rows.length > 0) {
        const lastNum = parseInt(rows[0].req_id.split('-')[2]);
        nextNum = lastNum + 1;
    }

    return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

// ============================================
// POST /api/construction/register
// Create new construction project — MEMBER ONLY
// ============================================
router.post('/register', verifyMemberToken, async (req, res) => {
    try {
        const reqId = await generateReqId();
        const memberId = req.user.memberId || req.user.id || null;

        const {
            project_name, address_line1, address_line2, city,
            state_province, postal_zip, start_date, completion_date,
            project_budget, project_description, first_name, last_name, phone_number
        } = req.body;

        const [result] = await db.query(
            `INSERT INTO construction_projects 
            (req_id, project_name, address_line1, address_line2, city, state_province,
             postal_zip, start_date, completion_date, project_budget, project_description,
             first_name, last_name, phone_number, member_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reqId, project_name, address_line1, address_line2 || null, city,
                state_province, postal_zip, start_date, completion_date,
                project_budget, project_description, first_name, last_name,
                phone_number, memberId, 'pending'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Construction project registered successfully',
            reqId: reqId,
            projectId: result.insertId
        });

    } catch (error) {
        console.error('Construction registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to register project'
        });
    }
});

// ============================================
// GET /api/construction/my-projects
// Get logged-in member's projects — MEMBER ONLY
// ============================================
router.get('/my-projects', verifyMemberToken, async (req, res) => {
    try {
        const memberId = req.user.memberId || req.user.id;

        const [rows] = await db.query(
            `SELECT * FROM construction_projects WHERE member_id = ? ORDER BY created_at DESC`,
            [memberId]
        );

        res.json({
            success: true,
            count: rows.length,
            projects: rows
        });

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// GET /api/construction/project/:reqId
// Get project by Request ID — MEMBER ONLY
// ============================================
router.get('/project/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;

        const [rows] = await db.query(
            `SELECT * FROM construction_projects WHERE req_id = ?`,
            [reqId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            project: rows[0]
        });

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// PUT /api/construction/project/:reqId
// Update project — MEMBER ONLY
// ============================================
router.put('/project/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;

        const [existing] = await db.query(
            `SELECT * FROM construction_projects WHERE req_id = ?`,
            [reqId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const {
            project_name, address_line1, address_line2, city,
            state_province, postal_zip, start_date, completion_date,
            project_budget, project_description, first_name, last_name,
            phone_number, status
        } = req.body;

        await db.query(
            `UPDATE construction_projects SET
                project_name = ?, address_line1 = ?, address_line2 = ?, city = ?,
                state_province = ?, postal_zip = ?, start_date = ?, completion_date = ?,
                project_budget = ?, project_description = ?, first_name = ?, last_name = ?,
                phone_number = ?, status = ?, updated_at = NOW()
             WHERE req_id = ?`,
            [
                project_name, address_line1, address_line2 || null, city,
                state_province, postal_zip, start_date, completion_date,
                project_budget, project_description, first_name, last_name,
                phone_number, status || 'pending', reqId
            ]
        );

        res.json({
            success: true,
            message: 'Project updated successfully',
            reqId: reqId
        });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// DELETE /api/construction/project/:reqId
// Delete project — MEMBER ONLY
// ============================================
router.delete('/project/:reqId', verifyMemberToken, async (req, res) => {
    try {
        const { reqId } = req.params;

        const [rows] = await db.query(
            `SELECT * FROM construction_projects WHERE req_id = ?`,
            [reqId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        await db.query(`DELETE FROM construction_projects WHERE req_id = ?`, [reqId]);

        res.json({ success: true, message: 'Project deleted' });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// GET /api/construction/all (Admin)
// ✅ FIXED: Changed verifyMemberToken to verifyAnyToken
// ============================================
router.get('/all', verifyAnyToken, async (req, res) => {  // ✅ CHANGED HERE
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [projects] = await db.query(
            `SELECT * FROM construction_projects ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM construction_projects`
        );

        res.json({
            success: true,
            projects: projects,
            pagination: {
                page, limit,
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });

    } catch (error) {
        console.error('List error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// ✅ NEW: PUT /api/construction/project/:reqId — Update project status
// ============================================
router.put('/project/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const { status } = req.body;

        const [existing] = await db.query(
            `SELECT * FROM construction_projects WHERE req_id = ?`,
            [reqId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        await db.query(
            `UPDATE construction_projects SET status = ?, updated_at = NOW() WHERE req_id = ?`,
            [status, reqId]
        );

        res.json({
            success: true,
            message: 'Project status updated successfully',
            reqId: reqId,
            status: status
        });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PATCH /api/construction/project/:reqId/status
router.patch('/project/:reqId/status', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const { status } = req.body;
        if (!status) return res.status(400).json({ success: false, message: 'Status required' });
        
        const [existing] = await db.query(`SELECT * FROM construction_projects WHERE req_id = ?`, [reqId]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        
        await db.query(`UPDATE construction_projects SET status = ?, updated_at = NOW() WHERE req_id = ?`, [status, reqId]);
        res.json({ success: true, message: 'Status updated', reqId, status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;