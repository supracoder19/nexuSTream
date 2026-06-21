import { ListObjectsV2Command,S3Client, GetObjectCommand, PutObjectCommand,DeleteObjectsCommand }  from '@aws-sdk/client-s3'
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

const s3Old = new S3Client({
  region: process.env.AWS_REGION_old || 'us-east-1', // MinIO requires a placeholder region
  endpoint: process.env.AWS_S3_ENDPOINT_old,          // e.g., http://localhost:9000 or http://minio:9000
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID_old,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_old,
  },
});
/**
 * Downloads a file from S3 to local storage.
 */
const downloadFromS3 = async (s3Key, localPath) => {
  const baseUrl = process.env.S3_Download_Bucket.replace(/\/$/, '/');
  const downloadUrl = `${baseUrl}/${s3Key}?token=${process.env.SECRET_KEY}`;
  console.log("downloading from", downloadUrl);
  
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch asset from ${downloadUrl}: ${response.statusText}`);
  } 

  if (!response.body) {
    throw new Error(`Response body from ${downloadUrl} is empty or not streamable`);
  }

  // 1. Get the directory path (e.g., /app/temp-storage/24_output/thumbnail)
  const dir = path.dirname(localPath);
  
  // 2. Create the missing nested folders recursively (like mkdir -p)
  await fs.promises.mkdir(dir, { recursive: true });

  // 3. Stream the file directly into the newly created folder
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(localPath);
    
    Readable.fromWeb(response.body).pipe(writeStream)
      .on('finish', resolve)
      .on('error', reject);
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
const deleteFromS3 = async (videoId) => {
  const bucketName = process.env.AWS_S3_BUCKET_old;
  // Ensure the folder prefix ends with a slash so you don't accidentally 
  // delete "26_processed_backup" when trying to delete "26_processed"
  const folderPrefix = videoId.endsWith('/') ? videoId : `${videoId}/`;

  try {
    // 1. List all objects inside the "folder"
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: folderPrefix,
    });

    const listedObjects = await s3Old.send(listCommand);

    // If the folder is already empty, we're done
    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log(`Folder ${folderPrefix} is already empty or doesn't exist.`);
      return;
    }

    // 2. Prepare the batch of objects to delete
    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: listedObjects.Contents.map(({ Key }) => ({ Key }))
      }
    };

    // 3. Execute the batch delete command
    await s3Old.send(new DeleteObjectsCommand(deleteParams));
    
    console.log(`Successfully deleted virtual folder structure: ${folderPrefix}`);

  } catch (error) {
    console.error(`Failed to delete folder ${videoId} from S3:`, error);
    throw error;
  }
};
export { downloadFromS3, uploadFolderToS3, deleteFromS3 };