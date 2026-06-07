const express = require('express');
const db = require('../config/db');
const router = express.Router();

// Submit contact form
router.post('/submit', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        const [result] = await db.query(
            'INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, subject, message]
        );

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;