const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    issueType: String,
    description: String,
    photo: String,
    location_coords: { lat: Number, lng: Number },
    address: String,
    assigned_to: String,
    status: {
        type: String,
        enum: ["received", "in_review", "resolved", "rejected"],
        default: "received"
    }
}, { timestamps: true });


module.exports = mongoose.model("Complaint", complaintSchema);
