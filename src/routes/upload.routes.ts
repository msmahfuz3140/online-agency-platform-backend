import { Router, Request, Response, NextFunction } from "express";
import multer, { type FileFilterCallback } from "multer";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  isCloudinaryConfigured,
  ALLOWED_ALL_TYPES,
  ALLOWED_IMAGE_TYPES,
  type UploadFolder,
} from "../config/cloudinary.js";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// ─── Multer — Memory Storage (file never touches disk) ────────────────────────
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
    files: 5, // max 5 files per request
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (ALLOWED_ALL_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF, SVG, PDF, DOC, DOCX, TXT`
        )
      );
    }
  },
});

// ─── POST /api/upload — Single file upload ────────────────────────────────────
/**
 * Upload a single file to Cloudinary.
 * Query param: ?folder=team|blog|portfolio|payment|attachment|avatar|general
 * Body: multipart/form-data with field "file"
 * Returns: { success, url, publicId, format, bytes, width?, height? }
 */
router.post(
  "/",
  memoryUpload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const multerReq = req as Request & { file?: Express.Multer.File };
      if (!multerReq.file) {
        res.status(400).json({ success: false, message: "No file provided. Send a file in the 'file' field." });
        return;
      }

      if (!isCloudinaryConfigured()) {
        res.status(503).json({
          success: false,
          message: "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env",
          configured: false,
        });
        return;
      }

      const folder = (req.query.folder as UploadFolder) || "general";
      const validFolders: UploadFolder[] = ["team", "blog", "portfolio", "payment", "attachment", "avatar", "general"];
      const safeFolder: UploadFolder = validFolders.includes(folder) ? folder : "general";

      const isImage = ALLOWED_IMAGE_TYPES.includes(multerReq.file!.mimetype);

      const result = await uploadToCloudinary(multerReq.file!.buffer, {
        folder: safeFolder,
        filename: multerReq.file!.originalname,
        mimetype: multerReq.file!.mimetype,
        resourceType: isImage ? "image" : "raw",
      });

      res.status(201).json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width || null,
        height: result.height || null,
        resourceType: result.resource_type,
        folder: safeFolder,
        originalName: multerReq.file!.originalname,
      });
    } catch (err: unknown) {
      console.error("Upload error:", err);
      const message = err instanceof Error ? err.message : "Upload failed";
      res.status(500).json({ success: false, message });
    }
  }
);

// ─── POST /api/upload/multiple — Multiple files upload ────────────────────────
/**
 * Upload up to 5 files at once.
 * Query param: ?folder=team|blog|portfolio|payment|attachment|avatar|general
 * Body: multipart/form-data with field "files" (multiple)
 */
router.post(
  "/multiple",
  memoryUpload.array("files", 5),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const files = (req as Request & { files?: Express.Multer.File[] }).files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: "No files provided. Send files in the 'files' field." });
        return;
      }

      if (!isCloudinaryConfigured()) {
        res.status(503).json({
          success: false,
          message: "Cloudinary is not configured.",
          configured: false,
        });
        return;
      }

      const folder = (req.query.folder as UploadFolder) || "general";
      const validFolders: UploadFolder[] = ["team", "blog", "portfolio", "payment", "attachment", "avatar", "general"];
      const safeFolder: UploadFolder = validFolders.includes(folder) ? folder : "general";

      const uploadResults = await Promise.allSettled(
        files.map((file) =>
          uploadToCloudinary(file.buffer, {
            folder: safeFolder,
            filename: file.originalname,
            mimetype: file.mimetype,
            resourceType: ALLOWED_IMAGE_TYPES.includes(file.mimetype) ? "image" : "raw",
          })
        )
      );

      const results = uploadResults.map((r, i) => {
        if (r.status === "fulfilled") {
          return {
            success: true,
            url: r.value.secure_url,
            publicId: r.value.public_id,
            format: r.value.format,
            bytes: r.value.bytes,
            width: r.value.width || null,
            height: r.value.height || null,
            originalName: files[i].originalname,
          };
        } else {
          return {
            success: false,
            error: r.reason?.message || "Upload failed",
            originalName: files[i].originalname,
          };
        }
      });

      const allSuccess = results.every((r) => r.success);
      res.status(allSuccess ? 201 : 207).json({
        success: allSuccess,
        count: results.filter((r) => r.success).length,
        results,
      });
    } catch (err: unknown) {
      console.error("Multiple upload error:", err);
      const message = err instanceof Error ? err.message : "Upload failed";
      res.status(500).json({ success: false, message });
    }
  }
);

// ─── DELETE /api/upload/:publicId — Delete from Cloudinary ───────────────────
/**
 * Delete a file from Cloudinary by its publicId.
 * Admin only.
 * Query param: ?type=image|raw (default: image)
 */
router.delete(
  "/:publicId(*)",  // (*) to allow slashes in publicId like "nexora/team/xyz"
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!isCloudinaryConfigured()) {
        res.status(503).json({ success: false, message: "Cloudinary is not configured." });
        return;
      }

      const { publicId } = req.params;
      const safePublicId = Array.isArray(publicId) ? publicId[0] : String(publicId);
      const resourceType = (req.query.type as "image" | "raw") || "image";

      const result = await deleteFromCloudinary(safePublicId, resourceType);

      if (result.result === "ok" || result.result === "not found") {
        res.json({ success: true, message: "File deleted from Cloudinary", result });
      } else {
        res.status(400).json({ success: false, message: "Delete failed", result });
      }
    } catch (err: unknown) {
      console.error("Cloudinary delete error:", err);
      const message = err instanceof Error ? err.message : "Delete failed";
      res.status(500).json({ success: false, message });
    }
  }
);

// ─── GET /api/upload/status — Check Cloudinary config status ─────────────────
router.get("/status", (_req: Request, res: Response) => {
  const configured = isCloudinaryConfigured();
  res.json({
    success: true,
    configured,
    cloudName: configured ? process.env.CLOUDINARY_CLOUD_NAME : null,
    message: configured
      ? `Cloudinary configured — cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`
      : "Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env",
  });
});

// ─── Multer Error Handler ─────────────────────────────────────────────────────
router.use((err: Error & { code?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ success: false, message: "File too large. Maximum size: 20MB" });
      return;
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      res.status(400).json({ success: false, message: "Too many files. Maximum: 5 files per upload" });
      return;
    }
  }
  res.status(400).json({ success: false, message: err.message || "Upload error" });
});

export default router;
