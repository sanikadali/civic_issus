const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

console.log("Mongo URI:", uri);  

const conn = await mongoose.connect(uri);
};



module.exports = connectDB;
