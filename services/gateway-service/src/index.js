import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

// Importing your local services with .js extensions
import { verifySocketToken } from './middleware/auth.verify.js';
import { startConsumer } from './Redis/RedisConsumer.js';

// 1. Move PORT declaration to the top
const PORT = process.env.PORT || 3050;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    // Change this from "/socket.io" to match your Nginx path
    path: `${"/socket.io"}`, 
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials:true
    }
});

// Apply Authentication Guard to all Socket connections
io.use(verifySocketToken);

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.userId}`);
    socket.join(`user:${socket.user.userId}`)
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.userId}`);
    });
});
startConsumer(io).catch(error=>{
    console.log(error);
})
// 2. Now ${PORT} will safely resolve here
app.get('/', (req, res) => {
    res.send(`Gateway running on port ${PORT}`);
});

server.listen(PORT, () => {
    console.log(`Server successfully started on port ${PORT}`);
});