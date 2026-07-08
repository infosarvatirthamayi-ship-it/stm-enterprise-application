const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE === 'true' || process.env.MAIL_PORT == 465,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

exports.signupUser = async (req, res) => {
    try {
        const { first_name, last_name, email, mobile_number, password } = req.body;
        if (!first_name || !mobile_number || !email || !password) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        const cleanMobile = mobile_number.trim();
        const cleanEmail = email.toLowerCase().trim();

        let user = await User.findOne({ $or: [{ mobile_number: cleanMobile }, { email: cleanEmail }] });
        if (user && user.is_verified) return res.status(400).json({ success: false, message: "Already registered." });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        if (user) {
            user.otp = otp;
            user.otp_expires = expiry;
        } else {
            user = new User({ first_name, last_name, email: cleanEmail, mobile_number: cleanMobile, password, otp, otp_expires: expiry });
        }

        await user.save();

        try {
            await transporter.sendMail({ 
                from: process.env.MAIL_FROM, 
                to: cleanEmail, 
                subject: "Verify Account", 
                html: `<h1>Your OTP is: ${otp}</h1>` 
            });
        } catch (mailErr) {
            console.log(`👉 DEBUG OTP: ${otp}`);
        }

        res.status(200).json({ success: true, message: "OTP Sent" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { mobile_number, otp } = req.body;
        const user = await User.findOne({ mobile_number: mobile_number?.trim() });
        
        if (!user || user.otp !== otp || user.otp_expires < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        user.is_verified = true;
        user.otp = undefined;
        await user.save();
        res.status(200).json({ success: true, message: "Verified" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// 🎯 THE FIX: Robust Login with Cookie Injection & Mobile/Email support
exports.loginUser = async (req, res) => {
    try {
        // Accepts both identifier (frontend default) OR email/mobile directly
        const { identifier, email, mobile_number, mobile, password } = req.body;
        const loginId = String(identifier || email || mobile_number || mobile || "").trim().toLowerCase();

        if (!loginId || !password) {
            return res.status(400).json({ success: false, message: "Missing credentials." });
        }

        // Determine if input is Email or Mobile
        let query = {};
        if (loginId.includes('@')) {
            query = { email: loginId };
        } else {
            // 1. Strip all non-digit characters (e.g., +, spaces, dashes)
            const cleanInput = loginId.replace(/\D/g, ""); 
            
            // 2. Extract the last 10 digits to act as our base search
            const baseTen = cleanInput.slice(-10); 

            // 3. Search for exact matches across all likely storage permutations
            query = { 
                $or: [
                    { mobile_number: baseTen },                            // e.g., 9182635762
                    { mobile_number: `91${baseTen}` },                     // e.g., 919182635762
                    { mobile_number: `+91${baseTen}` },                    // e.g., +919182635762
                    { mobile_number: { $regex: new RegExp(baseTen + "$") } }// Fallback: ends with 10 digits
                ] 
            };
        }

        const user = await User.findOne(query);
        if (!user) {
            return res.status(404).json({ success: false, message: "Account not found." });
        }

        const isPasswordMatch = await user.matchPassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        
        // 🎯 CRITICAL: Set the HTTP-Only cookie for React context to pick up
        res.cookie("access_token", token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: "lax",
            path: '/'
        });

        res.status(200).json({ 
            success: true, 
            token, 
            user: { id: user._id, name: user.name, first_name: user.first_name, role: user.role } 
        });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
};

// 🎯 THE FIX: Add the Missing Logout Function
exports.logoutUser = async (req, res) => {
    try {
        res.clearCookie("access_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "lax",
            path: '/'
        });
        return res.status(200).json({ success: true, message: "Logged out successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Logout failed." });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        
        if (!user) {
            return res.status(404).json({ status: "false", success: false, message: "User not found" });
        }

        return res.status(200).json({
            status: "true",  
            success: true,   
            message: "Profile retrieved successfully.", 
            data: {
                user_id: user.sql_id || parseInt(user._id.toString().substring(0, 8), 16),
                userId: user.sql_id || parseInt(user._id.toString().substring(0, 8), 16),
                id: user._id.toString(),
                user_type: String(user.user_type || "3"),
                userType: String(user.user_type || "3"),
                first_name: user.first_name || "",
                firstName: user.first_name || "",
                last_name: user.last_name || "",
                lastName: user.last_name || "",
                name: user.name || `${user.first_name} ${user.last_name || ''}`.trim(),
                email: user.email || "",
                mobile_number: user.mobile_number || "",
                mobileNumber: user.mobile_number || "",
                profile_picture: user.profile_picture || "",
                profilePicture: user.profile_picture || "",
                banner_image: user.banner_image || "",
                date_of_birth: user.date_of_birth || "",
                dateOfBirth: user.date_of_birth || "",
                gender: String(user.gender || "1"),
                role: user.role || (user.user_type === 1 ? "admin" : user.user_type === 2 ? "temple_admin" : "user"),
                is_verified: user.is_verified || false
            }
        });
    } catch (error) {
        console.error("🔥 Profile API Error:", error);
        res.status(500).json({ status: "false", success: false, message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { first_name, last_name, email, mobile_number, date_of_birth, gender } = req.body;

        const updateData = {
            first_name,
            last_name,
            email,
            mobile_number,
            date_of_birth,
            gender: String(gender || "1"),
            name: `${first_name} ${last_name || ''}`.trim()
        };

        if (req.files) {
            if (req.files.profile_picture && req.files.profile_picture.length > 0) {
                updateData.profile_picture = req.files.profile_picture[0].path;
            }
            if (req.files.banner_image && req.files.banner_image.length > 0) {
                updateData.banner_image = req.files.banner_image[0].path;
            }
        } else if (req.file) {
            updateData.profile_picture = req.file.path;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { returnDocument: 'after', runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ status: "false", message: "User not found" });
        }

        return res.status(200).json({
            status: "true",
            success: true,
            message: "Profile updated successfully.", 
            data: updatedUser // Simplified for response payload
        });
    } catch (error) {
        console.error("🔥 Update Error:", error);
        res.status(500).json({ status: "false", message: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ created_at: -1 });
        res.status(200).json({ success: true, users });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        res.status(200).json({ success: true, user });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateUser = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.files) {
            if (req.files.profile_picture) updateData.profile_picture = req.files.profile_picture[0].path;
            if (req.files.banner_image) updateData.banner_image = req.files.banner_image[0].path;
        } else if (req.file) {
            updateData.profile_picture = req.file.path;
        }

        const updated = await User.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData }, 
            { returnDocument: 'after' }
        ).select("-password");

        if (!updated) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, data: updated });
    } catch (error) { 
        res.status(400).json({ success: false, message: error.message || "Update failed" }); 
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (error) { res.status(500).json({ success: false, message: "Delete failed" }); }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { mobile_number, email } = req.body;
        
        let query = {};
        if (mobile_number) {
            const cleanMobile = String(mobile_number).replace(/\D/g, "").slice(-10);
            query = { mobile_number: cleanMobile };
        } else if (email) {
            query = { email: email.toLowerCase().trim() };
        } else {
            return res.status(400).json({ status: "false", message: "Input required." });
        }

        const user = await User.findOne(query);
        if (!user) return res.status(404).json({ status: "false", message: "User not found." });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otp_expires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        try {
            await transporter.sendMail({
                from: process.env.MAIL_FROM,
                to: user.email,
                subject: "Reset Password OTP",
                html: `<h1>Your Reset Code: ${otp}</h1>`
            });
        } catch (err) {
            console.log(`❌ Mail failed. USE THIS OTP FOR TESTING: ${otp}`);
        }

        res.status(200).json({ 
            status: "true", 
            success: true, 
            message: "OTP sent successfully.",
            data: { 
                id: user.sql_id || user._id.toString(), 
                mobile_number: user.mobile_number 
            } 
        });
    } catch (error) { 
        res.status(500).json({ status: "false", success: false, message: error.message }); 
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { user_id, password, confirm_password, otp } = req.body;

        if (password !== confirm_password) {
            return res.status(400).json({ status: "false", message: "Passwords do not match." });
        }

        const user = await User.findOne({
            $or: [
                { sql_id: !isNaN(user_id) ? Number(user_id) : -1 },
                { _id: user_id.length === 24 ? user_id : null }
            ]
        });

        if (!user || user.otp !== otp || user.otp_expires < Date.now()) {
            return res.status(400).json({ status: "false", message: "Invalid or Expired OTP." });
        }

        user.password = password;
        user.otp = undefined; 
        await user.save();

        res.status(200).json({ 
            status: "true", 
            success: true, 
            message: "Password reset successful." 
        });
    } catch (error) { 
        res.status(500).json({ status: "false", message: error.message }); 
    }
};

// 🎯 THE FIX: Ensure all methods, especially logoutUser, are exported!
module.exports = {
    signupUser: exports.signupUser,
    signUp: exports.signupUser,     
    verifyOtp: exports.verifyOtp,
    verifyOTP: exports.verifyOtp,   
    loginUser: exports.loginUser,
    login: exports.loginUser,       
    logoutUser: exports.logoutUser, // ADDED
    logout: exports.logoutUser,     // ADDED
    getProfile: exports.getProfile, 
    updateProfile: exports.updateProfile,
    checkAuth: exports.getProfile,  
    getMe: exports.getProfile,      
    getAllUsers: exports.getAllUsers,
    getUserById: exports.getUserById,
    forgotPassword: exports.forgotPassword, 
    resetPassword: exports.resetPassword,   
    updateUser: exports.updateUser,
    deleteUser: exports.deleteUser
};