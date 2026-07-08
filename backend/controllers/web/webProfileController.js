// controllers/web/webProfileController.js

// --- FETCH WEB BOOKINGS (Placeholder) ---
exports.getMyWebBookings = async (req, res) => {
  try {
    // Since the Booking model doesn't exist yet, we just return an empty array.
    // This perfectly satisfies the React frontend so it doesn't crash or throw a 404!
    
    return res.status(200).json({
      status: "true",
      success: true,
      message: "No bookings found yet.",
      data: [] // <-- Sends a clean empty array
    });

  } catch (error) {
    return res.status(500).json({ status: "false", success: false, message: error.message });
  }
};