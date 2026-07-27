const User = require("../../models/User");
const { getFullImageUrl } = require("../../utils/config");
const multer = require("multer");

// --- 🛠️ INLINE FILE PARSER ---
// Guarantees the backend can read the Flutter multipart/form-data
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Saves to your root uploads folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage: storage }).fields([
  { name: 'profile_picture', maxCount: 1 },
  { name: 'banner_image', maxCount: 1 }
]);

// --- 🧠 STRICT FROZEN-APK SERIALIZER ---
const serializeMobileUser = (user) => {
  if (!user) return null;
  
  return {
    userId: Number(user.sql_id) || 0,
    id: String(user._id || ""),
    firstName: String(user.first_name || ""),
    lastName: String(user.last_name || ""),
    email: String(user.email || ""),
    mobileNumber: String(user.mobile_number || ""),
    dateOfBirth: String(user.date_of_birth || ""),
    gender: String(user.gender || "1"),
    userType: String(user.user_type || "3"),
    role: String(user.role || "user"),
    profilePicture: user.profile_picture ? String(getFullImageUrl(user.profile_picture)) : "",
    banner_image: user.banner_image ? String(getFullImageUrl(user.banner_image)) : ""
  };
};

// --- MOBILE LOGIN ---
exports.loginMobile = async (req, res) => {
  try {
    const { mobile_number, password } = req.body;
    const cleanMobile = String(mobile_number).replace(/[^\d+]/g, ""); 
    const rawDigits = cleanMobile.replace('+', '');
    
    const query = { 
        $or: [
            { mobile_number: cleanMobile },                            
            { mobile_number: `+${rawDigits}` },                     
            { mobile_number: rawDigits },                    
            { mobile_number: rawDigits.slice(-10) } 
        ] 
    };

    const user = await User.findOne(query);
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ status: "false", message: "Invalid credentials" });
    }
    if (!user.is_verified) {
      return res.status(401).json({ status: "false", message: "Account unverified." });
    }

    const token = require("jsonwebtoken").sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    return res.status(200).json({
      status: "true",
      message: "Login successful.",
      token,
      data: serializeMobileUser(user)
    });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

// --- MOBILE PROFILE FETCH ---
exports.getMobileProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ status: "false", message: "User not found" });

    return res.status(200).json({
      status: "true",
      message: "Profile retrieved successfully.", 
      data: serializeMobileUser(user)
    });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

// --- MOBILE PROFILE UPDATE (Self-Parsing & Hook Bypass) ---
exports.updateMobileProfile = (req, res) => {
  // 1. Run the file parser first
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ status: "false", message: "File upload failed: " + err.message });
    }

    try {
      const updateData = {};

      // 2. Map incoming text fields
      if (req.body.first_name) updateData.first_name = req.body.first_name;
      if (req.body.last_name) updateData.last_name = req.body.last_name;
      if (req.body.email) updateData.email = req.body.email.toLowerCase();
      if (req.body.date_of_birth) updateData.date_of_birth = req.body.date_of_birth;
      if (req.body.gender) updateData.gender = req.body.gender;
      
      if (req.body.mobile_number) {
          let cleanMobile = String(req.body.mobile_number).replace(/[^\d+]/g, "");
          if (!cleanMobile.startsWith('+')) cleanMobile = `+${cleanMobile}`;
          updateData.mobile_number = cleanMobile;
      }

      // 3. Map successfully uploaded files
      if (req.files) {
          if (req.files.profile_picture && req.files.profile_picture.length > 0) {
              updateData.profile_picture = req.files.profile_picture[0].path.replace(/\\/g, "/");
          }
          if (req.files.banner_image && req.files.banner_image.length > 0) {
              updateData.banner_image = req.files.banner_image[0].path.replace(/\\/g, "/");
          }
      }

      // 4. Use findByIdAndUpdate to completely bypass broken Mongoose hooks
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true } // Returns the newly updated document
      );

      if (!updatedUser) {
        return res.status(404).json({ status: "false", message: "User not found" });
      }

      return res.status(200).json({ 
          status: "true", 
          message: "Profile updated successfully.", 
          data: serializeMobileUser(updatedUser) 
      });

    } catch (error) {
      return res.status(500).json({ status: "false", message: error.message });
    }
  });
};