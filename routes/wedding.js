// routes/wedding.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyMemberToken, verifyAnyToken } = require('../middleware/auth');

// ============================================
// Generate Request ID: WED-YYYY-XXXXX
// ============================================
async function generateReqId() {
    const year = new Date().getFullYear();
    const prefix = `WED-${year}-`;

    const [rows] = await db.query(
        "SELECT req_id FROM wedding_events WHERE req_id LIKE ? ORDER BY req_id DESC LIMIT 1",
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
// POST /api/wedding/register
// Create new wedding event
// ============================================
router.post('/register', verifyMemberToken, async (req, res) => {
    try {
        const reqId = await generateReqId();
        const memberId = req.user.memberId || req.user.id || null;

        const {
            event_type, event_date, start_time, end_time,
            event_location, venue_name, num_guests, environment,
            has_theme, theme_description, has_purpose, purpose_explanation,
            estimated_budget, other_details, service_type, specific_services,
            has_arranged, arranged_explanation, discussion_points
        } = req.body;

        const [result] = await db.query(
            `INSERT INTO wedding_events 
            (req_id, event_type, event_date, start_time, end_time, event_location,
             venue_name, num_guests, environment, has_theme, theme_description,
             has_purpose, purpose_explanation, estimated_budget, other_details,
             service_type, specific_services, has_arranged, arranged_explanation,
             discussion_points, member_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reqId, event_type, event_date, start_time, end_time, event_location,
                venue_name || null, num_guests || null, environment || 'Indoor',
                has_theme || 'No', theme_description || null,
                has_purpose || 'No', purpose_explanation || null,
                estimated_budget || null, other_details || null,
                service_type || 'Specific', specific_services || null,
                has_arranged || 'No', arranged_explanation || null,
                discussion_points || null, memberId, 'pending'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Wedding event registered successfully',
            reqId: reqId,
            eventId: result.insertId
        });

    } catch (error) {
        console.error('Wedding registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to register event'
        });
    }
});

// ============================================
// GET /api/wedding/my-events
// Get logged-in member's events
// ============================================
router.get('/my-events', verifyMemberToken, async (req, res) => {
    try {
        const memberId = req.user.memberId || req.user.id;

        const [rows] = await db.query(
            `SELECT * FROM wedding_events WHERE member_id = ? ORDER BY event_date DESC`,
            [memberId]
        );

        res.json({
            success: true,
            count: rows.length,
            events: rows
        });

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// GET /api/wedding/event/:reqId
// Get event by Request ID
// ============================================
router.get('/event/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;

        const [rows] = await db.query(
            `SELECT * FROM wedding_events WHERE req_id = ?`,
            [reqId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.json({
            success: true,
            event: rows[0]
        });

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// PUT /api/wedding/event/:reqId
// Update event
// ============================================
router.put('/event/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;

        const [existing] = await db.query(
            `SELECT * FROM wedding_events WHERE req_id = ?`,
            [reqId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        const {
            event_type, event_date, start_time, end_time,
            event_location, venue_name, num_guests, environment,
            has_theme, theme_description, has_purpose, purpose_explanation,
            estimated_budget, other_details, service_type, specific_services,
            has_arranged, arranged_explanation, discussion_points, status
        } = req.body;

        await db.query(
            `UPDATE wedding_events SET
                event_type = ?, event_date = ?, start_time = ?, end_time = ?,
                event_location = ?, venue_name = ?, num_guests = ?, environment = ?,
                has_theme = ?, theme_description = ?, has_purpose = ?, purpose_explanation = ?,
                estimated_budget = ?, other_details = ?, service_type = ?, specific_services = ?,
                has_arranged = ?, arranged_explanation = ?, discussion_points = ?,
                status = ?, updated_at = NOW()
             WHERE req_id = ?`,
            [
                event_type, event_date, start_time, end_time,
                event_location, venue_name || null, num_guests || null, environment || 'Indoor',
                has_theme || 'No', theme_description || null,
                has_purpose || 'No', purpose_explanation || null,
                estimated_budget || null, other_details || null,
                service_type || 'Specific', specific_services || null,
                has_arranged || 'No', arranged_explanation || null,
                discussion_points || null, status || 'pending',
                reqId
            ]
        );

        res.json({
            success: true,
            message: 'Event updated successfully',
            reqId: reqId
        });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// DELETE /api/wedding/event/:reqId
// ============================================
router.delete('/event/:reqId', verifyMemberToken, async (req, res) => {
    try {
        const { reqId } = req.params;

        const [rows] = await db.query(
            `SELECT * FROM wedding_events WHERE req_id = ?`,
            [reqId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        await db.query(`DELETE FROM wedding_events WHERE req_id = ?`, [reqId]);

        res.json({ success: true, message: 'Event deleted' });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// GET /api/wedding/all (Admin)
// ✅ FIXED: Changed verifyMemberToken to verifyAnyToken
// ============================================
router.get('/all', verifyAnyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [events] = await db.query(
            `SELECT * FROM wedding_events ORDER BY event_date DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM wedding_events`
        );

        res.json({
            success: true,
            events: events,
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
// ✅ NEW: PUT /api/wedding/event/:reqId — Update wedding status
// ============================================
router.put('/event/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const { status } = req.body;

        const [existing] = await db.query(
            `SELECT * FROM wedding_events WHERE req_id = ?`,
            [reqId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        await db.query(
            `UPDATE wedding_events SET status = ?, updated_at = NOW() WHERE req_id = ?`,
            [status, reqId]
        );

        res.json({
            success: true,
            message: 'Event status updated successfully',
            reqId: reqId,
            status: status
        });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// PATCH /api/wedding/event/:reqId/status
router.patch('/event/:reqId/status', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const { status } = req.body;
        if (!status) return res.status(400).json({ success: false, message: 'Status required' });
        
        const [existing] = await db.query(`SELECT * FROM wedding_events WHERE req_id = ?`, [reqId]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        
        await db.query(`UPDATE wedding_events SET status = ?, updated_at = NOW() WHERE req_id = ?`, [status, reqId]);
        res.json({ success: true, message: 'Status updated', reqId, status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
module.exports = router;