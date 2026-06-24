import {redis} from "./RedisConfig.js"

const topicForNotification = process.env.TOPIC_NOTIFICATION
export async function startConsumer(io) {
    console.log("Worker is waiting for tasks...");
    while (true) {
        try {
            const result = await redis.brpop('queue:'+topicForNotification, 0);
            
            if (result) {
                const msg = JSON.parse(result[1]);
                
                await handleTasks(io,msg.event.value);
            }
        } catch (error) {
            console.error("Error processing queue:", error);
            // Wait a moment before retrying if there's a connection failure
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}


const handleTasks = async (io,event)=>
{
  console.log(event);
  
   if (event.type === 'video ready') {
          const { actorId, actorName } = event;
          const {videoTitle} = event.metadata

          // --- 1. Notify the Uploader ---
          io.to(`user:${event.actorId}`).emit('notification', {
            type: 'VIDEO_READY',
            content: `Your video "${videoTitle}" is fully processed and live!`,
            createdAt: new Date()
          });
        
          // --- 2. Notify Subscribers (Fan-out) ---
          // Fetch subscriber IDs from Redis (or fallback to database)
          // Assumes a Set structure in Redis containing subscriber user IDs
          const subscriberIds = event.targetIds

          if (subscriberIds && subscriberIds.length > 0) {
            subscriberIds.forEach((subId) => {
              io.to(`user:${subId}`).emit('notification', {
                type: 'NEW_VIDEO',
                content: `Channels you follow: A new video ${videoTitle} was just uploaded by ${actorName}!`,
            createdAt: new Date()
              });
            });
          }
        }
        if (event.type === 'video liked') {
          const { actorId, actorName } = event;
          const {videoTitle,ownerId} = event.metadata
          // --- 1. Notify the Uploader ---
          io.to(`user:${ownerId}`).emit('notification', { //not working
            type: 'VIDEO_LIKED',
            content: `Your video "${videoTitle}" was liked by ${actorName}!`,
            createdAt: new Date()
          });
        }
        if (event.type === 'channel subscribed') {
          const { actorId, actorName } = event;
          const {ownerId} = event.metadata
          console.log(`user:${ownerId}`,'channel subscribed');
          
          // --- 1. Notify the Uploader ---
          io.to(`user:${ownerId}`).emit('notification', {
            type: 'CHANNEL_SUBSCRIBED',
            content: `Your channel was subscribed by ${actorName}!`,
            createdAt: new Date()
          });
        }
        if (event.type === 'commented') {
          const { actorId, actorName } = event;
          const {ownerId,videoTitle} = event.metadata

          // --- 1. Notify the Uploader ---
          io.to(`user:${ownerId}`).emit('notification', {
            type: 'commented',
            content: `${actorName} commented on your video "${videoTitle}"!`,
            createdAt: new Date()
          });
        }
}
