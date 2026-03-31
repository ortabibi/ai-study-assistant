const express = require('express');
const multer = require('multer');
const path = require('path');

const { uploadDocument, getDocuments, deleteDocument } = require('../controllers/documentController');
const router = express.Router();
const auth = require('../middleware/auth');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isPdf = ext === '.pdf' || file.mimetype === 'application/pdf';
  const isTxt = ext === '.txt' || file.mimetype === 'text/plain';
  const isCsv = ext === '.csv' || file.mimetype === 'text/csv';

  if (isPdf || isTxt || isCsv) return cb(null, true);
  return cb(new Error('Only PDF and TXT files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

router.post('/upload', auth, upload.single('file'), uploadDocument);

router.get('/', auth, getDocuments);

router.delete('/:id', auth, deleteDocument);

module.exports = router;

