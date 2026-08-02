const Message = require('../models/Message');
const Channel = require('../models/Channel');

module.exports = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.user.userId;
    console.log(`User ${userId} connected via socket ${socket.id}`);

    // Client asks to join a specific channel's "room"
    socket.on('joinChannel', async (channelId) => {
      const channel = await Channel.findById(channelId);
      if (!channel || !channel.members.includes(userId)) {
        return socket.emit('errorMessage', 'Not a member of this channel');
      }
      socket.join(channelId); // Socket.io "room" — scopes broadcasts to this channel only
      socket.emit('joinedChannel', channelId);
    });

    // Client sends a message
    socket.on('sendMessage', async ({ channelId, text }) => {
      try {
        const message = await Message.create({ channel: channelId, sender: userId, text });
        const populated = await message.populate('sender', 'name');

        // Broadcast to everyone in that room, INCLUDING the sender
        io.to(channelId).emit('newMessage', populated);
      } catch (err) {
        socket.emit('errorMessage', 'Could not send message');
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });
  });
};