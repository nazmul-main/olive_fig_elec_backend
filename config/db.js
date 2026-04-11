const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '0.0.0.0']);
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
    try {
        // Options to help with timeouts and DNS issues
        const options = {
            dbName: process.env.DB_NAME || 'oliveAndFigDB',
            serverSelectionTimeoutMS: 60000, // 60s
            connectTimeoutMS: 60000,
            socketTimeoutMS: 60000,
            family: 4 // Force IPv4
        };

        const conn = await mongoose.connect(process.env.MONGO_URI, options);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);

        if (retryCount < MAX_RETRIES) {
            console.log(`🔄 Retrying... (${retryCount + 1}/${MAX_RETRIES}) in ${RETRY_DELAY_MS / 1000}s`);
            setTimeout(() => connectDB(retryCount + 1), RETRY_DELAY_MS);
        } else {
            console.error('💀 Failed to connect after multiple retries.');
            // Don't exit immediately, maybe it's a temporary network glitch
        }
    }
};

module.exports = connectDB;
