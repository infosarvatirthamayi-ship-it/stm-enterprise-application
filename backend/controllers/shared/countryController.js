// 🎯 Import the perfect model you just created!
const Country = require('../../models/Country');

exports.getActiveCountries = async (req, res) => {
    try {
        // Fetch only active countries (status: 1), sorted alphabetically by name
        const countries = await Country.find({ status: 1 }).sort({ name: 1 });
        
        return res.status(200).json({
            status: "true",
            success: true,
            data: countries
        });
    } catch (error) {
        console.error("🌍 Countries Fetch Error:", error);
        return res.status(500).json({ status: "false", success: false, message: "Failed to fetch countries." });
    }
};