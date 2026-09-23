import path from 'path';
import crypto from 'crypto';

/**
 * Allowed Image Formats & MIME types
 */
export const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
};

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

/**
 * Detect MIME type from buffer magic bytes
 * @param {Buffer} buffer
 * @returns {string|null}
 */
export const detectImageMimeType = (buffer) => {
  if (!buffer || buffer.length < 12) return null;

  // 1. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // 2. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // 3. WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // 4. SVG: Text check for <svg tag
  const snippet = buffer.slice(0, 1024).toString('utf8').trim().toLowerCase();
  if (
    (snippet.includes('<svg') && snippet.includes('xmlns')) ||
    snippet.startsWith('<?xml') && snippet.includes('<svg')
  ) {
    return 'image/svg+xml';
  }

  return null;
};

/**
 * Validate image buffer, extension, and size
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {number} maxBytes
 * @returns {{ valid: boolean, error?: string, contentType?: string, ext?: string }}
 */
export const validateImageFile = (buffer, originalName, maxBytes = 10 * 1024 * 1024) => {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file provided' };
  }

  if (buffer.length > maxBytes) {
    const maxMB = Math.round(maxBytes / (1024 * 1024));
    return { valid: false, error: `File size exceeds the ${maxMB}MB limit` };
  }

  const rawExt = path.extname(originalName || '').toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(rawExt)) {
    return {
      valid: false,
      error: `Invalid file extension "${rawExt}". Allowed: JPG, PNG, WEBP, SVG`,
    };
  }

  const detectedMime = detectImageMimeType(buffer);
  if (!detectedMime) {
    return {
      valid: false,
      error: 'File content does not match a valid image signature (PNG, JPEG, WebP, SVG)',
    };
  }

  // Check that extension matches detected MIME
  const validExtensions = ALLOWED_IMAGE_TYPES[detectedMime] || [];
  if (!validExtensions.includes(rawExt)) {
    return {
      valid: false,
      error: `File extension "${rawExt}" does not match detected image format "${detectedMime}"`,
    };
  }

  return {
    valid: true,
    contentType: detectedMime,
    ext: rawExt,
  };
};

/**
 * Sanitize filename to prevent directory traversal and special character exploits
 * @param {string} originalName
 * @returns {string}
 */
export const sanitizeFilename = (originalName) => {
  const ext = path.extname(originalName || '').toLowerCase();
  const base = path.basename(originalName || 'image', ext);

  const cleanBase = base
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 50);

  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const timestamp = Date.now();

  return `${cleanBase || 'zubyte'}-${timestamp}-${randomSuffix}${ext}`;
};

