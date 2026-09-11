import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse, UploadApiOptions } from "cloudinary";
import { Readable } from "stream";


// ─── Configure Cloudinary ─────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

// ─── Allowed folder keys → Cloudinary folder paths ────────────────────────────
export const UPLOAD_FOLDERS = {
  team:        "nexora/team",
  blog:        "nexora/blog",
  portfolio:   "nexora/portfolio",
  payment:     "nexora/payments",
  attachment:  "nexora/attachments",
  avatar:      "nexora/avatars",
  general:     "nexora/general",
} as const;

export type UploadFolder = keyof typeof UPLOAD_FOLDERS;

// ─── Allowed MIME types ───────────────────────────────────────────────────────
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
export const ALLOWED_PDF_TYPES = ALLOWED_DOC_TYPES;
export const ALLOWED_ALL_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];

// ─── Upload helper: Buffer → Cloudinary ──────────────────────────────────────
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: {
    folder: UploadFolder;
    filename?: string;
    mimetype?: string;
    resourceType?: "image" | "raw" | "video" | "auto";
    transformation?: UploadApiOptions["transformation"];
  }
): Promise<UploadApiResponse> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME") {
    throw new Error("Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.");
  }

  const folderPath = UPLOAD_FOLDERS[options.folder] || UPLOAD_FOLDERS.general;
  const isImage = ALLOWED_IMAGE_TYPES.includes(options.mimetype || "");
  const resourceType = options.resourceType || (isImage ? "image" : "raw");

  const uploadOptions: UploadApiOptions = {
    folder: folderPath,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    // Auto-quality + auto-format for images
    ...(resourceType === "image" && {
      transformation: options.transformation || [
        { quality: "auto:good", fetch_format: "auto" },
      ],
    }),
  };

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: unknown, result: UploadApiResponse | undefined) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result from Cloudinary"));
        resolve(result);
      }
    );

    // Convert Buffer to Readable stream and pipe to Cloudinary
    const readable = new Readable();
    readable.push(fileBuffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

// ─── Delete file from Cloudinary ─────────────────────────────────────────────
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "raw" | "video" = "image"
): Promise<{ result: string }> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME") {
    throw new Error("Cloudinary is not configured.");
  }
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

// ─── Check if Cloudinary is configured ───────────────────────────────────────
export function isCloudinaryConfigured(): boolean {
  const name = process.env.CLOUDINARY_CLOUD_NAME || "";
  const key = process.env.CLOUDINARY_API_KEY || "";
  const secret = process.env.CLOUDINARY_API_SECRET || "";
  return (
    name.length > 0 &&
    key.length > 0 &&
    secret.length > 0 &&
    name !== "YOUR_CLOUD_NAME" &&
    key !== "YOUR_API_KEY" &&
    secret !== "YOUR_API_SECRET"
  );
}

export { cloudinary };

