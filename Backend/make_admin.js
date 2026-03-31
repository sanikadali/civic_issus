const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const makeAdmin = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Find user by email (from screenshot context or generic)
        // I will try to find "sarvaghna reddy" by name or just pick the first user
        // Ideally prompt for email, but I'll search for the name seen in screenshot
        const user = await User.findOne({ email: 'dalisampada@gmail.com' });

        if (user) {
            user.role = 'admin';
            await user.save();
            console.log(`User ${user.name} (${user.email}) is now an Admin!`);
        } else {
            console.log('User "sampada dali" not found. Making the FIRST user an admin...');
            const firstUser = await User.findOne({});
            if (firstUser) {
                firstUser.role = 'admin';
                await firstUser.save();
                console.log(`User ${firstUser.name} (${firstUser.email}) is now an Admin!`);
            } else {
                console.log('No users found in database.');
            }
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

makeAdmin();
