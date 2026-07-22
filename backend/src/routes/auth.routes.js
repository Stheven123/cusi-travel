const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/auth.controller');

const router = Router();

router.post('/login',  ctrl.login);
router.post('/logout', authMiddleware, ctrl.logout);
router.get('/me',      authMiddleware, ctrl.me);

module.exports = router;
