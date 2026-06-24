import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

/**
 * Converts an image to WebP format and replaces the original file.
 * @param {string} filePath - The absolute or relative path to the image file.
 */
export async function convertToWebpAndReplace(filePath) {
  try {
    // 1. Resolve absolute paths
    const absolutePath = path.resolve(filePath);
    const parsedPath = path.parse(absolutePath)
    
    // Define the new file path with the .webp extension
    const newFilePath = path.join(parsedPath.dir, `${parsedPath.name}.webp`);

    console.log(`Processing: ${parsedPath.base}...`);

    // 2. Read and convert the image to a buffer first 
    // (This avoids locking the file while we try to delete/replace it)
    const webpBuffer = await sharp(absolutePath)
      .webp({ quality: 80 }) // Adjust quality (0-100) as needed
      .toBuffer();

    // 3. Delete the original file
    await fs.unlink(absolutePath);
    console.log(`Removed original file: ${parsedPath.base}`);

    // 4. Write the WebP buffer to the new path
    await fs.writeFile(newFilePath, webpBuffer);
    console.log(`Successfully created: ${parsedPath.name}.webp\n`);

  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}
