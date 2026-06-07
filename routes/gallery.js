const express = require('express');
const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const { verifyToken, verifyRole } = require('../middleware/auth');
const { uploadGallery } = require('../middleware/upload');
const router = express.Router();

// Get all gallery images (public)
router.get('/all', async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM gallery ORDER BY uploaded_at DESC';
        let params = [];
        
        if (category && category !== 'all') {
            query = 'SELECT * FROM gallery WHERE category = ? ORDER BY uploaded_at DESC';
            params = [category];
        }
        
        const [images] = await db.query(query, params);
        
        // Add full URL for images
        const imagesWithUrl = images.map(img => ({
            ...img,
            image_url: img.image_url // Already has the path
        }));
        
        res.json({ success: true, images: imagesWithUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get images by category (public)
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const [images] = await db.query(
            'SELECT * FROM gallery WHERE category = ? ORDER BY uploaded_at DESC',
            [category]
        );
        res.json({ success: true, images });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Upload new gallery image (admin only)
router.post('/upload', verifyToken, verifyRole(['super_admin', 'admin']), uploadGallery.single('image'), async (req, res) => {
    try {
        const { title, description, category } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file uploaded' });
        }

        if (!category) {
            return res.status(400).json({ success: false, message: 'Category is required' });
        }

        // Store relative path in database
        const image_url = `/uploads/${category}/${req.file.filename}`;
        
        const [result] = await db.query(
            'INSERT INTO gallery (title, description, image_url, category, uploaded_by) VALUES (?, ?, ?, ?, ?)',
            [title || null, description || null, image_url, category, req.admin.id]
        );
        
        res.json({ 
            success: true, 
            message: 'Image uploaded successfully to ' + category + ' folder',
            image: {
                id: result.insertId,
                title,
                description,
                image_url,
                category
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Delete gallery image (admin only)
router.delete('/:id', verifyToken, verifyRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get image info from database
        const [images] = await db.query('SELECT image_url, category FROM gallery WHERE id = ?', [id]);
        
        if (images.length === 0) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }
        
        const image = images[0];
        
        // Delete physical file
        const filePath = path.join(__dirname, '..', image.image_url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Delete from database
        await db.query('DELETE FROM gallery WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get gallery stats
router.get('/stats', async (req, res) => {
    try {
        const [stats] = await db.query(
            'SELECT category, COUNT(*) as count FROM gallery GROUP BY category'
        );
        res.json({ success: true, stats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;