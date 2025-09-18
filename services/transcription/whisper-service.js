// Mock Whisper transcription service router
// Future: streaming, SSE partials, diarization, language detection
import express from 'express';
import { applyBranding } from '../../config/branding.js';

const router = express.Router();

// Simple health
router.get('/health', (req, res) => {
  applyBranding(res);
  res.json({ service: 'transcription', status: 'ok', engine: 'whisper-mock' });
});

// Mock transcription endpoint
router.post('/mock', express.json({ limit: '2mb' }), (req, res) => {
  applyBranding(res);
  const { audioReference, language = 'en', mode = 'encounter', simulateLatency = 400 } = req.body || {};

  const baseTime = Date.now();
  const payload = {
    id: 'tx_mock_' + Math.random().toString(36).slice(2, 9),
    receivedAt: new Date(baseTime).toISOString(),
    processedAt: new Date(baseTime + simulateLatency).toISOString(),
    engine: 'whisper-mock',
    language,
    mode,
    audioReference: audioReference || 'inline-or-stream',
    transcript: [
      { ts: 0.0, speaker: 'clinician', text: 'Good morning, how are you feeling today?' },
      { ts: 2.9, speaker: 'patient', text: 'I have been having headaches and some trouble sleeping.' },
      { ts: 6.8, speaker: 'clinician', text: 'Any vision changes or nausea associated with the headaches?' },
      { ts: 10.5, speaker: 'patient', text: 'No vision changes, a little light sensitivity.' }
    ],
    summary: {
      encounterType: 'follow-up',
      complaints: ['headaches', 'sleep disturbance'],
      differentials: ['tension headache', 'migraine (possible)', 'insomnia'],
      plan: [
        'Track headache frequency and triggers',
        'Sleep hygiene counseling',
        'Consider low-dose preventive if persistent next visit'
      ],
      riskFlags: [],
      structured: {
        symptoms: ['headache', 'light sensitivity', 'sleep difficulty'],
        denies: ['vision change', 'nausea'],
      }
    },
    disclaimers: [
      'AI-generated content. Verify clinically before use.',
      'Mock engine – not real Whisper output.'
    ]
  };

  res.status(201).json(payload);
});

export default router;
