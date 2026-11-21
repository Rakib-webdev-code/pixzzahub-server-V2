import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { uploadToImgBB } from '../utils/imgbb.js';

const router = Router();

router.post('/', verifyJWT, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: 'image base64 required' });
    const base64 = image.includes(',') ? image.split(',')[1] : image;
    const url = await uploadToImgBB(base64);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;