require('dotenv').config();
const express = require('express');
const { Kafka } = require('kafkajs');
const path = require('path');
const fs = require('fs');

const { analyzeVideo } = require('../utils/video-analyzer');
const { transcodeToHLS } = require('../services/ffmpeg.service');
const { downloadFromS3, uploadFolderToS3, deleteFromS3 } = require('../services/s3.service');
const { error } = require('console');
const axios  = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Express Health Check Route for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'video-processor' });
});

// Kafka Configuration 
const kafka = new Kafka({ 
  clientId: 'video-processor',
  brokers: [process.env.KAFKA_BROKER],
});
const consumer = kafka.consumer({ groupId: `video-processor-group` });
const producer = kafka.producer();

/**
 * Core processing routine triggered by Kafka messages.
 */
const processVideoJob = async (videoData) => {
  const videoKey=videoData.value
  const videoId=videoData.key
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
    await producer.connect();

    // 2. Send the message
    await producer.send({
      topic: 'videoProcessed',
      messages: [
        { 
          key: videoId ,
          value: JSON.stringify(videoData)
        }
      ],
    });
    await producer.disconnect()
    // const res=await axios.post(`${process.env.BACKEND_URL}video/processed`,
    //   {
    //     videoId,
    //     outputPath:`processed/${videoId}/playlist.m3u8`
    //   },
    //   {
    //     withCredentials:true,
    //     headers:{
    //       token:process.env.BACKEND_TOKEN
    //     }
    //   }
    // )
    // if(!res.data.success)
    // {
    //   throw new Error(res.data.msg) 
    // }
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

/**
 * Initializes and loops the Kafka polling ecosystem.
 */
const startWorker = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'videoUploaded', fromBeginning: false });
  console.log('Kafka Consumer subscribed to [videoUploaded] topic.');

  await consumer.run({
    // CRITICAL: Forces Kafka to wait for the previous promise to resolve before serving the next message.
    partitionsConsumedConcurrently: 1, 
    
    eachMessage: async ({ topic, partition, message }) => {
      const request = {
          key:message.key.toString(),
          value:message.value.toString().replaceAll("\"","")
        }
      try {
        // const payload = JSON.parse(request)
        console.log(request)
        // Awaiting this wrapper forces a absolute sequential queue execution loop
        await processVideoJob(request);
      } catch (parseError) {
        // console.log(parseError)
        console.error('Failed to parse incoming Kafka message payload:', messageValue);
      }
    },
  });
};

// Fire up Servers
app.listen(PORT, () => {
  console.log(`Express status server bound to port ${PORT}`);
  startWorker().catch(err => console.error('Fatal initialization error in Kafka consumer:', err));
});