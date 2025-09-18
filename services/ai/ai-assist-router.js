const express = require('express');
const { z } = require('zod');
const router = express.Router();

const summarySchema = z.object({
  patientId: z.string().min(1),
  mode: z.enum(['summary','plan','triage','education']).default('summary'),
  transcript: z.array(z.object({ speaker: z.string(), text: z.string() })).optional(),
  notes: z.string().optional(),
  problems: z.array(z.string()).optional()
});

router.post('/summary', express.json({ limit: '1mb' }), (req, res) => {
  const parse = summarySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'INVALID_REQUEST', issues: parse.error.issues });
  }
  const { patientId, mode } = parse.data;
  const base = {
    patientId,
    mode,
    generatedAt: new Date().toISOString(),
    model: 'webqx-ai-mock-1',
    disclaimer: 'AI mock output. Not for clinical use.',
  };
  const outputs = {
    summary: {
      headline: 'Stable follow-up visit with mild symptom reporting',
      soap: {
        subjective: 'Patient reports intermittent headaches, improving sleep.',
        objective: 'Vitals stable (mock). No acute distress.',
        assessment: 'Primary: Tension-type headaches. Secondary: Sleep hygiene issues.',
        plan: 'Continue hydration, ergonomic adjustments; reassess in 4 weeks.'
      }
    },
    plan: {
      carePlan: [
        'Track headache frequency daily',
        'Introduce 10 min stretching routine twice daily',
        'Reduce late caffeine intake',
        'Follow-up virtual visit in 4 weeks'
      ],
      tasks: [
        { type: 'follow-up', due: '2025-10-15', description: 'Virtual follow-up scheduling' },
        { type: 'monitor', metric: 'headache_count_per_week', target: '<=2' }
      ]
    },
    triage: {
      acuity: 'low',
      escalationCriteria: [ 'Severe sudden-onset headache', 'Neurological deficits', 'Visual changes' ],
      recommend: 'Self-care with monitoring; no escalation now.'
    },
    education: {
      topics: [ 'Ergonomic posture', 'Hydration and headache prevention', 'Sleep hygiene basics' ],
      resources: [
        { title: 'Headache Self-Care', url: 'https://example.org/resource/headache-care' },
        { title: 'Sleep Hygiene Guide', url: 'https://example.org/resource/sleep-hygiene' }
      ]
    }
  };
  res.json({ ...base, output: outputs[mode] });
});

module.exports = router;
