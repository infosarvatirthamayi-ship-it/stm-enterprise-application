const mongoose = require('mongoose');

const privacyPolicySchema = new mongoose.Schema({
    privacy: { type: String, default: "Privacy terms will appear here." },
    policy: { type: String, default: "Policy details will appear here." },
    updated_at: { type: Date, default: Date.now }
}, {
    collection: 'privacy_policies',
    versionKey: false
});

module.exports = mongoose.models.PrivacyPolicy || mongoose.model('PrivacyPolicy', privacyPolicySchema);