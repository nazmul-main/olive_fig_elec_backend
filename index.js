require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

// --- Performance: Gzip compression for all responses ---
app.use(compression());

// --- Security: Helmet sets best-practice HTTP headers ---
app.use(helmet());

// --- Security: CORS — restrict to allowed origins in production ---
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000'];

// Always allow the production frontend URL to avoid CORS blocks
if (!allowedOrigins.includes('https://olive-fig-elec-frontend.vercel.app')) {
    allowedOrigins.push('https://olive-fig-elec-frontend.vercel.app');
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server requests (no origin) or whitelisted origins
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy: Origin '${origin}' is not allowed.`));
        }
    },
    credentials: true,
}));

// --- Security: Rate limiting for Auth endpoints (brute-force protection) ---
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 30,                   // Max 30 requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use('/api/auth', authLimiter, require('./routes/auth')); // 🔒 Rate limited

app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// Health check
app.get('/', (req, res) => res.json({ success: true, message: '🟢 Olive & Fig Electronics API is Running!' }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` }));

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));