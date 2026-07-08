// backend/models/SuperAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const superAdminSchema = new mongoose.Schema({
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, trim: true, default: "" },
    name: { type: String }, 
    
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    
    // Hardcoded Security Identifiers
    role: { type: String, default: 'super_admin' }, 
    user_type: { type: Number, default: 1 }, 
    
    // Security Logs
    last_login: { type: Date, default: null }
}, { 
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

superAdminSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

superAdminSchema.pre('save', async function(next) {
    if (this.isModified('first_name') || this.isModified('last_name')) {
        this.name = `${this.first_name} ${this.last_name || ''}`.trim();
    }

    if (this.isModified('password')) {
        const isAlreadyHashed = this.password.startsWith('$2b$') || this.password.startsWith('$2a$');
        if (!isAlreadyHashed) {
            const salt = await bcrypt.genSalt(12);
            this.password = await bcrypt.hash(this.password, salt);
        }
    }
    //next();
});

module.exports = mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', superAdminSchema, 'super_admins');