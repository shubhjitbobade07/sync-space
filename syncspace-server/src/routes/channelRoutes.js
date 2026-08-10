const express = require('express');
const router = express.Router();
const Roles = require('../_helpers/Roles');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');
const { 
  createChannel, 
  deleteChannel, 
  listChannels, 
  discoverChannels, 
  requestJoinChannel, 
  listRequests, 
  acceptRequest, 
  rejectRequest,
  leaveChannel
} = require('../controllers/channelController');

router.use(requireAuth); // applies to ALL routes below in this router

router.get('/', listChannels);
router.get('/discover', discoverChannels);
router.post('/', requireRole(Roles.Owner, Roles.Admin), createChannel);
router.delete('/:id', requireRole(Roles.Owner, Roles.Admin), deleteChannel);
router.post('/:id/request', requestJoinChannel);
router.get('/:id/requests', listRequests);
router.post('/:id/requests/:userId/accept', acceptRequest);
router.post('/:id/requests/:userId/reject', rejectRequest);
router.post('/:id/leave', leaveChannel);

module.exports = router;