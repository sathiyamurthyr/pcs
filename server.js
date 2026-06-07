const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const dotenv = require('dotenv');
const multer = require('multer');

dotenv.config();

const isVercel = Boolean(process.env.VERCEL);
const UPLOADS_BASE_DIR = process.env.UPLOADS_DIR || (isVercel ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, 'uploads'));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_BASE_DIR));

app.use((req, res, next) => {
    if (req.url.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});






// Routes
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


// API Routes
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


// Error handling for multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Max size is 8MB.'
            });
        }
    }
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    next();
});

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/member', express.static(path.join(__dirname, 'frontend')));

// IMPORTANT: Make root URL serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 Open: http://localhost:${PORT}`);
        console.log(`📍 Or: http://localhost:${PORT}/index.html`);
        console.log(`📍 Member login: http://localhost:${PORT}/member/login.html`);
    });
}

module.exports = app;

