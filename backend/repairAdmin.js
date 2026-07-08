require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 🎯 Import the NEW SuperAdmin model instead of the User model
const SuperAdmin = require('./models/SuperAdmin'); // Adjust path based on where this script lives

const repairAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔗 Connected to MongoDB...");

        const adminEmail = "admin@gmail.com";
        
        // Explicitly hash the test password "123456"
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash("123456", salt);

        // 🎯 UPSERT ENGINE: Finds the admin to update, OR creates them if the collection is empty!
        await SuperAdmin.findOneAndUpdate(
            { email: adminEmail }, 
            { 
                $set: { 
                    first_name: "Super",
                    last_name: "Admin",
                    email: adminEmail,
                    password: hashedPassword,
                    user_type: 1,
                    role: "admin"
                } 
            },
            { upsert: true, new: true } // Upsert is the magic flag
        );

        console.log(`✅ Super Admin (${adminEmail}) seeded/repaired successfully in the isolated database!`);
        console.log("🔑 Test Password is: 123456");
        
        process.exit(0);
    } catch (err) {
        console.error("🔥 Seed/Repair failed:", err);
        process.exit(1);
    }
};

repairAdmin();