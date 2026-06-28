import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

// Ensure the directory exists
const uploadDir = path.join(__dirname, "../../../../../public/avatars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    cb(null, filename);
  },
});

// Configure multer upload limits and validation
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed."));
    }
  },
});

// Wrapper to handle multer errors gracefully
export const uploadMiddleware = (req: Request, res: Response, next: any) => {
  const uploadSingle = upload.single("avatar");
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// The Express handler
export const uploadAvatarHandler = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image provided or invalid file type." });
  }

  // Generate URL for the uploaded avatar
  const url = `/avatars/${req.file.filename}`;

  res.status(200).json({
    message: "Avatar uploaded successfully",
    url,
  });
};
