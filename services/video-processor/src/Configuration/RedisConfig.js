import Redis from 'ioredis'

// Construct the URI for the secure connection
const isDev = process.env.NODE_ENV=="development";
const protocol = isDev ? 'redis' : 'rediss';
const redisUri = `${protocol}://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

const redis = new Redis(redisUri, {
    // Optional: add retry strategy for production resilience
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    // Required to prevent errors on some cloud environments
    maxRetriesPerRequest: 3 
});

redis.on('connect', () => console.log('Successfully connected to Upstash Redis!'));
redis.on('error', (err) => console.error('Redis connection error:', err));

export default redis