require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const Complaint = require('./models/Complaint'); // Make sure this path is correct based on where you run it
const connectDB = require('./config/database');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadDir = path.join(__dirname, 'uploads');

async function migrateUploads() {
  console.log('Connecting to database...');
  await connectDB();
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Missing Cloudinary config in .env. Please add CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_SECRET');
      process.exit(1);
  }

  console.log('Fetching complaints with local document paths...');
  const complaints = await Complaint.find({ docPath: { $ne: null, $exists: true } });
  
  let successCount = 0;
  let failCount = 0;

  console.log(`Found ${complaints.length} complaints with documents to migrate.`);

  for (const complaint of complaints) {
    // Skip if it's already a Cloudinary URL
    if (complaint.docPath.startsWith('http')) {
        console.log(`Skipping ${complaint.trackingID} - already has remote URL: ${complaint.docPath}`);
        continue;
    }

    const localFilePath = path.join(uploadDir, path.basename(complaint.docPath));
    
    if (!fs.existsSync(localFilePath)) {
        console.warn(`⚠️ File not found on disk for ${complaint.trackingID}: ${localFilePath}`);
        failCount++;
        continue;
    }

    try {
        console.log(`Uploading ${complaint.docPath} for ${complaint.trackingID}...`);
        
        // Detect resource type
        const ext = path.extname(complaint.docPath).toLowerCase();
        const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        const resourceType = isImage ? 'image' : 'raw';

        const result = await cloudinary.uploader.upload(localFilePath, {
            folder: 'grievance-portal/docs',
            resource_type: resourceType,
            use_filename: false,
            unique_filename: true
        });

        // Update database record
        complaint.docPath = result.secure_url;
        complaint.docPublicId = result.public_id;
        await complaint.save();
        
        console.log(`✅ Success: ${complaint.trackingID} -> ${result.secure_url}`);
        successCount++;
    } catch (error) {
        console.error(`❌ Failed to upload ${complaint.docPath}:`, error);
        failCount++;
    }
  }

  console.log('\n--- Migration Summary ---');
  console.log(`Total processed: ${complaints.length}`);
  console.log(`Successfully migrated: ${successCount}`);
  console.log(`Failed/Missing: ${failCount}`);
  console.log('-------------------------\n');
  
  console.log('Migration complete. You can now safely deploy to Vercel.');
  process.exit(0);
}

migrateUploads();
