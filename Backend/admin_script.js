const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        console.log('Connecting to DB...');
        // console.log('URI:', process.env.MONGO_URI); // careful with logs
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        console.log('Fetching users...');
        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        if (users.length === 0) {
            console.log('No users found.');
            process.exit();
        }

        // Print users
        users.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.role}]`));

        // Find sampada
    const email = 'dalisampada@gmail.com'; // change this

    let targetUser = users.find(u => u.email === email);        
    if (!targetUser) {
            console.log('Sampada not found, using first user.');
            targetUser = users[0];
        }

        console.log(`Promoting ${targetUser.email} to admin...`);
        targetUser.role = 'admin';
        await targetUser.save();
        console.log('Success! User is now admin.');

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

run();
