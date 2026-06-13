
import express from "express"
import { startConsumer } from "./services/RedisService.js";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;



// Express Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'video-processor' });
});

// Fire up Servers
app.listen(PORT, () => {
  console.log(`Express status server bound to port ${PORT}`);
  startConsumer().catch(err => console.error('Fatal initialization error in Kafka consumer:', err));
});