const express = require('express');
const db = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');
const router = express.Router();

// Get dashboard stats
router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        // Get counts from various tables with error handling
        let memberCount = 0;
        let appointmentCount = 0;
        let contactCount = 0;
        let galleryCount = 0;
        
        try {
            const [members] = await db.query('SELECT COUNT(*) as count FROM members WHERE status = "approved"');
            memberCount = members[0]?.count || 0;
        } catch (e) { console.log('Members table not ready'); }
        
        try {
            const [appointments] = await db.query('SELECT COUNT(*) as count FROM appointments WHERE status = "pending"');
            appointmentCount = appointments[0]?.count || 0;
        } catch (e) { console.log('Appointments table not ready'); }
        
        try {
            const [contacts] = await db.query('SELECT COUNT(*) as count FROM contacts WHERE is_read = 0');
            contactCount = contacts[0]?.count || 0;
        } catch (e) { console.log('Contacts table not ready'); }
        
        try {
            const [gallery] = await db.query('SELECT COUNT(*) as count FROM gallery');
            galleryCount = gallery[0]?.count || 0;
        } catch (e) { console.log('Gallery table not ready'); }

        res.json({
            success: true,
            stats: {
                members: memberCount,
                pendingAppointments: appointmentCount,
                unreadMessages: contactCount,
                galleryImages: galleryCount
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all members
router.get('/members', verifyToken, async (req, res) => {
    try {
        const [members] = await db.query(
            'SELECT id, name, email, phone, address, created_at FROM members ORDER BY created_at DESC'
        );
        res.json({ success: true, members });
    } catch (error) {
        console.error(error);
        res.json({ success: true, members: [] });
    }
});

// Delete member
router.delete('/members/:id', verifyToken, verifyRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM members WHERE id = ?', [id]);
        res.json({ success: true, message: 'Member deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get appointments
router.get('/appointments', verifyToken, async (req, res) => {
    try {
        const [appointments] = await db.query(
            'SELECT * FROM appointments ORDER BY appointment_date DESC'
        );
        res.json({ success: true, appointments });
    } catch (error) {
        console.error(error);
        res.json({ success: true, appointments: [] });
    }
});

// Update appointment status
router.put('/appointments/:id/status', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        await db.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get contacts
router.get('/contacts', verifyToken, async (req, res) => {
    try {
        const [contacts] = await db.query(
            'SELECT * FROM contacts ORDER BY created_at DESC'
        );
        res.json({ success: true, contacts });
    } catch (error) {
        console.error(error);
        res.json({ success: true, contacts: [] });
    }
});

// Mark contact as read
router.put('/contacts/:id/read', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE contacts SET is_read = 1 WHERE id = ?', [id]);
        res.json({ success: true, message: 'Contact marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get gallery images
router.get('/gallery', verifyToken, async (req, res) => {
    try {
        const [images] = await db.query(
            'SELECT * FROM gallery ORDER BY uploaded_at DESC'
        );
        res.json({ success: true, images });
    } catch (error) {
        console.error(error);
        res.json({ success: true, images: [] });
    }
});

// Upload gallery image
router.post('/gallery/upload', verifyToken, async (req, res) => {
    try {
        const { title, description, image_url } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO gallery (title, description, image_url, uploaded_by) VALUES (?, ?, ?, ?)',
            [title, description, image_url, req.admin.id]
        );
        
        res.json({ success: true, message: 'Image added to gallery', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete gallery image
router.delete('/gallery/:id', verifyToken, verifyRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM gallery WHERE id = ?', [id]);
        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;