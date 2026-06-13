import path from "path"
import fs from "fs"
import { fileURLToPath } from "url";
import { analyzeVideo } from '../utils/video-analyzer.js'
import { transcodeToHLS } from '../services/ffmpeg.service.js';
import { downloadFromS3, uploadFolderToS3, deleteFromS3 } from '../services/s3.service.js';
import { pushTask } from "../services/RedisService.js"

const topicForProcessed = process.env.TOPIC_VIDEO_PROCESSED

const processVideoJob = async (videoData) => {
  const videoKey = videoData.value
  const videoId = videoData.key
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const localInputPath = path.join(__dirname, `../../temp-storage/${videoId}_input.mp4`);
  const localOutputDir = path.join(__dirname, `../../temp-storage/${videoId}_output`);

  try {
    console.log(`========== Starting Processing Job: ${videoKey} ==========`);

    // 1. Fetch raw asset from Cloud
    console.log(`Downloading input file from S3: ${videoKey}...`);
    await downloadFromS3(videoKey, localInputPath);

    // 2. Extract technical metrics
    const metadata = await analyzeVideo(localInputPath);
    console.log(`Metadata Analysis:`, metadata);

    // 3. Process HLS Stream
    console.log(`Initializing single-threaded transcode step...`);
    await transcodeToHLS(localInputPath, localOutputDir);

    // 4. Ship assets to Cloud bucket
    const s3OutputPrefix = `${videoId}/processed`;
    console.log(`Uploading output manifest and segments to S3 prefix: ${s3OutputPrefix}...`);
    await uploadFolderToS3(localOutputDir, s3OutputPrefix);

    console.log(`Deleting from S3: ${videoKey}...`);
    await deleteFromS3(videoKey)
    const msg =
    {
      "topic": topicForProcessed,
      "event":
      {
        key: videoId,
        value: `${videoId}/processed`
      }
    }
    await pushTask(topicForProcessed, msg)
    console.log(`========== Job ${videoId} Successfully Completed ==========`);

  } catch (error) {
    console.error(`Error processing job ${videoId}:`, error);
  } finally {
    // Rigid file hygiene to keep container storage clear
    console.log(`Cleaning local temporary workspace directories...`);
    if (fs.existsSync(localInputPath)) fs.unlinkSync(localInputPath);
    if (fs.existsSync(localOutputDir)) fs.rmSync(localOutputDir, { recursive: true, force: true });
  }
};

export default processVideoJob