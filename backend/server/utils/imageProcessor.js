const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Processes an image by:
 * 1. Resizing to max width of 1200px (maintaining aspect ratio)
 * 2. Converting to WebP format where possible
 * 3. Optimizing for web use
 */
const processImage = async (file) => {
    const tempPath = path.join(os.tmpdir(), `${uuidv4()}`);
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const isWebPSupported = fileExtension !== '.gif'; // WebP doesn't support animation like GIF
    const outputFormat = isWebPSupported ? 'webp' : fileExtension.replace('.', '');
    const outputFilename = `${path.basename(file.originalname, fileExtension)}.${outputFormat}`;
    
    try {
        // Create Sharp instance
        const imageProcessor = sharp(file.buffer);
        
        // Get image metadata
        const metadata = await imageProcessor.metadata();
        
        // Resize if needed (max width of 1200px)
        if (metadata.width > 1200) {
            imageProcessor.resize({
                width: 1200,
                withoutEnlargement: true
            });
        }
        
        // Set output format and quality
        if (isWebPSupported) {
            imageProcessor.webp({ quality: 80 });
        } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
            imageProcessor.jpeg({ quality: 80 });
        } else if (fileExtension === '.png') {
            imageProcessor.png({ compressionLevel: 8 });
        }
        
        // Process the image and save to buffer
        const processedBuffer = await imageProcessor.toBuffer();
        
        return {
            buffer: processedBuffer,
            filename: outputFilename,
            mimetype: isWebPSupported ? 'image/webp' : file.mimetype,
            originalName: file.originalname,
            size: processedBuffer.length
        };
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error(`Image processing failed: ${error.message}`);
    }
};

/**
 * Validates image file format and size
 */
const validateImage = (file) => {
    // Check file size (max 200KB = 200 * 1024 bytes)
    const maxSize = 200 * 1024;
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File size exceeds the limit of 200KB. Current size: ${Math.round(file.size / 1024)}KB`
        };
    }
    
    // Check file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimeTypes.includes(file.mimetype)) {
        return {
            valid: false,
            error: 'Invalid file type. Only JPEG, PNG, or WebP files are allowed.'
        };
    }
    
    return { valid: true };
};

module.exports = {
    processImage,
    validateImage
}; 