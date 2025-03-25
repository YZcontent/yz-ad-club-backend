export default async function handler(req, res) {
  if (req.method === 'POST') {
    return res.status(200).json({ success: true, message: 'Yodeck sync endpoint working' });
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
