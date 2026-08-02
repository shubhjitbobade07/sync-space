const Channel = require('../models/Channel');
const Message = require('../models/Message');

exports.createChannel = async (req, res) => {
  try {
    const { name } = req.body;
    const channel = await Channel.create({
      name,
      createdBy: req.user.userId,
      members: [req.user.userId]
    });
    res.status(201).json(channel);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    // Resource-level check: even an "admin" shouldn't delete channels
    // that aren't theirs unless they're an owner. This is the part
    // basic role-checking middleware CAN'T do alone.
    const isCreator = channel.createdBy.toString() === req.user.userId;
    const isOwner = req.user.role === 'owner';

    if (!isCreator && !isOwner) {
      return res.status(403).json({ message: 'Not allowed to delete this channel' });
    }

    // Delete all messages in this channel
    await Message.deleteMany({ channel: req.params.id });
    await channel.deleteOne();
    res.json({ message: 'Channel deleted successfully', channelId: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.listChannels = async (req, res) => {
  const channels = await Channel.find({ members: req.user.userId });
  res.json(channels);
};