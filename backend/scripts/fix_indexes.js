const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const fixIndexes = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        const db = mongoose.connection.db;
        const collection = db.collection('users');

        console.log('Listing current indexes...');
        const indexes = await collection.indexes();
        console.log(indexes);

        // Drop phone index if exists
        const phoneIndex = indexes.find(idx => idx.key.phone);
        if (phoneIndex) {
            console.log(`Dropping index: ${phoneIndex.name}...`);
            await collection.dropIndex(phoneIndex.name);
            console.log('Phone index dropped.');
        } else {
            console.log('Phone index not found.');
        }
        
        // Drop email index if exists (just to be safe/clean)
        const emailIndex = indexes.find(idx => idx.key.email);
        if (emailIndex) {
            console.log(`Dropping index: ${emailIndex.name}...`);
            await collection.dropIndex(emailIndex.name);
            console.log('Email index dropped.');
        }

        console.log('Indexes cleaned up. Mongoose will recreate them with correct options (unique + sparse) on next app start.');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing indexes:', error);
        process.exit(1);
    }
};

fixIndexes();
