const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const departureRoutes = require('./routes/departureRoutes'); // New route

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/departures', departureRoutes); // New route

// Base route
app.get('/', (req, res) => {
  res.send('School Gate Management API is running...');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
