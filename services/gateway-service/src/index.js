const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const verifySocketToken = require('./middleware/auth.verify');
const { startKafkaConsumer } = require('./kafka/kafka-consumer');
const { error } = require('console');
require("dotenv").config();

// 1. Move PORT declaration to the top
const PORT = process.env.PORT || 3050;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    // Change this from "/socket.io" to match your Nginx path
    path: "/apiV2/socket.io", 
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
startKafkaConsumer(io).catch(error=>{
    console.log(error);
})
// 2. Now ${PORT} will safely resolve here
app.get('/', (req, res) => {
    res.send(`Gateway running on port ${PORT}`);
});

server.listen(PORT, () => {
    console.log(`Server successfully started on port ${PORT}`);
});