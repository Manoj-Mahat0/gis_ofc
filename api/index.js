// Vercel serverless function entry point
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('../config/database');
const errorHandler = require('../middleware/errorHandler');
const rateLimiter = require('../middleware/rateLimiter');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false,
}));

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
app.use('/api/', rateLimiter);

// Routes
app.use('/api/auth', require('../routes/authRoutes'));
app.use('/api/leads', require('../routes/leadRoutes'));
app.use('/api/calls', require('../routes/callRoutes'));
app.use('/api/attendance', require('../routes/attendanceRoutes'));
app.use('/api/location', require('../routes/locationRoutes'));
app.use('/api/reports', require('../routes/reportRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running on Vercel' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Telecaller Backend API - Vercel Deployment' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
