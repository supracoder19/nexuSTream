import { S3Client, GetObjectCommand, PutObjectCommand,DeleteObjectCommand }  from '@aws-sdk/client-s3'
import path from "path"
import fs from "fs"
import { Readable } from 'stream'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1', // MinIO requires a placeholder region
  endpoint: process.env.AWS_S3_ENDPOINT,          // e.g., http://localhost:9000 or http://minio:9000
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Downloads a file from S3 to local storage.
 */
const downloadFromS3 = async (s3Key, localPath) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: s3Key,
  });

  const response = await s3.send(command);
  return new Promise((resolve, reject) => {
    if (response.Body instanceof Readable) {
      const writeStream = fs.createWriteStream(localPath);
      response.Body.pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    } else {
      reject(new Error('S3 response body is not a readable stream'));
    }
  });
};

/**
 * Uploads an entire local folder to S3 (used for HLS output segments).
 */
const uploadFolderToS3 = async (localFolderPath, s3FolderPrefix) => {
  
  // Helper function to recursively find all files in subdirectories
  const getFilesRecursively = (dirPath) => {
    let results = [];
    const list = fs.readdirSync(dirPath);

    list.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat && stat.isDirectory()) {
        // If it's a directory (like 0, 1, 2), dive deeper
        results = results.concat(getFilesRecursively(filePath));
      } else {
        // If it's a file, push it to our execution queue
        results.push(filePath);
      }
    });
    return results;
  };

  // 1. Gather all file paths across the root folder and variant subfolders
  const allFiles = getFilesRecursively(localFolderPath);

  // 2. Iterate and upload each file sequentially
  for (const filePath of allFiles) {
    // Get the relative path from the root output folder 
    // (e.g., "master.m3u8", "0/playlist.m3u8", or "0/seg_001.ts")
    const relativePath = path.relative(localFolderPath, filePath);
    
    // Convert OS-specific backslashes (\) from Windows environments to web-standard forward slashes (/)
    const webSafePath = relativePath.replace(/\\/g, '/');
    const s3Key = `${s3FolderPrefix}/${webSafePath}`;

    const fileStream = fs.createReadStream(filePath);

    // 3. Determine content type accurately based on file extensions
    let contentType = 'application/octet-stream';
    if (filePath.endsWith('.m3u8')) {
      contentType = 'application/x-mpegURL';
    } else if (filePath.endsWith('.ts')) {
      contentType = 'video/MP2T';
    }

    // 4. Implement CDN performance caching rules via metadata parameters
    // Cache segment chunks (.ts) forever, keep playlists (.m3u8) short-lived
    const cacheControl = filePath.endsWith('.ts')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=2, must-revalidate';

    console.log(`Uploading: ${relativePath} -> ${s3Key} (${contentType})`);

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
        Body: fileStream,
        ContentType: contentType,
        CacheControl: cacheControl
      })
    );
  }
  
  console.log('All transcode assets successfully synced to the cloud bucket.');
};
const deleteFromS3 = async (videoKey) => {
  const bucketName = process.env.AWS_S3_BUCKET;

  try {
    
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: videoKey
  });

    await s3.send(deleteCommand);
    console.log(`Successfully deleted S3 folder structure: ${videoKey}`);

  } catch (error) {
    console.error(`Failed to delete folder ${videoKey} from S3:`, error);
    throw error;
  }
};
export { downloadFromS3, uploadFolderToS3, deleteFromS3 };