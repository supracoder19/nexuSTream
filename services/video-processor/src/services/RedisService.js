import Redis from 'ioredis';
import processVideoJob from '../workers/transcoding.worker.js';
import redis from '../Configuration/RedisConfig.js' // The client we configured earlier

const topicForVideoUploaded=process.env.TOPIC_VIDEO_UPLOADED
async function startConsumer() {
    console.log("Worker is waiting for tasks...");
    while (true) {
        try {
            const result = await redis.brpop('queue:'+topicForVideoUploaded, 0);
            
            if (result) {
                const msg = JSON.parse(result[1]);
                
                await handleTask(msg.event);
            }
        } catch (error) {
            console.error("Error processing queue:", error);
            // Wait a moment before retrying if there's a connection failure
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function handleTask(event) {
    console.log(event);
    await processVideoJob(event)
}

const pushTask = async (topic, task) => {
    try {
        
        // Convert to string for storage
        const payload = JSON.stringify(task);

        // Push to the unified 'queue:all-tasks' list
        // We use LPUSH to add to the head of the list
        await redis.lpush('queue:'+topic, payload);
        
        console.log(`Task pushed to queue: ${topic}`);
    } catch (error) {
        console.error("Failed to push task to Redis:", error);
        throw error; // Propagate the error so the API knows the request failed
    }
}

export {startConsumer,pushTask}