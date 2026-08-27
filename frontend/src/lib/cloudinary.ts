// ═══════════════════════════════════════════════════════════
// GINGER — Cloudinary Upload Utility
// ═══════════════════════════════════════════════════════════

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Generates a universal, bulletproof PDF viewer URL via Google Docs Viewer
 * which displays PDFs on all mobile devices and desktop browsers without native plugin dependencies.
 */
export const getPdfViewerUrl = (url: string): string => {
  if (!url) return '';
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`;
};

/**
 * Formats a PDF URL for attachment / direct download from Cloudinary.
 */
export const getPdfDownloadUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('/image/upload/') && !url.includes('/fl_attachment/')) {
    return url.replace('/image/upload/', '/image/upload/fl_attachment/');
  }
  if (url.includes('/raw/upload/') && !url.includes('/fl_attachment/')) {
    return url.replace('/raw/upload/', '/raw/upload/fl_attachment/');
  }
  return url;
};

/**
 * Normalizes PDF URLs so they download/open cleanly even if stored under image/upload.
 */
export const formatPdfUrl = (url: string): string => {
  return getPdfDownloadUrl(url);
};

/**
 * Uploads a file (image or PDF document) to Cloudinary using unsigned upload preset.
 * 
 * @param file The file object (from an input type="file")
 * @returns The secure URL of the uploaded file
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset || cloudName === 'your_cloud_name') {
    throw new Error('Cloudinary environment variables are missing or not configured.');
  }

  // Strict 10MB size limit check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File size exceeds the 10MB limit.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'ginger_uploads');

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(file.name);
  
  // Choose optimal endpoints
  let endpoints = ['image', 'auto'];
  if (isPdf) {
    endpoints = ['raw', 'auto', 'image'];
  } else if (isVideo) {
    endpoints = ['video', 'auto'];
  }

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${endpoint}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.secure_url;
      } else {
        const errorData = await response.json().catch(() => ({}));
        lastError = new Error(errorData.error?.message || `Upload failed on ${endpoint} endpoint`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  console.error('Error uploading file to Cloudinary:', lastError);
  throw lastError || new Error('Upload failed');
};
