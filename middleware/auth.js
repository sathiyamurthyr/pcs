// middleware/auth.js
const db = require('../config/db');

// ==================== MEMBER AUTH ====================

const verifyMemberToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. No token provided.' 
        });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token || token.trim() === '') {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. Invalid token.' 
        });
    }
    
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const parts = decoded.split(':');
        
        if (parts.length < 2) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token format.' 
            });
        }
        
        const memberId = parts[1];
        
        const [members] = await db.query(
            'SELECT * FROM members WHERE member_id = ?',
            [memberId]
        );
        
        if (members.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Member not found. Please login again.' 
            });
        }
        
        const member = members[0];
        req.user = {
            id: member.id,
            memberId: member.member_id,
            name: member.full_name || member.name,
            mobile: member.mobile,
            email: member.email,
            role: 'member'
        };
        
        next();
        
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token.' 
        });
    }
};

// ==================== ADMIN AUTH ====================

const verifyAdminToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. No token provided.' 
        });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token || token.trim() === '') {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. Invalid token.' 
        });
    }
    
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const parts = decoded.split(':');
        
        if (parts.length < 2) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token format.' 
            });
        }
        
        const adminId = parseInt(parts[0]);
        const username = parts[1];
        
        const [admins] = await db.query(
            'SELECT * FROM admins WHERE id = ? AND username = ?',
            [adminId, username]
        );
        
        if (admins.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Admin not found.' 
            });
        }
        
        req.admin = {
            id: admins[0].id,
            username: admins[0].username,
            role: admins[0].role || 'admin'
        };
        
        // Also set req.user for unified access in shared middleware
        req.user = {
            id: admins[0].id,
            memberId: null,
            name: admins[0].username,
            role: admins[0].role || 'admin'
        };
        
        next();
        
    } catch (error) {
        console.error('Admin token verification error:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token.' 
        });
    }
};

// ==================== UNIFIED AUTH (Member OR Admin) ====================
// Use this for routes that both members and admins can access (like /all lists)

const verifyAnyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. No token provided.' 
        });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token || token.trim() === '') {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. Invalid token.' 
        });
    }
    
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const parts = decoded.split(':');
        
        if (parts.length < 2) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token format.' 
            });
        }
        
        const id = parseInt(parts[0]);
        const identifier = parts[1]; // member_id or username
        
        // Try member first
        const [members] = await db.query(
            'SELECT * FROM members WHERE member_id = ?',
            [identifier]
        );
        
        if (members.length > 0) {
            const member = members[0];
            req.user = {
                id: member.id,
                memberId: member.member_id,
                name: member.full_name || member.name,
                mobile: member.mobile,
                email: member.email,
                role: 'member'
            };
            req.isAdmin = false;
            return next();
        }
        
        // Try admin
        const [admins] = await db.query(
            'SELECT * FROM admins WHERE id = ? AND username = ?',
            [id, identifier]
        );
        
        if (admins.length > 0) {
            req.admin = {
                id: admins[0].id,
                username: admins[0].username,
                role: admins[0].role || 'admin'
            };
            req.user = {
                id: admins[0].id,
                memberId: null,
                name: admins[0].username,
                role: admins[0].role || 'admin'
            };
            req.isAdmin = true;
            return next();
        }
        
        return res.status(401).json({ 
            success: false, 
            message: 'User not found. Please login again.' 
        });
        
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token.' 
        });
    }
};

// Backward compatible alias
const verifyToken = verifyAdminToken;

// ==================== ROLE VERIFICATION ====================

const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.admin?.role || req.user?.role;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Insufficient permissions.' 
            });
        }
        next();
    };
};

// ==================== EXPORTS ====================

module.exports = { 
    verifyMemberToken, 
    verifyAdminToken,
    verifyAnyToken,   // NEW: accepts both member and admin tokens
    verifyToken,      // backward compatible
    verifyRole 
};