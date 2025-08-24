#!/usr/bin/env node
// Simple verifier that queries the Google Analytics Data API for a recent event name
// Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON

const {BetaAnalyticsDataClient} = require('@google-analytics/data');
const fs = require('fs');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const svc = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const propertyId = process.env.GA4_PROPERTY_ID;
  const eventName = process.env.INTEGRATION_EVENT_NAME || 'integration_test_event';
  const timeoutSec = parseInt(process.env.TELEMETRY_TIMEOUT || '180', 10); // default 180s
  const intervalSec = parseInt(process.env.TELEMETRY_POLL_INTERVAL || '10', 10); // default 10s

  if (!svc || !fs.existsSync(svc)) {
    console.log('Service account JSON not found at', svc);
    process.exit(0);
  }
  if (!propertyId) {
    console.log('GA4_PROPERTY_ID not set. Skipping telemetry check.');
    process.exit(0);
  }

  const client = new BetaAnalyticsDataClient({keyFilename: svc});

  const deadline = Date.now() + timeoutSec * 1000;
  console.log(`Telemetry verifier: looking for event '${eventName}' on property ${propertyId} for up to ${timeoutSec}s`);

  while (Date.now() < deadline) {
    try {
      const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{startDate: '7daysAgo', endDate: 'today'}],
        dimensions: [{name: 'eventName'}],
        metrics: [{name: 'eventCount'}],
        dimensionFilter: {filter: {stringFilter: {value: eventName, matchType: 'EXACT'}}}
      });
      const rows = response.rows || [];
      if (rows.length > 0) {
        console.log(`Found event ${eventName}. Rows:`, JSON.stringify(rows.map(r => r.dimensionValues.map(d => d.value))));
        process.exit(0);
      } else {
        console.log(`No events named ${eventName} found yet. Waiting ${intervalSec}s...`);
      }
    } catch (err) {
      console.error('Telemetry check attempt failed (will retry):', err.message || err);
    }
    await sleep(intervalSec * 1000);
  }

  console.log(`Timed out after ${timeoutSec}s waiting for event '${eventName}'.`);
  process.exit(2);
}

main();

main();
