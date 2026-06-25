import Redis from 'ioredis';
import processVideoJob from '../workers/transcoding.worker.js';
import redis from '../Configuration/RedisConfig.js' // Your primary client

// --- FIX STARTED ---
// Create a separate network connection dedicated solely to blocking queue pops
const blockingRedis = redis.duplicate();
// --- FIX ENDED ---

const topicForVideoUploaded = process.env.TOPIC_VIDEO_UPLOADED;
const MAX_CONCURRENT_TASKS = process.env.Total_Allowed_Processing ? parseInt(process.env.Total_Allowed_Processing) : 1;
let activeTasksCount = 0;

async function startConsumer() {
    console.log("Worker is waiting for tasks...");
    
    while (true) {
        if (activeTasksCount >= MAX_CONCURRENT_TASKS) {
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
        }

        try {
            // USE THE DUPLICATE CLIENT HERE so it doesn't lock up the primary client
            const result = await blockingRedis.brpop('queue:' + topicForVideoUploaded, 70);
            
            if (result) {
                const msg = JSON.parse(result[1]);
                activeTasksCount++;
                
                handleTask(msg.event)
                    .catch(err => console.error("Error executing task handling logic:", err))
                    .finally(() => {
                        activeTasksCount--;
                    });
            }
        } catch (error) {
            console.error("Error processing queue:", error);
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
        console.log(task);
        const payload = JSON.stringify(task);
        console.log(payload);
        
        // This continues to use your primary client safely now!
        await redis.lpush('queue:' + topic, payload);
        
        console.log(`Task pushed to queue: ${topic}`);
    } catch (error) {
        console.error("Failed to push task to Redis:", error);
        throw error;
    }
}

export { startConsumer, pushTask }