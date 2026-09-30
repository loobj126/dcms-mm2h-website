// Serverless proxy for the CounterAPI "Total Visitors" counter.
// Runs on Vercel (server-side), so it is NOT subject to browser CORS
// restrictions the way a direct fetch() from the page's own JS would be,
// and it keeps the CounterAPI key out of the public JavaScript bundle.
//
// Called from assets/js/main.js as:
//   /api/visitor-count           -> read current count (no increment)
//   /api/visitor-count?action=up -> increment then return new count

const WORKSPACE = 'dcmsgroup';
const COUNTER = 'totalvisitor';

export default async function handler(req, res) {
  const shouldIncrement = req.query && req.query.action === 'up';
  const apiKey = process.env.COUNTERAPI_KEY || 'ut_kekBlq88DVmi20ygxFpVRXJTPwvvT9G6ZGbhkCEz';
  const url = `https://api.counterapi.dev/v2/${WORKSPACE}/${COUNTER}${shouldIncrement ? '/up' : ''}`;

  try {
    const apiRes = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (!apiRes.ok) {
      res.status(200).json({ error: 'upstream_error', status: apiRes.status });
      return;
    }

    const data = await apiRes.json();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(data);
  } catch (err) {
    res.status(200).json({ error: 'proxy_failed' });
  }
}
