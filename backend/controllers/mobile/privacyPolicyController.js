const PrivacyPolicy = require('../../models/PrivacyPolicy');

exports.getPrivacyPolicy = async (req, res) => {
    try {
        // Fetch the first policy document from the database
        const policyDoc = await PrivacyPolicy.findOne().lean();

        // 🎯 EXACT MATCH: Flutter expects a Data object with 'privacy' and 'policy' strings
        const responseData = {
            privacy: policyDoc && policyDoc.privacy ? String(policyDoc.privacy) : "Privacy terms not set.",
            policy: policyDoc && policyDoc.policy ? String(policyDoc.policy) : "Policy terms not set."
        };

        return res.status(200).json({
            status: "true",
            message: "Privacy policy retrieved successfully.",
            data: responseData
        });
    } catch (error) {
        // 🛡️ FALLBACK: Return empty strings instead of 500 error to prevent Dart UI crashes
        return res.status(200).json({
            status: "false",
            message: error.message,
            data: {
                privacy: "",
                policy: ""
            }
        });
    }
};