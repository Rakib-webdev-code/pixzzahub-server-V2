import env from '../config/env.js';

export async function uploadToImgBB(base64Image) {
  if (!env.IMGBB_API_KEY) throw new Error('IMGBB_API_KEY missing');
  const form = new URLSearchParams();
  form.append('image', base64Image);

  const r = await fetch(`https://api.imgbb.com/1/upload?key=${env.IMGBB_API_KEY}`, {
    method: 'POST',
    body: form,
  });
  const data = await r.json();
  if (!data.success) throw new Error(data?.error?.message || 'ImgBB upload failed');
  return data.data.display_url;
}