import { createHash } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { ValidationError } from "../types/app-error.js";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

/** Normalized result returned after a successful Cloudinary upload. */
export type CloudinaryUploadResult = {
    secureUrl: string;
    publicId: string;
    bytes: number;
    originalFilename: string;
    resourceType: "raw" | "image";
};

type CloudinaryUploadResponse = {
    secure_url: string;
    public_id: string;
    bytes: number;
    resource_type?: string;
    error?: { message: string };
};

function configureCloudinary() {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });
}

export function getSignedCloudinaryDownloadUrl(
    publicId: string,
    resourceType: "raw" | "image" = "raw",
) {
    if (!cloudName || !apiKey || !apiSecret) {
        return null;
    }

    configureCloudinary();

    return cloudinary.url(publicId, {
        resource_type: resourceType,
        type: "upload",
        sign_url: true,
        secure: true,
    });
}

/**
 * Uploads a PDF buffer to Cloudinary using a signed request.
 *
 * Requests are signed with the API secret, so no unsigned upload preset is
 * required (unsigned presets must first exist in the Cloudinary dashboard and
 * are what produce "upload preset not found" errors when missing).
 *
 * @param buffer - PDF file bytes from Multer
 * @param filename - Original filename (used in the multipart form)
 * @returns Upload metadata including secure URL and public id
 * @throws {ValidationError} When Cloudinary is not configured or upload is rejected
 */
/**
 * Deletes an uploaded asset from Cloudinary.
 *
 * Returns early when Cloudinary credentials are not configured so local
 * development can still delete database records.
 */
export async function deleteCloudinaryAsset(
    publicId: string,
    resourceType: "raw" | "image" = "raw",
): Promise<void> {
    if (!cloudName || !apiKey || !apiSecret) {
        return;
    }

    configureCloudinary();
    await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
    });
}

/**
 * Builds a Cloudinary request signature: SHA-1 of the alphabetically sorted
 * parameters (excluding `file`, `api_key`, `resource_type` and `signature`)
 * joined as `key=value` pairs and suffixed with the API secret.
 */
function signParams(params: Record<string, string | number>, secret: string) {
    const toSign = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&");

    return createHash("sha1").update(`${toSign}${secret}`).digest("hex");
}

export async function uploadPdfToCloudinary(
    buffer: Buffer,
    filename: string,
): Promise<CloudinaryUploadResult> {
    if (!cloudName || !apiKey || !apiSecret) {
        throw new ValidationError(
            "Cloudinary is not configured on the server (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required)",
        );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "chaibook/pdfs";

    const signature = signParams({ folder, timestamp }, apiSecret);

    const form = new FormData();
    form.append(
        "file",
        new Blob([new Uint8Array(buffer)], { type: "application/pdf" }),
        filename,
    );
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);
    form.append("folder", folder);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
        { method: "POST", body: form },
    );

    const result = (await response.json()) as CloudinaryUploadResponse;

    if (!response.ok) {
        const message =
            result.error?.message ??
            `Cloudinary upload failed (${response.status})`;

        if (response.status === 401 || response.status === 403) {
            throw new ValidationError(
                `Cloudinary rejected the upload: ${message}. Check CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in server/.env.`,
            );
        }

        throw new ValidationError(message);
    }

    return {
        secureUrl: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
        originalFilename: filename,
        resourceType: result.resource_type === "image" ? "image" : "raw",
    };
}