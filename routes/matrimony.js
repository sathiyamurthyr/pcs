// routes/matrimony.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { verifyMemberToken, verifyAnyToken } = require('../middleware/auth');
const { matrimonyUploadFields } = require('../middleware/upload');

// Base path for matrimony profile files
const PROFILE_UPLOAD_DIR = 'uploads/matrimony/profiles';

// ============================================
// Generate Request ID: MAT-YYYY-XXXXX
// ============================================
async function generateReqId() {
    const year = new Date().getFullYear();
    const prefix = `MAT-${year}-`;

    const [rows] = await db.query(
        "SELECT req_id FROM matrimony_profiles WHERE req_id LIKE ? ORDER BY req_id DESC LIMIT 1",
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
// POST /api/matrimony/register
// Create new profile
// ============================================
router.post('/register', verifyMemberToken, async (req, res) => {
    let uploadedFiles = [];

    try {
        // Step 1: Generate req_id BEFORE multer
        const reqId = await generateReqId();
        req.body.req_id = reqId;
        req.reqId = reqId;

        // Step 2: Handle file uploads
        await new Promise((resolve, reject) => {
            matrimonyUploadFields(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        if (req.files) {
            Object.values(req.files).flat().forEach(f => uploadedFiles.push(f.path));
        }

        // Step 3: Extract form data
        const {
            profileFor, fullName, dob, maritalStatus, height,
            education, profession, income, workLocation,
            religion, caste, star, rasi, familyDetails,
            contactPhone, contactEmail, partnerPreferences
        } = req.body;

        const memberId = req.user.memberId || req.user.id || null;

        // Step 4: Get filenames
        const photoFile = req.files?.profileImage?.[0];
        const horoscopeFile = req.files?.horoscopeDoc?.[0];
        const photoFilename = photoFile ? photoFile.filename : null;
        const horoscopeFilename = horoscopeFile ? horoscopeFile.filename : null;

        // Step 5: Insert to database
        const [result] = await db.query(
            `INSERT INTO matrimony_profiles 
            (req_id, profile_for, full_name, dob, marital_status, height, education, 
             profession, income, work_location, religion, caste, star, rasi, 
             family_details, contact_phone, contact_email, partner_preferences,
             photo_filename, horoscope_filename, member_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reqId, profileFor, fullName, dob, maritalStatus, height || null,
                education, profession, income || null, workLocation, religion,
                caste || null, star || null, rasi || null, familyDetails || null,
                contactPhone, contactEmail, partnerPreferences || null,
                photoFilename, horoscopeFilename, memberId, 'active'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Matrimony profile registered successfully',
            reqId: reqId,
            profileId: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error);
        uploadedFiles.forEach(fp => {
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        });

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to register profile'
        });
    }
});

// ============================================
// GET /api/matrimony/my-profile
// Get logged-in member's profile
// ============================================
router.get('/my-profile', verifyMemberToken, async (req, res) => {
    try {
        const memberId = req.user.memberId || req.user.id;

        const [rows] = await db.query(
            `SELECT * FROM matrimony_profiles WHERE member_id = ? ORDER BY created_at DESC LIMIT 1`,
            [memberId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No matrimony profile found'
            });
        }

        const profile = rows[0];
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        res.json({
            success: true,
            profile: {
                ...profile,
                photoUrl: profile.photo_filename 
                    ? `${baseUrl}/uploads/matrimony/profiles/${profile.photo_filename}` : null,
                horoscopeUrl: profile.horoscope_filename 
                    ? `${baseUrl}/uploads/matrimony/profiles/${profile.horoscope_filename}` : null
            }
        });

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// GET /api/matrimony/profile/:reqId
// Get profile by Request ID
// ============================================
router.get('/profile/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;

        const [rows] = await db.query(
            `SELECT * FROM matrimony_profiles WHERE req_id = ?`,
            [reqId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        const profile = rows[0];
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        res.json({
            success: true,
            profile: {
                ...profile,
                photoUrl: profile.photo_filename 
                    ? `${baseUrl}/uploads/matrimony/profiles/${profile.photo_filename}` : null,
                horoscopeUrl: profile.horoscope_filename 
                    ? `${baseUrl}/uploads/matrimony/profiles/${profile.horoscope_filename}` : null
            }
        });

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// PUT /api/matrimony/profile/:reqId
// Update profile (with optional new files)
// ============================================
router.put('/profile/:reqId', verifyAnyToken, async (req, res) => {
    let uploadedFiles = [];

    try {
        const { reqId } = req.params;

        const [existing] = await db.query(
            `SELECT * FROM matrimony_profiles WHERE req_id = ?`,
            [reqId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        const oldProfile = existing[0];
        req.body.req_id = reqId;

        // Handle file uploads
        await new Promise((resolve, reject) => {
            matrimonyUploadFields(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        if (req.files) {
            Object.values(req.files).flat().forEach(f => uploadedFiles.push(f.path));
        }

        const {
            fullName, dob, maritalStatus, height, education,
            profession, income, workLocation, religion, caste,
            star, rasi, familyDetails, contactPhone, contactEmail,
            partnerPreferences
        } = req.body;

        // Handle file updates - delete old files from profiles/ subfolder
        let photoFilename = oldProfile.photo_filename;
        let horoscopeFilename = oldProfile.horoscope_filename;

        if (req.files?.profileImage?.[0]) {
            if (oldProfile.photo_filename) {
                const oldPath = path.join(PROFILE_UPLOAD_DIR, oldProfile.photo_filename);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            photoFilename = req.files.profileImage[0].filename;
        }

        if (req.files?.horoscopeDoc?.[0]) {
            if (oldProfile.horoscope_filename) {
                const oldPath = path.join(PROFILE_UPLOAD_DIR, oldProfile.horoscope_filename);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            horoscopeFilename = req.files.horoscopeDoc[0].filename;
        }

        // Update DB
        await db.query(
            `UPDATE matrimony_profiles SET
                full_name = ?, dob = ?, marital_status = ?, height = ?,
                education = ?, profession = ?, income = ?, work_location = ?,
                religion = ?, caste = ?, star = ?, rasi = ?,
                family_details = ?, contact_phone = ?, contact_email = ?,
                partner_preferences = ?, photo_filename = ?, horoscope_filename = ?,
                updated_at = NOW()
             WHERE req_id = ?`,
            [
                fullName, dob, maritalStatus, height || null,
                education, profession, income || null, workLocation,
                religion, caste || null, star || null, rasi || null,
                familyDetails || null, contactPhone, contactEmail,
                partnerPreferences || null, photoFilename, horoscopeFilename,
                reqId
            ]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            reqId: reqId
        });

    } catch (error) {
        console.error('Update error:', error);
        uploadedFiles.forEach(fp => {
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        });
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// DELETE /api/matrimony/profile/:reqId
// ============================================
router.delete('/profile/:reqId', verifyMemberToken, async (req, res) => {
    try {
        const { reqId } = req.params;

        const [rows] = await db.query(
            `SELECT * FROM matrimony_profiles WHERE req_id = ?`,
            [reqId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        const profile = rows[0];

        // Delete files from profiles/ subfolder
        if (profile.photo_filename) {
            const fp = path.join(PROFILE_UPLOAD_DIR, profile.photo_filename);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        }
        if (profile.horoscope_filename) {
            const fp = path.join(PROFILE_UPLOAD_DIR, profile.horoscope_filename);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        }

        await db.query(`DELETE FROM matrimony_profiles WHERE req_id = ?`, [reqId]);

        res.json({ success: true, message: 'Profile deleted' });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// GET /api/matrimony/all (Admin)
// ✅ FIXED: Changed verifyMemberToken to verifyAnyToken
// ============================================
router.get('/all', verifyAnyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [profiles] = await db.query(
            `SELECT * FROM matrimony_profiles ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM matrimony_profiles`
        );

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const formatted = profiles.map(p => ({
            ...p,
            photoUrl: p.photo_filename 
                ? `${baseUrl}/uploads/matrimony/profiles/${p.photo_filename}` : null,
            horoscopeUrl: p.horoscope_filename 
                ? `${baseUrl}/uploads/matrimony/profiles/${p.horoscope_filename}` : null
        }));

        res.json({
            success: true,
            profiles: formatted,
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
// ✅ NEW: PUT /api/matrimony/profile/:reqId — Update profile status
// ============================================
router.put('/profile/:reqId', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;
        const { status } = req.body;

        const [existing] = await db.query(
            `SELECT * FROM matrimony_profiles WHERE req_id = ?`,
            [reqId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        await db.query(
            `UPDATE matrimony_profiles SET status = ?, updated_at = NOW() WHERE req_id = ?`,
            [status, reqId]
        );

        res.json({
            success: true,
            message: 'Profile status updated successfully',
            reqId: reqId,
            status: status
        });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// GET /api/matrimony/profile/:reqId/photo-download
// Download profile photo — ADMIN PANEL
// ============================================
router.get('/profile/:reqId/photo-download', verifyAnyToken, async (req, res) => {
    try {
        const { reqId } = req.params;

        const [rows] = await db.query(
            `SELECT photo_filename FROM matrimony_profiles WHERE req_id = ?`,
            [reqId]
        );

        if (rows.length === 0 || !rows[0].photo_filename) {
            return res.status(404).json({
                success: false,
                message: 'Photo not found for this profile'
            });
        }

        const filename = rows[0].photo_filename;
        const filePath = path.join(PROFILE_UPLOAD_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Photo file not found on server'
            });
        }

        // Set download headers
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Photo download error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;