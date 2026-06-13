import ffmpeg from 'fluent-ffmpeg'
import path from "path"
import fs from "fs"
/**
 * Transcodes an input video into 360p, 480p, and 720p HLS streams,
 * and generates a Master Playlist for Adaptive Bitrate Streaming.
 */
const transcodeToHLS = (inputPath, outputDir) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Pre-create the indexed variant folders (0, 1, 2) that FFmpeg targets natively via %v
    const variantIndices = ['0', '1', '2'];
    variantIndices.forEach(idx => {
      const dir = path.join(outputDir, idx);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    ffmpeg(inputPath)
      .outputOptions([
        // 1. Global Performance Settings
        '-threads 0',                   // CRITICAL: Maximizes Hugging Face multi-core vCPUs
        '-preset fast',
        '-pix_fmt yuv420p',
        '-sc_threshold 0',
        
        // 2. Exact Keyframe Alignment
        '-g 120',
        '-keyint_min 120',

        // -----------------------------------------------------------------
        // MAP 0 (Variant 0): 720p Video + Audio Track 0
        // -----------------------------------------------------------------
        '-map 0:v:0', '-c:v:0 libx264', '-b:v:0 2500k', '-maxrate:v:0 2700k', '-bufsize:v:0 5000k',
        '-filter:v:0 scale=-2:720',
        '-map 0:a:0', '-c:a:0 aac', '-b:a:0 128k', '-ac:a:0 2',
        
        // -----------------------------------------------------------------
        // MAP 1 (Variant 1): 480p Video + Audio Track 1
        // -----------------------------------------------------------------
        '-map 0:v:0', '-c:v:1 libx264', '-b:v:1 1200k', '-maxrate:v:1 1300k', '-bufsize:v:1 2400k',
        '-filter:v:1 scale=-2:480',
        '-map 0:a:0', '-c:a:1 aac', '-b:a:1 128k', '-ac:a:1 2',
        
        // -----------------------------------------------------------------
        // MAP 2 (Variant 2): 360p Video + Audio Track 2
        // -----------------------------------------------------------------
        '-map 0:v:0', '-c:v:2 libx264', '-b:v:2 600k', '-maxrate:v:2 650k', '-bufsize:v:2 1200k',
        '-filter:v:2 scale=-2:360',
        '-map 0:a:0', '-c:a:2 aac', '-b:a:2 128k', '-ac:a:2 2',

        // -----------------------------------------------------------------
        // HLS Packaging & Dynamic Muxer Mapping
        // -----------------------------------------------------------------
        '-f hls',
        '-hls_time 4',
        '-hls_playlist_type vod',
        
        // Correct Stream Mapping
        '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2',
        
        // Chunk rendering template path configs
        '-hls_segment_filename', path.join(outputDir, '%v/seg_%03d.ts'),
        
        // FIX: Provide the complete absolute path for the master playlist name
        // This stops FFmpeg from guessing and places it neatly into your root workspace outputDir.
        // '-master_pl_name', path.join(outputDir, 'master.m3u8')
        '-master_pl_name', 'master.m3u8'
      ])
      .output(path.join(outputDir, '%v/playlist.m3u8'))
      .on('start', (cmd) => {
        console.log('Spawned Multi-Resolution FFmpeg with command:', cmd);
      })
      .on('progress', (progress) => {
        console.log(`Transcoding Status: ${progress.percent ? progress.percent.toFixed(1) : 0}% complete`);
      })
      .on('end', () => {
        console.log('Multi-resolution HLS generation complete!');
        resolve();
      })
      .on('error', (err) => {
        console.error('FFmpeg packaging error:', err.message);
        reject(err);
      })
      .run();
  });
};

export { transcodeToHLS };