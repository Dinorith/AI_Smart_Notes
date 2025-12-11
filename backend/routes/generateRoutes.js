const express = require('express');
const router = express.Router();
const multer = require('multer');
const generateController = require('../controllers/generateController');

const upload = multer({ dest: 'uploads/' });

router.post('/generate', upload.single('file'), generateController.generateNotes);

module.exports = router;
