const express = require('express');
const db = require('../config/db');
const router = express.Router();

// Function to generate next Member ID (PJA0001, PJA0002, etc.)
async function generateMemberId() {
    try {
        const [result] = await db.query(
            "SELECT member_id FROM members WHERE member_id LIKE 'PJA%' AND member_id IS NOT NULL ORDER BY id DESC LIMIT 1"
        );
        
        if (result.length === 0 || !result[0].member_id) {
            return 'PJA0001';
        }
        
        const lastId = result[0].member_id;
        const num = parseInt(lastId.substring(3)) + 1;
        return `PJA${num.toString().padStart(4, '0')}`;
    } catch (error) {
        console.error('Error generating member ID:', error);
        return 'PJA0001'; // fallback
    }
}

// Register new member (pending approval)
router.post('/register', async (req, res) => {
    console.log('📝 Registration request received:', req.body);
    
    try {
        const { fullName, mobile, password, email, address, paymentMethod } = req.body;

        // Validate required fields
        if (!fullName || !mobile || !password || !address) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be filled' 
            });
        }

        // Check if mobile already exists
        const [existing] = await db.query(
            'SELECT id, status FROM members WHERE mobile = ?',
            [mobile]
        );
        
        console.log('📊 Existing check:', existing);
        
        if (existing.length > 0) {
            if (existing[0].status === 'pending') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Registration pending approval. Wait for admin confirmation.' 
                });
            } else if (existing[0].status === 'approved') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mobile number already registered. Please login.' 
                });
            }
        }

        // Insert new member with pending status
        const [result] = await db.query(
            `INSERT INTO members (name, mobile, password, email, address, status, payment_method, created_at) 
             VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())`,
            [fullName, mobile, password, email || null, address, paymentMethod || 'UPI']
        );

        console.log('✅ Member inserted successfully, ID:', result.insertId);

        res.json({ 
            success: true, 
            message: 'Registration successful! Wait for admin approval.',
            memberId: result.insertId 
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// Member login (only approved members)
router.post('/login', async (req, res) => {
    console.log('🔐 Login attempt:', req.body.mobile);
    
    try {
        const { mobile, password } = req.body;

        const [members] = await db.query(
            'SELECT * FROM members WHERE mobile = ?',
            [mobile]
        );

        if (members.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const member = members[0];

        if (member.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (member.status !== 'approved') {
            return res.status(401).json({ 
                success: false, 
                message: 'Your account is pending admin approval' 
            });
        }

        await db.query('UPDATE members SET last_login = NOW() WHERE id = ?', [member.id]);

        // CREATE AND RETURN TOKEN
        const token = Buffer.from(`${member.id}:${member.mobile}:${Date.now()}`).toString('base64');

        res.json({
            success: true,
            token: token,
            member: {
                id: member.id,
                name: member.name,
                mobile: member.mobile,
                email: member.email,
                address: member.address,
                member_id: member.member_id
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get member profile (requires token)
router.get('/profile', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication required' 
        });
    }

    try {
        // Decode token to get member ID
        const decoded = Buffer.from(token, 'base64').toString();
        const memberId = decoded.split(':')[0];

        const [members] = await db.query(
            'SELECT id, name, mobile, email, address, member_id, status, payment_method, created_at, last_login FROM members WHERE id = ?',
            [memberId]
        );

        if (members.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }

        res.json({
            success: true,
            member: members[0]
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch profile' 
        });
    }
});

// Get all pending members
router.get('/pending', async (req, res) => {
    try {
        const [members] = await db.query(
            'SELECT id, name, mobile, email, address, created_at FROM members WHERE status = "pending" ORDER BY created_at DESC'
        );
        res.json({ success: true, members });
    } catch (error) {
        console.error('Error fetching pending members:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Get all approved members
router.get('/approved', async (req, res) => {
    try {
        const [members] = await db.query(
            'SELECT id, name, mobile, email, address, member_id, created_at, last_login FROM members WHERE status = "approved" ORDER BY created_at DESC'
        );
        res.json({ success: true, members });
    } catch (error) {
        console.error('Error fetching approved members:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Approve member - FIXED with better error handling
router.put('/approve/:id', async (req, res) => {
    console.log('📋 Approve request for ID:', req.params.id);
    
    try {
        const { id } = req.params;
        
        // First check if member exists and is pending
        const [checkMember] = await db.query(
            'SELECT id, name, mobile, status FROM members WHERE id = ?',
            [id]
        );
        
        if (checkMember.length === 0) {
            console.log('❌ Member not found:', id);
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }
        
        const member = checkMember[0];
        
        if (member.status === 'approved') {
            console.log('⚠️ Member already approved:', id);
            return res.status(400).json({ 
                success: false, 
                message: 'Member is already approved' 
            });
        }
        
        if (member.status !== 'pending') {
            console.log('⚠️ Invalid member status:', member.status);
            return res.status(400).json({ 
                success: false, 
                message: 'Only pending members can be approved' 
            });
        }
        
        // Generate new member ID
        const memberId = await generateMemberId();
        console.log('📝 Generated Member ID:', memberId);
        
        // Update member status and assign member_id
        const [updateResult] = await db.query(
            'UPDATE members SET status = "approved", member_id = ? WHERE id = ?',
            [memberId, id]
        );
        
        console.log('✅ Update result:', updateResult);
        
        if (updateResult.affectedRows === 0) {
            throw new Error('Failed to update member status');
        }
        
        res.json({ 
            success: true, 
            message: 'Member approved successfully',
            memberId: memberId,
            mobile: member.mobile,
            name: member.name
        });
        
    } catch (error) {
        console.error('❌ Approval error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// Reject member
router.delete('/reject/:id', async (req, res) => {
    console.log('🗑️ Reject request for ID:', req.params.id);
    
    try {
        const { id } = req.params;
        
        // Check if member exists and is pending
        const [checkMember] = await db.query(
            'SELECT id, status FROM members WHERE id = ?',
            [id]
        );
        
        if (checkMember.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }
        
        if (checkMember[0].status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'Only pending members can be rejected' 
            });
        }
        
        const [result] = await db.query(
            'DELETE FROM members WHERE id = ? AND status = "pending"',
            [id]
        );
        
        if (result.affectedRows === 0) {
            throw new Error('Failed to delete member');
        }
        
        res.json({ 
            success: true, 
            message: 'Member rejected and removed successfully' 
        });
    } catch (error) {
        console.error('❌ Rejection error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// Get member by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [members] = await db.query(
            'SELECT id, name, mobile, email, address, member_id, status, created_at FROM members WHERE id = ?',
            [id]
        );
        
        if (members.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }
        
        res.json({ 
            success: true, 
            member: members[0] 
        });
    } catch (error) {
        console.error('Error fetching member:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

module.exports = router;