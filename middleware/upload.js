// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Create all category folders (for gallery)
const categories = ['catering', 'astrology', 'wedding', 'matrimony', 'temple', 'construction'];
categories.forEach(cat => {
    ensureDirectoryExists(`uploads/${cat}`);
});

// Also create matrimony profiles subfolder (separate from gallery)
ensureDirectoryExists('uploads/matrimony/profiles');

// Create astrology horoscope folder (legacy location)
ensureDirectoryExists('uploads/astrology/horoscope');

// ============================================
// GALLERY UPLOAD (your existing - UNCHANGED)
// ============================================
const galleryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = req.body.category || 'catering';
        const dir = `uploads/${category}`;
        ensureDirectoryExists(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const galleryFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const uploadGallery = multer({
    storage: galleryStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: galleryFileFilter
});

// ============================================
// MATRIMONY PROFILE UPLOAD (separate subfolder)
// Files saved to: uploads/matrimony/profiles/
// Naming: reqid+1.jpg, reqid+2.pdf
// ============================================
const matrimonyStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureDirectoryExists('uploads/matrimony/profiles');
        cb(null, 'uploads/matrimony/profiles/');
    },
    filename: (req, file, cb) => {
        const reqId = req.body.req_id || req.reqId || 'TEMP';
        const suffix = file.fieldname === 'profileImage' ? '+1' : '+2';
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${reqId}${suffix}${ext}`);
    }
});

const matrimonyFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === 'profileImage') {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Profile photo must be JPG, PNG, or WEBP'));
        }
    } else if (file.fieldname === 'horoscopeDoc') {
        const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Horoscope must be PDF, JPG, or PNG'));
        }
    } else {
        cb(null, true);
    }
};

const uploadMatrimony = multer({
    storage: matrimonyStorage,
    fileFilter: matrimonyFileFilter,
    limits: { fileSize: 8 * 1024 * 1024 }
});

const matrimonyUploadFields = uploadMatrimony.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'horoscopeDoc', maxCount: 1 }
]);

// ============================================
// ASTROLOGY UPLOAD (horoscope files)
// Files saved to: uploads/astrology/horoscope/
// Naming: reqid+1.pdf, reqid+2.jpg, reqid+3.png, etc.
// ============================================
const astrologyStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureDirectoryExists('uploads/astrology/horoscope');
        cb(null, 'uploads/astrology/horoscope/');
    },
    filename: (req, file, cb) => {
        const reqId = req.body.req_id || req.reqId || 'TEMP';
        const ext = path.extname(file.originalname).toLowerCase();
        
        // Initialize or increment file counter for this request
        if (!req.fileCounter) {
            req.fileCounter = 1;
        }
        const fileIndex = req.fileCounter;
        req.fileCounter = fileIndex + 1;
        
        cb(null, `${reqId}+${fileIndex}${ext}`);
    }
});

const astrologyFileFilter = (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, JPG, JPEG, PNG allowed for horoscope uploads'));
    }
};

const uploadAstrology = multer({
    storage: astrologyStorage,
    fileFilter: astrologyFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const astrologyUploadFields = uploadAstrology.fields([
    { name: 'horoscope_attachments', maxCount: 10 }
]);

// ============================================
// EXPORTS
// ============================================
module.exports = {
    uploadGallery,
    uploadMatrimony,
    matrimonyUploadFields,
    uploadAstrology,
    astrologyUploadFields
};