const mongoose = require('mongoose');
require('dotenv').config();

const Complaint = require('./models/Complaint');
const User = require('./models/User');

async function fixOrphanedComplaints() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Get all users
        const users = await User.find({}).select('_id name email');

        console.log('Current users in DB:');
        users.forEach(u => {
            console.log(`  ${u._id} — ${u.name} (${u.email})`);
        });

        if (users.length === 0) {
            console.log('\n❌ No users found! Aborting...');
            return;
        }

        // Create a Set for fast lookup
        const userIds = new Set(users.map(u => u._id.toString()));

        // Find orphaned complaints
        const complaints = await Complaint.find({});
        const orphaned = complaints.filter(c =>
            !c.user_id || !userIds.has(c.user_id.toString())
        );

        console.log(`\nFound ${orphaned.length} orphaned complaint(s).`);

        if (orphaned.length === 0) {
            console.log('✅ Nothing to fix!');
            return;
        }

        // Choose user (first user)
        const targetUser = users[0];
        console.log(`\nReassigning to: ${targetUser.name} (${targetUser._id})`);

        // Collect IDs
        const orphanIds = orphaned.map(c => c._id);

        // ✅ Single DB update (FAST)
        const result = await Complaint.updateMany(
            { _id: { $in: orphanIds } },
            { $set: { user_id: targetUser._id } }
        );

        console.log(`\n✅ Updated ${result.modifiedCount} complaint(s)`);

        console.log('\nDone! All orphaned complaints fixed.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

fixOrphanedComplaints();