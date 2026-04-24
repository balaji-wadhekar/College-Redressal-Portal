const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer - The file buffer from multer memoryStorage
 * @param {string} folder - The Cloudinary folder to upload into
 * @param {string} originalname - Original filename (used for resource_type detection)
 * @returns {Promise<Object>} Cloudinary upload result (includes .secure_url)
 */
const uploadToCloudinary = (buffer, folder = 'grievance-portal', originalname = '') => {
  return new Promise((resolve, reject) => {
    // Detect resource type from extension
    const ext = originalname.split('.').pop().toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const resourceType = imageExts.includes(ext) ? 'image' : 'raw';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: false,
        unique_filename: true
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Convert buffer to readable stream and pipe to Cloudinary
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

module.exports = { cloudinary, uploadToCloudinary };
