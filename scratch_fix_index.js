const mongoose = require('mongoose');
require('dotenv').config();

const dropSkuIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const collection = mongoose.connection.collection('products');
        
        // List all indexes
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes.map(i => i.name));

        if (indexes.find(i => i.name === 'sku_1')) {
            await collection.dropIndex('sku_1');
            console.log('🗑️ Successfully dropped "sku_1" index');
        } else {
            console.log('ℹ️ No "sku_1" index found.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

dropSkuIndex();
