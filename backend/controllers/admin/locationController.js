const Country = require('../../models/Country');
const City = require('../../models/City');

// ==========================================
// 🌍 COUNTRY MANAGEMENT
// ==========================================

exports.getCountries = async (req, res) => {
    try {
        // Sort alphabetically by name
        const countries = await Country.find({ status: 1 }).sort({ name: 1 });
        return res.status(200).json({ success: true, data: countries });
    } catch (error) {
        console.error("🔥 Error fetching countries:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch countries" });
    }
};

exports.addCountry = async (req, res) => {
    try {
        const { name, code, phone_code } = req.body;

        if (!name || !code || !phone_code) {
            return res.status(400).json({ success: false, message: "Name, Country Code, and Phone Code are required." });
        }

        // Prevent exact duplicates
        const existingCountry = await Country.findOne({ name: new RegExp(`^${name}$`, 'i') });
        if (existingCountry) {
            return res.status(409).json({ success: false, message: "This country already exists." });
        }

        // To maintain compatibility with your legacy data (which uses Integer _ids in compass)
        // We find the highest _id and increment it. If it fails, Mongoose will default to ObjectId.
        let newId = null;
        try {
            const lastCountry = await Country.findOne().sort({ _id: -1 });
            if (lastCountry && !isNaN(lastCountry._id)) {
                newId = Number(lastCountry._id) + 1;
            }
        } catch (e) { /* Ignore, let Mongoose handle it */ }

        const countryData = { name, code, phone_code, status: 1 };
        if (newId) countryData._id = newId;

        const country = await Country.create(countryData);

        return res.status(201).json({ success: true, message: "Country added successfully", data: country });
    } catch (error) {
        console.error("🔥 Error adding country:", error);
        return res.status(500).json({ success: false, message: "Failed to add country" });
    }
};

// ==========================================
// 🏙️ CITY MANAGEMENT
// ==========================================

exports.getCities = async (req, res) => {
    try {
        // Limit to 500 to prevent massive payload crashing the browser, sort newest first
        const cities = await City.find({ status: 1 }).sort({ _id: -1 }).limit(500);
        return res.status(200).json({ success: true, data: cities });
    } catch (error) {
        console.error("🔥 Error fetching cities:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch cities" });
    }
};

exports.addCity = async (req, res) => {
    try {
        const { name, state_id, state } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "City name is required." });
        }

        const existingCity = await City.findOne({ name: new RegExp(`^${name}$`, 'i'), state_id });
        if (existingCity) {
            return res.status(409).json({ success: false, message: "This city already exists in this state." });
        }

        // Auto-increment the legacy sql_id for your legacy APIs
        const lastCity = await City.findOne().sort({ sql_id: -1 });
        const nextSqlId = lastCity && lastCity.sql_id ? lastCity.sql_id + 1 : 1;

        const city = await City.create({
            name,
            state_id: state_id || 0,
            state: state || "",
            sql_id: nextSqlId,
            status: 1
        });

        return res.status(201).json({ success: true, message: "City added successfully", data: city });
    } catch (error) {
        console.error("🔥 Error adding city:", error);
        return res.status(500).json({ success: false, message: "Failed to add city" });
    }
};