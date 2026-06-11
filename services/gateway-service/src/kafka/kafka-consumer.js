import { Kafka } from 'kafkajs';
const kafka= new Kafka({
  clientId: 'notification-gateway',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});
const consumer = kafka.consumer({ groupId: 'notification-group' });

export const startKafkaConsumer = async (io) => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'notification', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        // console.log("message",message.key,message.value)
        const event = JSON.parse(message.value.toString());
        console.log(message.key.toString(),message.value.toString());
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
                message: `Channels you follow: A new video ${videoTitle} was just uploaded by ${actorName}!`,
            createdAt: new Date()
              });
            });
          }
        }
        if (event.type === 'video liked') {
          const { actorId, actorName } = event;
          const {videoTitle,ownerId} = event.metadata

          // --- 1. Notify the Uploader ---
          io.to(`user:${ownerId}`).emit('notification', {
            type: 'VIDEO_LIKED',
            content: `Your video "${videoTitle}" was liked by ${actorName}!`,
            createdAt: new Date()
          });
        }
        if (event.type === 'channel subscribed') {
          const { actorId, actorName } = event;
          const {ownerId} = event.metadata

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
      } catch (err) {
        console.error("Error processing event payload:", err);
      }
    },
  });
};