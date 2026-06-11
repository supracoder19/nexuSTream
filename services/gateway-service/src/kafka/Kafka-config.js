require("dotenv").config()
import { Kafka } from 'kafkajs';
const kafka= (new kafka({
  clientId: 'notification-gateway',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
}));
export default kafka