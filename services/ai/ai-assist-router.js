// WebQX AI Assist (mock) router
// Provides lightweight clinical summarization and task extraction
// Mount path (by unified-server): /api/ai
const express = require('express');
const { applyBranding } = require('../../config/branding.js');

const router = express.Router();

// Health
router.get('/health', (req, res) => {
  applyBranding(res);
  res.json({ service: 'ai-assist', status: 'ok', mode: 'mock' });
});

// Summarize clinical note or transcript
// Body: { note?: string, transcript?: string, patient?: { id?, name? }, context?: { visitType?, specialty? } }
router.post('/summary', express.json({ limit: '1mb' }), (req, res) => {
  applyBranding(res);
  const { note = '', transcript = '', patient = {}, context = {} } = req.body || {};
  const text = String(note || transcript || '').trim();

  if (!text) {
    return res.status(400).json({
      message: 'Provide note or transcript text to summarize',
      code: 'MISSING_TEXT'
    });
  }

  // Extremely naive mock summary; deterministic for demo
  const sentences = text
    .replace(/\n+/g, ' ') 
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 5);

  const keyFindings = [];
  const lower = text.toLowerCase();
  if (/(headache|migraine)/.test(lower)) keyFindings.push('Headache symptoms reported');
  if (/(cough|fever|sore throat)/.test(lower)) keyFindings.push('Respiratory symptoms noted');
  if (/(bp|blood pressure|hypertension)/.test(lower)) keyFindings.push('Blood pressure/HTN context');

  const plan = [
    'Provide patient education and return precautions',
    'Schedule follow-up if symptoms persist or worsen'
  ];

  const tasks = [
    { type: 'order', name: 'CBC', priority: 'routine' },
    { type: 'follow-up', name: 'Follow-up visit in 1-2 weeks', priority: 'normal' }
  ];

  const icd10Suggestions = [];
  if (/headache/.test(lower)) icd10Suggestions.push({ code: 'R51.9', display: 'Headache, unspecified' });
  if (/cough/.test(lower)) icd10Suggestions.push({ code: 'R05.9', display: 'Cough, unspecified' });

  const response = {
    patient,
    context,
    highlights: sentences,
    keyFindings,
    plan,
    tasks,
    coding: { icd10: icd10Suggestions },
    disclaimer: 'AI-generated draft. Verify clinically before use. Mock engine for demo.'
  };

  res.status(200).json(response);
});

module.exports = router;
