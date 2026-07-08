require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // Check this path matches your structure
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to DB...");

    const newEmail = "superadmin@stmclub.com";
    const rawPassword = "password123";

    // 1. Wipe any existing broken attempt for this email
    await User.deleteOne({ email: newEmail });

    // 2. Force the bcrypt hash manually to bypass any schema hooks failing
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // 3. Create a 100% clean Admin record
    await User.create({
        first_name: "Master",
        last_name: "Admin",
        name: "Master Admin",
        email: newEmail,
        mobile_number: "9999999999",
        password: hashedPassword,
        user_type: 1, // 1 = Super Admin
        role: "admin",
        is_verified: true,
        sql_id: Math.floor(Math.random() * 900000)
    });

    console.log("✅ Clean Admin Created Successfully!");
    console.log("👉 Go to your frontend and log in right now with:");
    console.log(`Email: ${newEmail}`);
    console.log(`Password: ${rawPassword}`);
    process.exit(0);
}).catch(err => {
    console.error("Failed:", err);
    process.exit(1);
});