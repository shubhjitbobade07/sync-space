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

exports.discoverChannels = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const channels = await Channel.find({ members: { $ne: currentUserId } })
      .populate('createdBy', 'name email');
    
    const result = channels.map(c => {
      const requested = c.requests.includes(currentUserId);
      return {
        _id: c._id,
        name: c.name,
        createdBy: c.createdBy,
        requested,
        membersCount: c.members.length
      };
    });
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.requestJoinChannel = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    if (channel.members.includes(currentUserId)) {
      return res.status(400).json({ message: 'Already a member of this channel' });
    }

    if (channel.requests.includes(currentUserId)) {
      return res.status(400).json({ message: 'Join request already pending' });
    }

    channel.requests.push(currentUserId);
    await channel.save();
    res.json({ message: 'Join request sent successfully', channelId: channel._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.listRequests = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id).populate('requests', 'name email');
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    const isCreator = channel.createdBy.toString() === req.user.userId;
    const isOwnerOrAdmin = req.user.role === 'owner' || req.user.role === 'admin';

    if (!isCreator && !isOwnerOrAdmin) {
      return res.status(403).json({ message: 'Not allowed to view requests for this channel' });
    }

    res.json(channel.requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    const isCreator = channel.createdBy.toString() === req.user.userId;
    const isOwnerOrAdmin = req.user.role === 'owner' || req.user.role === 'admin';

    if (!isCreator && !isOwnerOrAdmin) {
      return res.status(403).json({ message: 'Not allowed to manage requests for this channel' });
    }

    if (!channel.requests.includes(userId)) {
      return res.status(400).json({ message: 'No pending request found for this user' });
    }

    channel.requests = channel.requests.filter(id => id.toString() !== userId);
    if (!channel.members.includes(userId)) {
      channel.members.push(userId);
    }
    await channel.save();

    res.json({ message: 'Request accepted successfully', channel });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    const isCreator = channel.createdBy.toString() === req.user.userId;
    const isOwnerOrAdmin = req.user.role === 'owner' || req.user.role === 'admin';

    if (!isCreator && !isOwnerOrAdmin) {
      return res.status(403).json({ message: 'Not allowed to manage requests for this channel' });
    }

    channel.requests = channel.requests.filter(id => id.toString() !== userId);
    await channel.save();

    res.json({ message: 'Request rejected successfully', channel });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.leaveChannel = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    if (channel.createdBy.toString() === currentUserId) {
      return res.status(400).json({ message: 'The creator cannot leave the channel' });
    }

    if (!channel.members.includes(currentUserId)) {
      return res.status(400).json({ message: 'You are not a member of this channel' });
    }

    channel.members = channel.members.filter(id => id.toString() !== currentUserId);
    await channel.save();

    res.json({ message: 'Left channel successfully', channelId: channel._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};