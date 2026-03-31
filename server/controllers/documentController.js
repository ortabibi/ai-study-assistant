const path = require('path');
const mongoose = require('mongoose');
const pdfParse = require('pdf-parse');

const Document = require('../models/Document');

async function uploadDocument(req, res) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const userIdFromBody = req.body?.userId;
    const userId = userIdFromBody || req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    let extractedText = '';

    if (ext === '.pdf' || file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      extractedText = (data.text || '').toString();
    } else if (ext === '.txt' || file.mimetype === 'text/plain') {
      extractedText = file.buffer.toString('utf8');
    } else if (ext === '.csv' || file.mimetype === 'text/csv') {
      extractedText = file.buffer.toString('utf8');
    } else {
      return res.status(400).json({ message: 'Only PDF, TXT and CSV files are allowed' });
    }

    extractedText = extractedText.trim();
    if (!extractedText) {
      return res.status(400).json({ message: 'No text could be extracted from the file' });
    }

    const doc = await Document.create({
      userId,
      filename: file.originalname,
      originalText: extractedText,
    });

    return res.status(201).json({
      message: 'Document uploaded',
      document: {
        id: doc._id,
        userId: doc.userId,
        filename: doc.filename,
        createdAt: doc.createdAt,
      },
      extractedText,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err?.message || err) });
  }
}

async function getDocuments(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const docs = await Document.find({ userId }).sort({ createdAt: -1 });
    return res.json({
      documents: docs.map(doc => ({
        id: doc._id,
        filename: doc.filename,
        createdAt: doc.createdAt,
      }))
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err?.message || err) });
  }
}

async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const doc = await Document.findOneAndDelete({ _id: id, userId });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    return res.json({ message: 'Document deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err?.message || err) });
  }
}

module.exports = { uploadDocument, getDocuments, deleteDocument };

