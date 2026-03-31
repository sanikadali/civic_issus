const express = require('express');   
const cors = require('cors');
// const { errorHandler } = require('./middleware/errorMiddleware'); // Will create this
require('dotenv').config();
const app = express(); 
const connectDB = require('./config/db');
const port = process.env.PORT || 8001;
connectDB();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use('/api/users', require('./routes/authRoutes'));  // legacy
app.use('/api/auth', require('./routes/authRoutes'));  // new alias
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.get('/', (req, res) => res.send('API is running...'));

// app.use(errorHandler);

app.listen(port, () => console.log("Server started on port", port));