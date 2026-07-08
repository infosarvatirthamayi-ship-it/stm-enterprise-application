// controllers/mobile/mobileProfileController.js
const User = require("../../models/User");
const { getFullImageUrl } = require("../../utils/config"); // Ensure this is imported

// --- 🧠 MOBILE-SPECIFIC SERIALIZER ---
const serializeMobileUser = (user) => {
  if (!user) return null;
  
  return {
    id: user._id.toString(),
    userId: String(user.sql_id || 0),
    userType: String(user.user_type || "3"),
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    email: user.email || "",
    mobileNumber: user.mobile_number || "",
    profilePicture: user.profile_picture ? getFullImageUrl(user.profile_picture) : "",
    bannerImage: user.banner_image ? getFullImageUrl(user.banner_image) : "",
    dateOfBirth: user.date_of_birth || "",
    gender: String(user.gender || "1"),
    role: user.role || "user"
  };
};

// --- MOBILE LOGIN ---
// --- MOBILE LOGIN ---
exports.loginMobile = async (req, res) => {
  try {
    const { mobile_number, password } = req.body;
    const cleanMobile = String(mobile_number).replace(/\D/g, "").slice(-10);

    const user = await User.findOne({ mobile_number: cleanMobile });
    // 🎯 ADDED: Security check for verification status
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    if (!user.is_verified) {
      return res.status(401).json({ success: false, message: "Account unverified." });
    }

    const token = require("jsonwebtoken").sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    return res.status(200).json({
      success: true,
      token,
      data: serializeMobileUser(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// --- MOBILE PROFILE FETCH ---
exports.getMobileProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({
      success: true,
      data: serializeMobileUser(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- MOBILE PROFILE UPDATE ---
exports.updateMobileProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Map incoming camelCase from Flutter
    const { firstName, lastName, email, mobileNumber, dateOfBirth, gender } = req.body;
    
    if (firstName) user.first_name = firstName;
    if (lastName) user.last_name = lastName;
    if (email) user.email = email.toLowerCase();
    if (dateOfBirth) user.date_of_birth = dateOfBirth;
    if (gender) user.gender = gender;
    if (mobileNumber) user.mobile_number = mobileNumber.replace(/\D/g, "").slice(-10);

    // Handle File Uploads (Assuming Multer is configured on the mobile route)
    if (req.files) {
      if (req.files.profilePicture) user.profile_picture = req.files.profilePicture[0].path;
      if (req.files.bannerImage) user.banner_image = req.files.bannerImage[0].path;
    }

    await user.save();
    return res.status(200).json({ success: true, data: serializeMobileUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};