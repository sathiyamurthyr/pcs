const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');  // ← ADDED: was missing!
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ============================================
// 1. MIDDLEWARE (first)
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// 2. STATIC FILES (before API routes)
// ============================================

// Uploads folder - ONE route only, with absolute path
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// 3. API ROUTES
// ============================================
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const memberRoutes = require('./routes/members');
const appointmentRoutes = require('./routes/appointments');
const contactRoutes = require('./routes/contact');
const galleryRoutes = require('./routes/gallery');
const enquiryRoutes = require('./routes/enquiries');
const matrimonyRoutes = require('./routes/matrimony');
const weddingRoutes = require('./routes/wedding');
const constructionRoutes = require('./routes/construction');
const templeRoutes = require('./routes/temple');
const astrologyRoutes = require('./routes/astrology');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/matrimony', matrimonyRoutes);
app.use('/api/wedding', weddingRoutes);
app.use('/api/construction', constructionRoutes);
app.use('/api/temple', templeRoutes);
app.use('/api/astrology', astrologyRoutes);

// ============================================
// 4. FRONTEND STATIC FILES (after API routes)
// ============================================
app.use(express.static(path.join(__dirname, 'frontend')));

// Specific paths for member area
app.use('/member', express.static(path.join(__dirname, 'frontend')));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ============================================
// 5. CACHE CONTROL (for HTML files)
// ============================================
app.use((req, res, next) => {
    if (req.url.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// ============================================
// 6. ERROR HANDLING (last)
// ============================================
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large.'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
    });
});

// ============================================
// 7. START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
