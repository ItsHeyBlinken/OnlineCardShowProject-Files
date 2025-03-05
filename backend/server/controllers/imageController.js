const { processImage, validateImage } = require('../utils/imageProcessor');
const { uploadFileToS3 } = require('../services/s3Service');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');

/**
 * Upload images to S3 and store URLs in the database
 */
const uploadImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No images provided' 
            });
        }
        
        // Generate a temporary listing ID if not provided
        // (This will be replaced with actual listing ID after creation)
        const tempListingId = req.body.listingId || `temp_${uuidv4()}`;
        
        // Process and upload each image
        const uploadPromises = req.files.map(async (file, index) => {
            // Validate the image
            const validation = validateImage(file);
            if (!validation.valid) {
                return {
                    success: false,
                    originalName: file.originalname,
                    error: validation.error
                };
            }
            
            try {
                // Process the image (resize, optimize, convert format)
                const processedImage = await processImage(file);
                
                // Upload to S3
                const uploadResult = await uploadFileToS3(
                    processedImage.buffer,
                    processedImage.filename,
                    processedImage.mimetype,
                    tempListingId,
                    index
                );
                
                if (!uploadResult.success) {
                    return {
                        success: false,
                        originalName: file.originalname,
                        error: uploadResult.error
                    };
                }
                
                return {
                    success: true,
                    originalName: file.originalname,
                    url: uploadResult.url,
                    key: uploadResult.key
                };
            } catch (error) {
                console.error(`Error processing/uploading image ${file.originalname}:`, error);
                return {
                    success: false,
                    originalName: file.originalname,
                    error: error.message
                };
            }
        });
        
        // Wait for all uploads to complete
        const results = await Promise.all(uploadPromises);
        
        // Check if any uploads failed
        const failedUploads = results.filter(result => !result.success);
        if (failedUploads.length > 0) {
            return res.status(422).json({
                success: false,
                message: 'Some images failed to upload',
                errors: failedUploads
            });
        }
        
        // Return the successful uploads with URLs
        const imageUrls = results.map(result => result.url);
        res.status(200).json({
            success: true,
            message: 'All images uploaded successfully',
            tempListingId,
            imageUrls,
            images: results
        });
    } catch (error) {
        console.error('Image upload controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during image upload',
            error: error.message
        });
    }
};

/**
 * Associate uploaded images with a listing
 * This is called after a listing is created to associate the temp images with the actual listing ID
 */
const associateImagesWithListing = async (req, res) => {
    try {
        const { tempListingId, listingId, imageUrls } = req.body;
        
        if (!tempListingId || !listingId || !imageUrls || !Array.isArray(imageUrls)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request. Required fields: tempListingId, listingId, imageUrls'
            });
        }
        
        // Update the listing record with the image URLs
        await pool.query(
            `UPDATE listings 
             SET image_urls = $1, 
                 image_url = $2 
             WHERE id = $3`,
            [
                JSON.stringify(imageUrls), 
                imageUrls.length > 0 ? imageUrls[0] : null,
                listingId
            ]
        );
        
        res.status(200).json({
            success: true,
            message: 'Images associated with listing successfully',
            listingId,
            imageUrls
        });
    } catch (error) {
        console.error('Error associating images with listing:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while associating images with listing',
            error: error.message
        });
    }
};

module.exports = {
    uploadImages,
    associateImagesWithListing
}; 