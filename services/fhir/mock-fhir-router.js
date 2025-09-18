const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();

// In-memory stores
const patients = new Map();
const appointments = new Map();

function bundle(resources) {
  return {
    resourceType: 'Bundle',
    type: 'searchset',
    total: resources.length,
    entry: resources.map(r => ({ resource: r }))
  };
}

// Basic Patient creation
router.post('/Patient', express.json(), (req, res) => {
  const id = randomUUID();
  const resource = { resourceType: 'Patient', id, ...req.body, meta: { created: new Date().toISOString() } };
  patients.set(id, resource);
  res.status(201).json(resource);
});

// Patient read
router.get('/Patient/:id', (req, res) => {
  const r = patients.get(req.params.id);
  if (!r) return res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', details: { text: 'Not found' } }]});
  res.json(r);
});

// Patient search (very naive: name or family query)
router.get('/Patient', (req, res) => {
  const qName = req.query.name || req.query.family;
  let list = [...patients.values()];
  if (qName) {
    list = list.filter(p => (p.name||[]).some(n => (n.text||'').includes(qName) || (n.family||'').includes(qName)));
  }
  res.json(bundle(list));
});

// Appointment create
router.post('/Appointment', express.json(), (req, res) => {
  const id = randomUUID();
  const resource = { resourceType: 'Appointment', id, status: 'booked', ...req.body, meta: { created: new Date().toISOString() } };
  appointments.set(id, resource);
  res.status(201).json(resource);
});

// Appointment read
router.get('/Appointment/:id', (req, res) => {
  const r = appointments.get(req.params.id);
  if (!r) return res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', details: { text: 'Not found' } }]});
  res.json(r);
});

// Appointment search (?patient= or ?date= naive filtering)
router.get('/Appointment', (req, res) => {
  let list = [...appointments.values()];
  if (req.query.patient) list = list.filter(a => (a.participant||[]).some(p => (p.actor && p.actor.reference || '').includes(req.query.patient)));
  if (req.query.date) list = list.filter(a => (a.start || '').startsWith(req.query.date));
  res.json(bundle(list));
});

module.exports = router;
