const express = require('express');
const db = require('../config/db');
const router = express.Router();

// Book appointment (for both members and non-members)
router.post('/book', async (req, res) => {
    console.log('📅 ====== APPOINTMENT BOOKING REQUEST ======');
    console.log('📝 Request body:', req.body);
    
    try {
        const { fullName, mobile, email, preferredDate, preferredTime, serviceCategory, address, remarks } = req.body;

        // Validate required fields
        if (!fullName || !mobile || !preferredDate || !serviceCategory) {
            console.log('❌ Missing required fields:', { fullName, mobile, preferredDate, serviceCategory });
            return res.status(400).json({ 
                success: false, 
                message: 'Name, mobile, date and service are required' 
            });
        }

        console.log('✅ Validation passed. Inserting into database...');
        
        // Insert into database
        const [result] = await db.query(
            `INSERT INTO appointments 
            (name, email, phone, service_type, appointment_date, preferred_time, address, remarks, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [fullName, email || null, mobile, serviceCategory, preferredDate, preferredTime || null, address || null, remarks || null]
        );

        console.log('✅ Appointment saved successfully. ID:', result.insertId);

        res.json({ 
            success: true, 
            message: 'Appointment booked successfully! We will contact you soon.',
            appointmentId: result.insertId 
        });
    } catch (error) {
        console.error('❌ Database error:', error);
        console.error('Error details:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

// Get all appointments (for admin)
router.get('/all', async (req, res) => {
    try {
        const { from_date, to_date, status } = req.query;
        
        console.log('📋 Fetching appointments with filters:', { from_date, to_date, status });
        
        let query = 'SELECT * FROM appointments ORDER BY appointment_date DESC';
        let params = [];
        
        if (from_date && to_date) {
            query = 'SELECT * FROM appointments WHERE DATE(appointment_date) BETWEEN ? AND ? ORDER BY appointment_date DESC';
            params = [from_date, to_date];
        } else if (status) {
            query = 'SELECT * FROM appointments WHERE status = ? ORDER BY appointment_date DESC';
            params = [status];
        }
        
        const [appointments] = await db.query(query, params);
        console.log(`✅ Found ${appointments.length} appointments`);
        res.json({ success: true, appointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update appointment status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        console.log(`📋 Updating appointment ${id} status to ${status}`);
        
        await db.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete appointment
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Deleting appointment ${id}`);
        
        await db.query('DELETE FROM appointments WHERE id = ?', [id]);
        res.json({ success: true, message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;