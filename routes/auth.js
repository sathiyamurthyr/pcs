const express = require('express');
const db = require('../config/db');
const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'API is working!' });
});

// Admin Login - Generates Base64 token: "id:username"
router.post('/admin/login', async (req, res) => {
    console.log('📝 Login attempt:', req.body.username);
    
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password required' 
            });
        }

        // Check if admin exists
        const [admins] = await db.query(
            'SELECT * FROM admins WHERE username = ?',
            [username]
        );

        if (admins.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const admin = admins[0];

        // Simple password comparison
        if (password !== admin.password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // ✅ FIXED: Generate Base64 token in format "id:username" (NOT "id:username:timestamp")
        // Your verifyAdminToken middleware expects: decoded.split(':') -> [id, username]
        const tokenString = `${admin.id}:${admin.username}`;
        const token = Buffer.from(tokenString).toString('base64');

        console.log('✅ Login successful for:', username);
        console.log('🔑 Token generated:', token, '(decoded:', tokenString, ')');

        // Update last login
        await db.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

        res.json({
            success: true,
            token: token,  // Frontend will store this in localStorage as 'adminToken'
            admin: {
                id: admin.id,
                username: admin.username,
                role: admin.role,
                full_name: admin.full_name || admin.username
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

module.exports = router;