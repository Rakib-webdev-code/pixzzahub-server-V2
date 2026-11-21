export default function validate(required = []) {
  return (req, res, next) => {
    const missing = required.filter((k) => {
      const v = req.body[k];
      return v === undefined || v === null || v === '';
    });
    if (missing.length)
      return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    next();
  };
}