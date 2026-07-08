// backend/utils/NotificationHub.js
require('dotenv').config();
const twilio = require('twilio');
const nodemailer = require('nodemailer');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

let twilioClient = null;
if (accountSid && authToken && verifyServiceSid) {
    twilioClient = twilio(accountSid, authToken);
} else {
    console.warn("⚠️ [NotificationHub] Twilio credentials missing. SMS verification will use local fallback.");
}

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT || 465),
    secure: true,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    tls: { rejectUnauthorized: false }
});

class NotificationHub {
    static async dispatchOtp(email, mobileNumber, rawOtp, subject = "Verification Code") {
        const dispatches = [];

        // 1. Email Channel
        if (Number(process.env.ENABLE_EMAIL_OTP) === 1 && email) {
            dispatches.push(
                transporter.sendMail({
                    from: `Sarvatirthamayi <${process.env.MAIL_FROM}>`,
                    to: email,
                    subject: subject,
                    html: `<b>Your code is: <span style="font-size: 16px; letter-spacing: 2px;">${rawOtp}</span></b>`
                }).catch(err => console.error(`🚨 Email Fault: ${err.message}`))
            );
        }

        // 2. Twilio Verify (SMS)
        if (Number(process.env.ENABLE_SMS_OTP) === 1 && twilioClient && mobileNumber) {
            dispatches.push(
                twilioClient.verify.v2.services(verifyServiceSid).verifications
                .create({ to: mobileNumber, channel: 'sms' })
                .catch(err => console.error(`🚨 Twilio SMS Fault: ${err.message}`))
            );
        }

        // 3. Twilio Verify (WhatsApp)
        if (Number(process.env.ENABLE_WHATSAPP_OTP) === 1 && twilioClient && mobileNumber) {
            dispatches.push(
                twilioClient.verify.v2.services(verifyServiceSid).verifications
                .create({ to: `whatsapp:${mobileNumber}`, channel: 'whatsapp' })
                .catch(err => console.error(`🚨 Twilio WhatsApp Fault: ${err.message}`))
            );
        }

        await Promise.allSettled(dispatches);
    }

    static async verifyMobileToken(mobileNumber, code) {
        // 🧪 QA BYPASS: Catch the Magic OTP immediately
        if (String(code).trim() === (process.env.MAGIC_OTP || "111111")) {
            console.log(`🟢 [QA MASTER KEY] Accepted for ${mobileNumber}`);
            return true;
        }

        if (!twilioClient) return false;

        try {
            const check = await twilioClient.verify.v2.services(verifyServiceSid)
                .verificationChecks.create({ to: mobileNumber, code: String(code).trim() });
            return check.status === 'approved';
        } catch (error) {
            console.error(`[Twilio Verify Error]:`, error.message);
            return false;
        }
    }
}

module.exports = NotificationHub;