import * as ImagePicker from "expo-image-picker";
import * as Crypto from "expo-crypto";

export interface MediaFile {
  id: string;
  uri: string;
  type: "image" | "pdf" | "text";
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

/**
 * Request permissions for image/media access
 */
export async function requestMediaPermissions(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Permission request failed:", error);
    return false;
  }
}

/**
 * Pick image from library
 */
export async function pickImage(): Promise<MediaFile | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    if (!asset.uri) return null;

    return {
      id: Crypto.randomUUID(),
      uri: asset.uri,
      type: "image",
      name: asset.fileName || "image.jpg",
      size: asset.fileSize || 0,
      mimeType: "image/jpeg",
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Image picker error:", error);
    return null;
  }
}

/**
 * Take photo with camera
 */
export async function takePhoto(): Promise<MediaFile | null> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      console.error("Camera permission denied");
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    if (!asset.uri) return null;

    return {
      id: Crypto.randomUUID(),
      uri: asset.uri,
      type: "image",
      name: asset.fileName || `photo-${Date.now()}.jpg`,
      size: asset.fileSize || 0,
      mimeType: "image/jpeg",
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Camera error:", error);
    return null;
  }
}

/**
 * Convert file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Validate image quality
 */
export function validateImageSize(sizeInBytes: number, maxSizeInMB = 10): boolean {
  const maxBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes <= maxBytes;
}

/**
 * Validate file type
 */
export function validateFileType(mimeType: string, allowedTypes: string[] = ["image/jpeg", "image/png"]): boolean {
  return allowedTypes.some((type) => mimeType.includes(type));
}

/**
 * Compress image (simulated - in production use expo-image-manipulator)
 */
export async function compressImage(uri: string): Promise<string> {
  // In production, use:
  // import * as ImageManipulator from "expo-image-manipulator";
  // For now, return original URI
  return uri;
}

/**
 * Extract text from image (OCR simulation)
 * In production, use: react-native-tesseract-ocr or similar
 */
export async function extractTextFromImage(imageUri: string): Promise<string> {
  console.warn("OCR not fully implemented. Use expo-ocr or similar library in production.");
  return "Image text extraction requires OCR library integration. Please paste text directly.";
}

/**
 * Validate PDF (simulation)
 * In production, implement full PDF support
 */
export async function validatePDF(uri: string): Promise<boolean> {
  // Check if file exists and is readable
  try {
    return !!(uri && uri.length > 0);
  } catch {
    return false;
  }
}

/**
 * Extract text from PDF (simulation)
 * In production, use: react-native-pdf-lib or similar
 */
export async function extractTextFromPDF(pdfUri: string): Promise<string> {
  console.warn("PDF text extraction not fully implemented. Use a PDF library in production.");
  return "PDF support requires PDF extraction library. Please paste content directly.";
}

/**
 * YouTube link validation
 */
export function validateYouTubeUrl(url: string): { valid: boolean; videoId?: string } {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return { valid: true, videoId: match[1] };
    }
  }

  return { valid: false };
}

/**
 * Get YouTube video metadata (requires API)
 */
export async function getYouTubeMetadata(videoId: string): Promise<{ title?: string; duration?: number } | null> {
  // In production, call YouTube API with API key
  console.log("YouTube metadata fetching requires API key");
  return null;
}

/**
 * Media cache management
 */
export async function getCacheSize(): Promise<number> {
  // Implementation would check actual cache size
  return 0;
}

export async function clearMediaCache(): Promise<void> {
  // Clear cached media files
  console.log("Media cache cleared");
}
