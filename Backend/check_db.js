const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Define User model inline to avoid require issues for this script if that was the cause
        // But better to use the real model if possible. Let's try requiring it again with verbose error.
        let User;
        try {
            User = require('./models/User');
        } catch (e) {
            console.error('Error loading User model:', e);
            process.exit(1);
        }

        const users = await User.find({});
        console.log('--- USERS ---');
        console.log(users);
        console.log('-------------');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

connectDB();
