export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
  const uploadToYodeck = async (item) => {
  const { file_url, title, content_type } = item;

  const yodeckResponse = await fetch('https://api.yodeck.com/media/', {
    method: 'POST',
    headers: {
      'Authorization': 'Token ContentmanagerAPI:zVNM66cm5DEvytjlKoQeebWkVeybcoyrVoP-I_CHV47SQhPjVB3D-6EtAdByBEKM',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: title,
      type: content_type === "video" ? "video" : "image", // adjust based on file type
      file_url: file_url,
      duration: item.duration || 30,
      tags: [`uploaded-via-yz`],
      description: `Uploaded from YZ Ad Club`
    })
  });

  if (!yodeckResponse.ok) {
    const err = await yodeckResponse.text();
    throw new Error(`Yodeck API Error: ${err}`);
  }

  return await yodeckResponse.json();
};

    const results = [];

for (const item of content) {
  try {
    const media = await uploadToYodeck(item);
    results.push({
      contentId: item.id,
      yodeckMediaId: media.id,
      status: "success"
    });
  } catch (error) {
    results.push({
      contentId: item.id,
      status: "error",
      error: error.message
    });
  }
}

}
