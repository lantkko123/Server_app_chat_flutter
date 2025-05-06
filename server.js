const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./mongo');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let usersCollection;

async function init() {
  const db = await connectDB();
  usersCollection = db.collection("messages");
  app.get('/messages', async (req, res) => {
    const { roomId } = req.query;
    try {
      console.log("roomId:", roomId);
      const messages = await usersCollection.find({ roomId }).toArray();
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy tin nhắn', error });
    }
  });
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });
    socket.on('typing', (data) => {
      socket.to(data.roomId).emit('user_typing', {
        sender:data.sender,
        roomId:data.roomId
      }); 
    });
    socket.on('stop_typing', (data) => {
      socket.to(data.roomId).emit('user_stop_typing', {
        sender:data.sender,
        roomId:data.roomId
      });
    });
    socket.on('send_message', async (data) => {
      try {
        await usersCollection.insertOne({
          roomId: data.roomId,
          sender: data.sender,
          message: data.message,
          timestamp: new Date()
        });
        io.to(data.roomId).emit('receive_message', data);
      } catch (err) {
        console.error("Insert failed:", err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  server.listen(3000, () => {
    console.log('Server running on port 3000');
  });
}

init();
