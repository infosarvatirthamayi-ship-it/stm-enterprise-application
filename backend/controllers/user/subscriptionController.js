const User = require("../../models/User");
const Membership = require("../../models/Membership");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

/**
 * STEP 1: Generate the Razorpay Order for the Membership
 */
exports.createSubscriptionOrder = async (req, res) => {
    try {
        const { membershipId } = req.body; // The MongoDB _id of the Membership plan

        // 1. Validate the Membership Plan
        const membershipPlan = await Membership.findById(membershipId);
        if (!membershipPlan || membershipPlan.status === 0) {
            return res.status(404).json({ status: "false", success: false, message: "Membership plan not found or inactive." });
        }

        const amountInPaise = Math.round(membershipPlan.price * 100);

        // 2. Prevent buying free memberships through Razorpay
        if (amountInPaise <= 0) {
            return res.status(400).json({ status: "false", success: false, message: "This plan does not require payment." });
        }

        // 3. Generate Razorpay Order
        const rzp = getRazorpayInstance();
        const order = await rzp.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `mem_${req.user.id.substring(0, 5)}_${Date.now()}`
        });

        return res.status(200).json({
            status: "true",
            success: true,
            message: "Subscription order generated.",
            data: {
                order_id: order.id,
                amount: membershipPlan.price,
                public_key: process.env.RAZORPAY_KEY_ID,
                membership_name: membershipPlan.name
            }
        });

    } catch (error) {
        console.error("🔥 Subscription Order Error:", error);
        res.status(500).json({ status: "false", success: false, message: error.message });
    }
};

/**
 * STEP 2: Verify Payment & Activate the 25% Club Status!
 */
exports.verifyAndActivateMembership = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, membershipId } = req.body;

        // 1. Verify Razorpay Signature (Security Check)
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ status: "false", success: false, message: "Payment security verification failed." });
        }

        // 2. Fetch the plan to calculate the expiration date
        const membershipPlan = await Membership.findById(membershipId);
        if (!membershipPlan) return res.status(404).json({ status: "false", message: "Membership plan missing." });

        // 3. Calculate Expiration Date dynamically
        const expirationDate = new Date();
        if (membershipPlan.duration_type === 1) {
            // Add Months
            expirationDate.setMonth(expirationDate.getMonth() + membershipPlan.duration);
        } else if (membershipPlan.duration_type === 2) {
            // Add Years
            expirationDate.setFullYear(expirationDate.getFullYear() + membershipPlan.duration);
        }

        // 4. Update the User Profile (Unlock the 25% Club!)
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {
                is_club_member: true,
                club_membership_expires: expirationDate
            },
            { new: true } // Returns the updated document
        );

        return res.status(200).json({
            status: "true",
            success: true,
            message: `Welcome to the VIP Club! Your 25% discount is active until ${expirationDate.toDateString()}.`,
            user: {
                is_club_member: updatedUser.is_club_member,
                expires: updatedUser.club_membership_expires
            }
        });

    } catch (error) {
        console.error("🔥 Subscription Verification Error:", error);
        res.status(500).json({ status: "false", success: false, message: error.message });
    }
};

/**
 * STEP 3: Get Active Memberships for the Mobile App to display
 */
exports.getAvailableMemberships = async (req, res) => {
    try {
        const memberships = await Membership.find({ status: 1 }).sort({ price: 1 });
        res.status(200).json({ status: "true", success: true, data: memberships });
    } catch (error) {
        res.status(500).json({ status: "false", success: false, message: error.message });
    }
};