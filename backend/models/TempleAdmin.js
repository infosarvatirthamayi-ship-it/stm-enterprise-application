// backend/models/TempleAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const templeAdminSchema = new mongoose.Schema({
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, trim: true, default: "" },
    name: { type: String }, 
    
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile_number: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    
    // The critical foreign key linking them to a specific Temple
    temple_id: { type: String, required: true }, 
    
    // Hardcoded Security Identifiers
    role: { type: String, default: 'temple_admin' }, 
    user_type: { type: Number, default: 2 }, 
    
    // Super Admins can freeze this account
    is_active: { type: Boolean, default: true }
}, { 
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

templeAdminSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

templeAdminSchema.pre('save', async function(next) {
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

module.exports = mongoose.models.TempleAdmin || mongoose.model('TempleAdmin', templeAdminSchema, 'temple_admins');