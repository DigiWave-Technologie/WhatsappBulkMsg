const express = require('express');
const router = express.Router();
const virtualNumberCampaign = require('../controllers/virtualNumberCampaign.controller');
const multer = require('multer');


const upload = multer({
    storage: multer.memoryStorage()
});

router.post('/campaign', upload.array('media', 6), virtualNumberCampaign.sendWhatsappBulkMsgs);


module.exports = router;
