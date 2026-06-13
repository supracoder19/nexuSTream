import ffmpeg from 'fluent-ffmpeg'

/**
 * Extracts metadata from the video file using ffprobe.
 * @param {string} filePath - Path to the local video file.
 * @returns {Promise<object>}
 */
const analyzeVideo = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      
      const stream = metadata.streams.find(s => s.codec_type === 'video');
      resolve({
        width: stream ? stream.width : null,
        height: stream ? stream.height : null,
        duration: metadata.format ? parseFloat(metadata.format.duration) : 0,
        bitrate: metadata.format ? parseInt(metadata.format.bit_rate, 10) : 0
      });
    });
  });
};

export { analyzeVideo };