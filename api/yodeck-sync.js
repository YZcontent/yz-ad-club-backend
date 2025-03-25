export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { businessId, businessName, content } = req.body;

  if (!businessId || !content) {
    return res.status(400).json({ message: 'Invalid Payload' });
  }

  console.log('Received sync:', businessId, content);

  // Mock response
  return res.status(200).json({
    success: true,
    message: 'Yodeck sync simulated',
    businessId,
    syncedCount: content.length,
    content
  });
}
