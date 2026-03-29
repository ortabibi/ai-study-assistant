const mongoose = require('mongoose');
const OpenAI = require('openai');
const Document = require('../models/Document');

let client;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

async function createStudyPlan(req, res) {
  try {
    const { documentId } = req.body || {};
    const userId = req.user?.userId || req.user?.id;

    if (!documentId) return res.status(400).json({ message: 'documentId is required' });
    if (!mongoose.Types.ObjectId.isValid(documentId)) return res.status(400).json({ message: 'Invalid documentId' });
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.status(401).json({ message: 'Unauthorized' });

    const document = await Document.findOne({ _id: documentId, userId });
    if (!document) return res.status(404).json({ message: 'Document not found' });

    const openai = getOpenAIClient();
    if (!openai) return res.status(500).json({ message: 'Missing OPENAI_API_KEY' });

    const prompt = [
      'Create a practical 7-day study plan from the following text.',
      'Return ONLY valid JSON with this exact shape:',
      '{ "title": "string", "overview": "string", "days": [{ "day": 1, "focus": "string", "tasks": ["string"], "estimatedHours": number }] }',
      'Rules: Exactly 7 items in "days". No markdown, no code fences, no extra text.',
      '', 'Source text:', document.originalText,
    ].join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = (response.choices?.[0]?.message?.content || '').trim();
    if (!rawText) return res.status(502).json({ message: 'AI returned empty response' });

    let studyPlan;
    try { studyPlan = JSON.parse(rawText); }
    catch (_) { return res.status(502).json({ message: 'AI did not return valid JSON', raw: rawText }); }

    return res.json({ studyPlan });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err?.message || err) });
  }
}

async function createQuiz(req, res) {
  try {
    const { documentId, questionCount = 5 } = req.body || {};
    const userId = req.user?.userId || req.user?.id;
    const count = Number(questionCount);

    if (!documentId) return res.status(400).json({ message: 'documentId is required' });
    if (!mongoose.Types.ObjectId.isValid(documentId)) return res.status(400).json({ message: 'Invalid documentId' });
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.status(401).json({ message: 'Unauthorized' });
    if (!Number.isInteger(count) || count < 1 || count > 20) return res.status(400).json({ message: 'questionCount must be 1-20' });

    const document = await Document.findOne({ _id: documentId, userId });
    if (!document) return res.status(404).json({ message: 'Document not found' });

    const openai = getOpenAIClient();
    if (!openai) return res.status(500).json({ message: 'Missing OPENAI_API_KEY' });

    const prompt = [
      `Create exactly ${count} multiple-choice questions from the following text.`,
      'Return ONLY valid JSON as an array: [{ "question": "string", "options": ["A","B","C","D"], "correctAnswer": "A", "explanation": "string" }]',
      'Rules: options must have exactly 4 choices. correctAnswer must match one option exactly. No markdown.',
      '', 'Source text:', document.originalText,
    ].join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = (response.choices?.[0]?.message?.content || '').trim();
    if (!rawText) return res.status(502).json({ message: 'AI returned empty response' });

    let quiz;
    try { quiz = JSON.parse(rawText); }
    catch (_) { return res.status(502).json({ message: 'AI did not return valid JSON', raw: rawText }); }

    if (!Array.isArray(quiz)) return res.status(502).json({ message: 'AI JSON must be an array' });

    return res.json({ quiz });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err?.message || err) });
  }
}

async function askQuestion(req, res) {
  try {
    const { documentId, question } = req.body || {};
    const userId = req.user?.userId || req.user?.id;

    if (!documentId || !question) return res.status(400).json({ message: 'documentId and question are required' });
    if (!mongoose.Types.ObjectId.isValid(documentId)) return res.status(400).json({ message: 'Invalid documentId' });

    const document = await Document.findOne({ _id: documentId, userId });
    if (!document) return res.status(404).json({ message: 'Document not found' });

    const openai = getOpenAIClient();
    if (!openai) return res.status(500).json({ message: 'Missing OPENAI_API_KEY' });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are a study assistant. Answer questions based on this document:\n\n${document.originalText}` },
        { role: 'user', content: question }
      ],
    });

    const answer = response.choices?.[0]?.message?.content || '';
    return res.json({ answer });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err?.message || err) });
  }
}

module.exports = { createStudyPlan, createQuiz, askQuestion };

