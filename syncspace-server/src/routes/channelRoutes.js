const express = require('express');
const router = express.Router();
const Roles = require('../_helpers/Roles');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');
const { createChannel, deleteChannel, listChannels } = require('../controllers/channelController');

router.use(requireAuth); // applies to ALL routes below in this router

router.get('/', listChannels);
router.post('/', requireRole(Roles.Owner, Roles.Admin), createChannel);
router.delete('/:id', requireRole(Roles.Owner, Roles.Admin), deleteChannel);

module.exports = router;