const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb://localhost:27017/stm_club';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB...'))
  .catch(err => console.error('❌ Connection error:', err));

// Temporary models for migration (forces the correct collection names)
const Event = mongoose.model('Event', new mongoose.Schema({}, { strict: false, collection: 'events' }));
const EventBooking = mongoose.model('EventBooking', new mongoose.Schema({}, { strict: false, collection: 'event_bookings' }));

// 🎯 THE PRO FIX: A custom SQL row parser that ignores commas inside text 
// and perfectly handles escaped apostrophes (like "O\'Hara")
function parseSqlRow(rowStr) {
    const values = [];
    let currentVal = '';
    let inString = false;
    let isEscaped = false;

    for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];

        if (isEscaped) {
            currentVal += char;
            isEscaped = false;
        } else if (char === '\\') {
            isEscaped = true; // Next character is escaped
        } else if (char === "'") {
            inString = !inString; // Toggle string state
        } else if (char === ',' && !inString) {
            values.push(currentVal.trim());
            currentVal = '';
        } else {
            currentVal += char;
        }
    }
    values.push(currentVal.trim());

    // Clean up the extracted values (remove NULLs and outer quotes)
    return values.map(v => {
        if (v === 'NULL' || v === '') return null;
        return v.replace(/^'|'$/g, '');
    });
}

async function runImport() {
  try {
    const sqlPath = path.join(__dirname, 'stm_club.sql'); 
    
    if (!fs.existsSync(sqlPath)) {
        console.error("❌ Error: stm_club.sql file not found in this folder!");
        return;
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // --- 1. IMPORT EVENTS ---
    const eventSplit = sqlContent.split(/INSERT INTO `events` .*? VALUES/gi);
    if (eventSplit.length > 1) {
        let allValues = eventSplit.slice(1).join(' ').split(/\),\n/g).map(s => s.replace(/\);$/, ''));
        
        const eventData = allValues.map(row => {
            let cleanRow = row.trim().replace(/^\(/, '').replace(/\)$/, '');
            const v = parseSqlRow(cleanRow);
            
            if (!v || v.length < 5) return null; // Skip empty/broken rows

            return {
                sql_id: parseInt(v[0]),
                temple_id: parseInt(v[1]),
                name: v[2],
                short_description: v[3],
                long_description: v[4],
                status: parseInt(v[5]) || 1,
                date: v[6],
                price: parseFloat(v[7]) || 0,
                image: v[8]
            };
        }).filter(item => item && item.name); // Drop nulls
        
        await Event.deleteMany({});
        await Event.insertMany(eventData);
        console.log(`🚀 Migrated ${eventData.length} Events cleanly.`);
    }

    // --- 2. IMPORT EVENT BOOKINGS ---
    const bookSplit = sqlContent.split(/INSERT INTO `event_bookings` .*? VALUES/gi);
    if (bookSplit.length > 1) {
        let allValues = bookSplit.slice(1).join(' ').split(/\),\n/g).map(s => s.replace(/\);$/, ''));
        
        const bookingData = allValues.map(row => {
            let cleanRow = row.trim().replace(/^\(/, '').replace(/\)$/, '');
            const v = parseSqlRow(cleanRow);
            
            if (!v || v.length < 8) return null;

            return {
                sql_id: parseInt(v[0]),
                booking_id: v[1],
                user_id: parseInt(v[2]),
                temple_id: parseInt(v[3]),
                event_id: parseInt(v[4]),
                whatsapp_number: v[5],
                devotees_name: v[6],
                wish: v[7],
                booking_status: parseInt(v[8]) || 1,
                payment_type: parseInt(v[9]) || 1,
                payment_status: parseInt(v[10]) || 1,
                razorpay_order_id: v[11],
                paid_amount: parseFloat(v[17]) || 0
            };
        }).filter(item => item && item.devotees_name);

        await EventBooking.deleteMany({});
        await EventBooking.insertMany(bookingData);
        console.log(`🚀 Migrated ${bookingData.length} Event Bookings cleanly.`);
    }

    console.log("✅ All migrations complete!");
    process.exit();
  } catch (error) {
    console.error('❌ Migration Error:', error);
    process.exit(1);
  }
}

runImport();