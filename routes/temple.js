// routes/temple.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyMemberToken, verifyAnyToken } = require('../middleware/auth');

// ============================================
// Generate Request ID: SEV-YYYY-XXXXX
// ============================================
async function generateReqId() {
    const year = new Date().getFullYear();
    const prefix = `SEV-${year}-`;

    const [rows] = await db.query(
        "SELECT req_id FROM temple_seva_bookings WHERE req_id LIKE ? ORDER BY req_id DESC LIMIT 1",
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
// POST /api/temple/booking
// Create new seva booking
// ============================================
router.post('/booking', verifyMemberToken, async (req, res) => {
    try {
        const reqId = await generateReqId();
        const memberId = req.user.memberId || req.user.id || null;

        const {
            devotee_name, phone_number, seva_date, gothram,
            nakshatram, rasi, special_notes
        } = req.body;

        // Handle multiple sevas (checkbox array or single value)
        let sevas = req.body.sevas;
        if (Array.isArray(sevas)) {
            sevas = sevas.join(',');
        } else if (!sevas) {
            sevas = '';
        }

        const [result] = await db.query(
            `INSERT INTO temple_seva_bookings 
            (req_id, devotee_name, phone_number, seva_date, gothram, nakshatram,
             rasi, sevas, special_notes, member_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reqId, devotee_name, phone_number, seva_date, gothram || null,
                nakshatram || null, rasi || null, sevas, special_notes || null,
                memberId, 'pending'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Seva booking registered successfully',
            reqId: reqId,
            bookingId: result.insertId
        });

    } catch (error) {
        console.error('Seva booking error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to register booking'
        });
    }
});

// ============================================
// GET /api/temple/my-bookings
// Get logged-in member's bookings
// ============================================
router.get('/my-bookings', verifyMemberToken, async (req, res) => {
    try {
        const memberId = req.user.memberId || req.user.id;

        const [rows] = await db.query(
            `SELECT * FROM temple_seva_bookings WHERE member_id = ? ORDER BY seva_date DESC`,
            [memberId]
        );

        // Parse sevas back to array for frontend
        const formatted = rows.map(row => ({
            ...row,
            sevasArray: row.sevas ? row.sevas.split(',') : []
        }));

        res.json({
            success: true,
            count: rows.length,
            bookings: formatted
        });

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// GET /api/temple/booking/:reqId
// Get booking by Request ID
// ============================================
router.get('/booking/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;

        const [rows] = await db.query(
            `SELECT * FROM temple_seva_bookings WHERE req_id = ?`,
            [reqId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = rows[0];
        booking.sevasArray = booking.sevas ? booking.sevas.split(',') : [];

        res.json({
            success: true,
            booking: booking
        });

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// PUT /api/temple/booking/:reqId
// Update booking
// ============================================
router.put('/booking/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;

        const [existing] = await db.query(
            `SELECT * FROM temple_seva_bookings WHERE req_id = ?`,
            [reqId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const {
            devotee_name, phone_number, seva_date, gothram,
            nakshatram, rasi, special_notes, status
        } = req.body;

        // Handle multiple sevas
        let sevas = req.body.sevas;
        if (Array.isArray(sevas)) {
            sevas = sevas.join(',');
        } else if (!sevas) {
            sevas = existing[0].sevas;
        }

        await db.query(
            `UPDATE temple_seva_bookings SET
                devotee_name = ?, phone_number = ?, seva_date = ?, gothram = ?,
                nakshatram = ?, rasi = ?, sevas = ?, special_notes = ?,
                status = ?, updated_at = NOW()
             WHERE req_id = ?`,
            [
                devotee_name, phone_number, seva_date, gothram || null,
                nakshatram || null, rasi || null, sevas, special_notes || null,
                status || 'pending', reqId
            ]
        );

        res.json({
            success: true,
            message: 'Booking updated successfully',
            reqId: reqId
        });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// DELETE /api/temple/booking/:reqId
// ============================================
router.delete('/booking/:reqId', verifyMemberToken, async (req, res) => {
    try {
        const { reqId } = req.params;

        const [rows] = await db.query(
            `SELECT * FROM temple_seva_bookings WHERE req_id = ?`,
            [reqId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        await db.query(`DELETE FROM temple_seva_bookings WHERE req_id = ?`, [reqId]);

        res.json({ success: true, message: 'Booking deleted' });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// GET /api/temple/all (Admin)
// ✅ FIXED: Changed verifyMemberToken to verifyAnyToken
// ============================================
router.get('/all', verifyAnyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [bookings] = await db.query(
            `SELECT * FROM temple_seva_bookings ORDER BY seva_date DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM temple_seva_bookings`
        );

        const formatted = bookings.map(row => ({
            ...row,
            sevasArray: row.sevas ? row.sevas.split(',') : []
        }));

        res.json({
            success: true,
            bookings: formatted,
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
// ✅ NEW: PUT /api/temple/booking/:reqId — Update booking status
// ============================================
router.put('/booking/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const { status } = req.body;

        const [existing] = await db.query(
            `SELECT * FROM temple_seva_bookings WHERE req_id = ?`,
            [reqId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        await db.query(
            `UPDATE temple_seva_bookings SET status = ?, updated_at = NOW() WHERE req_id = ?`,
            [status, reqId]
        );

        res.json({
            success: true,
            message: 'Booking status updated successfully',
            reqId: reqId,
            status: status
        });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// PATCH /api/temple/booking/:reqId/status
router.patch('/booking/:reqId/status', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const { status } = req.body;
        if (!status) return res.status(400).json({ success: false, message: 'Status required' });
        
        const [existing] = await db.query(`SELECT * FROM temple_seva_bookings WHERE req_id = ?`, [reqId]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        
        await db.query(`UPDATE temple_seva_bookings SET status = ?, updated_at = NOW() WHERE req_id = ?`, [status, reqId]);
        res.json({ success: true, message: 'Status updated', reqId, status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;