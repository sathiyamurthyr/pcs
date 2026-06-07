const express = require('express');
const db = require('../config/db');
const router = express.Router();

// Submit general enquiry (for non-registered users)
router.post('/submit', async (req, res) => {
    console.log('📝 General Enquiry received:', req.body);
    
    try {
        const { name, email, phone, service_interest, message } = req.body;

        if (!name || !phone || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, phone and message are required' 
            });
        }

        const [result] = await db.query(
            `INSERT INTO general_enquiries (name, email, phone, service_interest, message, status) 
             VALUES (?, ?, ?, ?, ?, 'new')`,
            [name, email || null, phone, service_interest || null, message]
        );

        res.json({ 
            success: true, 
            message: 'Enquiry submitted successfully! We will contact you soon.',
            enquiryId: result.insertId 
        });
    } catch (error) {
        console.error('Enquiry submission error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all enquiries (for admin) with date filter
router.get('/all', async (req, res) => {
    try {
        const { from_date, to_date } = req.query;
        
        let query = 'SELECT * FROM general_enquiries ORDER BY created_at DESC';
        let params = [];
        
        if (from_date && to_date) {
            query = 'SELECT * FROM general_enquiries WHERE DATE(created_at) BETWEEN ? AND ? ORDER BY created_at DESC';
            params = [from_date, to_date];
        }
        
        const [enquiries] = await db.query(query, params);
        res.json({ success: true, enquiries });
    } catch (error) {
        console.error('Error fetching enquiries:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get enquiry by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [enquiries] = await db.query('SELECT * FROM general_enquiries WHERE id = ?', [id]);
        
        if (enquiries.length === 0) {
            return res.status(404).json({ success: false, message: 'Enquiry not found' });
        }
        
        res.json({ success: true, enquiry: enquiries[0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Mark enquiry as read
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE general_enquiries SET status = "read" WHERE id = ?', [id]);
        res.json({ success: true, message: 'Enquiry marked as read' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Mark enquiry as replied
router.put('/:id/replied', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE general_enquiries SET status = "replied" WHERE id = ?', [id]);
        res.json({ success: true, message: 'Enquiry marked as replied' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete enquiry
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM general_enquiries WHERE id = ?', [id]);
        res.json({ success: true, message: 'Enquiry deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get enquiry statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const [total] = await db.query('SELECT COUNT(*) as count FROM general_enquiries');
        const [newEnquiries] = await db.query('SELECT COUNT(*) as count FROM general_enquiries WHERE status = "new"');
        const [today] = await db.query('SELECT COUNT(*) as count FROM general_enquiries WHERE DATE(created_at) = CURDATE()');
        
        res.json({ 
            success: true, 
            stats: {
                total: total[0].count,
                new: newEnquiries[0].count,
                today: today[0].count
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;