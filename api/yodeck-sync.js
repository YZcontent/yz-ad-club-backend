export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'API is working' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const body = req.body;
    console.log('Received POST request:', body);

    res.status(200).json({ success: true, received: body });
  } catch (err) {
    console.error('Error in API:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
