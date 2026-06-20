import Redis from 'ioredis';
import processVideoJob from '../workers/transcoding.worker.js';
import redis from '../Configuration/RedisConfig.js' // The client we configured earlier

const topicForVideoUploaded = process.env.TOPIC_VIDEO_UPLOADED;
const MAX_CONCURRENT_TASKS = process.env.Total_Allowed_Processing?process.env.Total_Allowed_Processing:1;
let activeTasksCount = 0;

async function startConsumer() {
    console.log("Worker is waiting for tasks...");
    
    while (true) {
        // 1. If we are at our limit, wait a tiny bit and check again
        if (activeTasksCount >= MAX_CONCURRENT_TASKS) {
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
        }

        try {
            // 2. Pop from Redis. This blocks until a job is available.
            const result = await redis.brpop('queue:' + topicForVideoUploaded, 0);
            
            if (result) {
                const msg = JSON.parse(result[1]);
                
                // 3. Increment the counter before firing the async function
                activeTasksCount++;
                
                // 4. Fire the task WITHOUT awaiting it here so the loop keeps running
                handleTask(msg.event)
                    .catch(err => console.error("Error executing task handling logic:", err))
                    .finally(() => {
                        // 5. Decrement when done (whether it succeeds or fails)
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