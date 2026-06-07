// routes/astrology.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { verifyMemberToken, verifyAnyToken } = require('../middleware/auth');
const { astrologyUploadFields } = require('../middleware/upload');

const ASTRO_UPLOAD_DIR = 'uploads/astrology/horoscopes';

// Helper: safely parse attachment filenames
function safeParseFilenames(filenames) {
    if (!filenames) return [];
    try {
        return JSON.parse(filenames);
    } catch (e) {
        if (typeof filenames === 'string') {
            if (!filenames.startsWith('[')) {
                return filenames.split(',').map(f => f.trim()).filter(f => f);
            }
        }
        return [];
    }
}

async function generateReqId() {
    const year = new Date().getFullYear();
    const prefix = `AST-${year}-`;
    const [rows] = await db.query(
        "SELECT req_id FROM astrology_horoscope_matching WHERE req_id LIKE ? ORDER BY req_id DESC LIMIT 1",
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
// POST /api/astrology/horoscope
// ============================================
router.post('/horoscope', verifyMemberToken, async (req, res) => {
    let uploadedFiles = [];
    try {
        const reqId = await generateReqId();
        req.body.req_id = reqId;
        req.reqId = reqId;

        await new Promise((resolve, reject) => {
            astrologyUploadFields(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        if (req.files) {
            Object.values(req.files).flat().forEach(f => uploadedFiles.push(f.path));
        }

        const { upload_remarks } = req.body;
        const memberId = req.user.memberId || req.user.id || null;
        const attachments = req.files?.horoscope_attachments || [];
        const attachmentCount = attachments.length;
        const attachmentFilenames = attachments.map(f => f.filename);

        const [result] = await db.query(
            `INSERT INTO astrology_horoscope_matching 
            (req_id, upload_remarks, attachment_count, attachment_filenames, member_id, status)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                reqId, upload_remarks || null, attachmentCount,
                JSON.stringify(attachmentFilenames), memberId, 'pending'
            ]
        );

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        res.status(201).json({
            success: true,
            message: 'Horoscope matching request submitted successfully',
            reqId: reqId,
            attachmentCount: attachmentCount,
            attachments: attachmentFilenames.map(f => `${baseUrl}/uploads/astrology/horoscopes/${f}`)
        });
    } catch (error) {
        console.error('Horoscope submission error:', error);
        uploadedFiles.forEach(fp => {
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit horoscope'
        });
    }
});

// ============================================
// POST /api/astrology/consultation
// ============================================
router.post('/consultation', verifyMemberToken, async (req, res) => {
    try {
        const reqId = await generateReqId();
        const memberId = req.user.memberId || req.user.id || null;
        const {
            subject_name, gender, report_language, birth_date,
            birth_time, time_period, birth_place, consultation_notes
        } = req.body;

        const [result] = await db.query(
            `INSERT INTO astrology_consultations 
            (req_id, subject_name, gender, report_language, birth_date, birth_time,
             time_period, birth_place, consultation_notes, member_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reqId, subject_name, gender || 'male', report_language || 'english',
                birth_date, birth_time, time_period || 'standard', birth_place,
                consultation_notes || null, memberId, 'pending'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Astro consultation request submitted successfully',
            reqId: reqId,
            consultationId: result.insertId
        });
    } catch (error) {
        console.error('Consultation submission error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit consultation'
        });
    }
});

// ============================================
// GET /api/astrology/my-horoscopes
// ============================================
router.get('/my-horoscopes', verifyMemberToken, async (req, res) => {
    try {
        const memberId = req.user.memberId || req.user.id;
        const [rows] = await db.query(
            `SELECT * FROM astrology_horoscope_matching WHERE member_id = ? ORDER BY created_at DESC`,
            [memberId]
        );
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const formatted = rows.map(row => ({
            ...row,
            attachmentUrls: safeParseFilenames(row.attachment_filenames)
                .map(f => `${baseUrl}/uploads/astrology/horoscopes/${f}`)
        }));
        res.json({ success: true, count: rows.length, horoscopes: formatted });
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// GET /api/astrology/my-consultations
// ============================================
router.get('/my-consultations', verifyMemberToken, async (req, res) => {
    try {
        const memberId = req.user.memberId || req.user.id;
        const [rows] = await db.query(
            `SELECT * FROM astrology_consultations WHERE member_id = ? ORDER BY created_at DESC`,
            [memberId]
        );
        res.json({ success: true, count: rows.length, consultations: rows });
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// GET /api/astrology/horoscope/:reqId
// ============================================
router.get('/horoscope/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const [rows] = await db.query(
            `SELECT * FROM astrology_horoscope_matching WHERE req_id = ?`,
            [reqId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const row = rows[0];
        row.attachmentUrls = safeParseFilenames(row.attachment_filenames)
            .map(f => `${baseUrl}/uploads/astrology/horoscopes/${f}`);
        res.json({ success: true, horoscope: row });
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// ✅ NEW: PUT /api/astrology/horoscope/:reqId — Update horoscope status
// ============================================
router.put('/horoscope/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const { status, upload_remarks } = req.body;

        const [existing] = await db.query(
            `SELECT * FROM astrology_horoscope_matching WHERE req_id = ?`,
            [reqId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Horoscope request not found' });
        }

        // Only update fields that are provided
        const updates = [];
        const values = [];

        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }
        if (upload_remarks !== undefined) {
            updates.push('upload_remarks = ?');
            values.push(upload_remarks);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        updates.push('updated_at = NOW()');
        values.push(reqId);

        await db.query(
            `UPDATE astrology_horoscope_matching SET ${updates.join(', ')} WHERE req_id = ?`,
            values
        );

        res.json({
            success: true,
            message: 'Horoscope request updated successfully',
            reqId: reqId
        });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// GET /api/astrology/consultation/:reqId
// ============================================
router.get('/consultation/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const [rows] = await db.query(
            `SELECT * FROM astrology_consultations WHERE req_id = ?`,
            [reqId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }
        res.json({ success: true, consultation: rows[0] });
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// ✅ NEW: PUT /api/astrology/consultation/:reqId — Update consultation status
// ============================================
router.put('/consultation/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const { status, consultation_notes } = req.body;

        const [existing] = await db.query(
            `SELECT * FROM astrology_consultations WHERE req_id = ?`,
            [reqId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Consultation not found' });
        }

        const updates = [];
        const values = [];

        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }
        if (consultation_notes !== undefined) {
            updates.push('consultation_notes = ?');
            values.push(consultation_notes);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        updates.push('updated_at = NOW()');
        values.push(reqId);

        await db.query(
            `UPDATE astrology_consultations SET ${updates.join(', ')} WHERE req_id = ?`,
            values
        );

        res.json({
            success: true,
            message: 'Consultation updated successfully',
            reqId: reqId
        });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// DELETE /api/astrology/horoscope/:reqId
// ============================================
router.delete('/horoscope/:reqId', verifyMemberToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const [rows] = await db.query(
            `SELECT * FROM astrology_horoscope_matching WHERE req_id = ?`,
            [reqId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }
        const record = rows[0];
        const files = safeParseFilenames(record.attachment_filenames);
        files.forEach(f => {
            const fp = path.join(ASTRO_UPLOAD_DIR, f);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        });
        await db.query(`DELETE FROM astrology_horoscope_matching WHERE req_id = ?`, [reqId]);
        res.json({ success: true, message: 'Horoscope request deleted' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// DELETE /api/astrology/consultation/:reqId
// ============================================
router.delete('/consultation/:reqId', verifyMemberToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const [rows] = await db.query(
            `SELECT * FROM astrology_consultations WHERE req_id = ?`,
            [reqId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }
        await db.query(`DELETE FROM astrology_consultations WHERE req_id = ?`, [reqId]);
        res.json({ success: true, message: 'Consultation deleted' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// GET /api/astrology/all-horoscopes (Admin)
// ============================================
router.get('/all-horoscopes', verifyAnyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [rows] = await db.query(
            `SELECT * FROM astrology_horoscope_matching ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM astrology_horoscope_matching`
        );
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const formatted = rows.map(row => ({
            ...row,
            attachmentUrls: safeParseFilenames(row.attachment_filenames)
                .map(f => `${baseUrl}/uploads/astrology/horoscopes/${f}`)
        }));
        res.json({
            success: true,
            horoscopes: formatted,
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
// GET /api/astrology/all-consultations (Admin)
// ============================================
router.get('/all-consultations', verifyAnyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [rows] = await db.query(
            `SELECT * FROM astrology_consultations ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM astrology_consultations`
        );
        res.json({
            success: true,
            consultations: rows,
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

// PATCH /api/astrology/horoscope/:reqId/status
router.patch('/horoscope/:reqId/status', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const { status } = req.body;
        if (!status) return res.status(400).json({ success: false, message: 'Status required' });
        
        const [existing] = await db.query(`SELECT * FROM astrology_horoscope_matching WHERE req_id = ?`, [reqId]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        
        await db.query(`UPDATE astrology_horoscope_matching SET status = ?, updated_at = NOW() WHERE req_id = ?`, [status, reqId]);
        res.json({ success: true, message: 'Status updated', reqId, status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PATCH /api/astrology/consultation/:reqId/status
router.patch('/consultation/:reqId/status', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const { status } = req.body;
        if (!status) return res.status(400).json({ success: false, message: 'Status required' });
        
        const [existing] = await db.query(`SELECT * FROM astrology_consultations WHERE req_id = ?`, [reqId]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        
        await db.query(`UPDATE astrology_consultations SET status = ?, updated_at = NOW() WHERE req_id = ?`, [status, reqId]);
        res.json({ success: true, message: 'Status updated', reqId, status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;