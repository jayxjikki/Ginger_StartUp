// ═══════════════════════════════════════════════════════════
// GINGER — Storage & Media Upload Utilities
// ═══════════════════════════════════════════════════════════

import { supabase } from './supabase';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Generates a clean URL for viewing PDFs across mobile and desktop.
 * - For Supabase Storage URLs: returns the direct PDF URL.
 * - For Cloudinary image/upload URLs: converts to high-res JPG render to avoid Cloudinary's 401 PDF restriction.
 */
export const getPdfViewerUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('supabase.co')) {
    return url;
  }
  if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
    // Cloudinary restricts direct .pdf delivery with 401 under image/upload unless converted to image
    return url.replace('/image/upload/', '/image/upload/f_jpg,q_auto/').replace(/\.pdf$/i, '.jpg');
  }
  return url;
};

/**
 * Generates a clean download URL for PDFs.
 */
export const getPdfDownloadUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('supabase.co')) {
    return url;
  }
  if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
    return url.replace('/image/upload/', '/image/upload/f_jpg,q_auto/').replace(/\.pdf$/i, '.jpg');
  }
  return url;
};

/**
 * Normalizes PDF URLs so they download/open cleanly.
 */
export const formatPdfUrl = (url: string): string => {
  return getPdfViewerUrl(url);
};

/**
 * Direct file download helper using Blob fetch to guarantee downloads work across all browsers.
 */
export const triggerFileDownload = async (url: string, defaultFilename: string) => {
  try {
    const downloadUrl = getPdfDownloadUrl(url);
    const res = await fetch(downloadUrl, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
    return true;
  } catch (err) {
    console.warn('Direct blob download failed, falling back to window.open:', err);
    window.open(url, '_blank', 'noopener,noreferrer');
    return false;
  }
};

/**
 * Uploads a file (Image or PDF document).
 * For PDFs: tries Supabase Storage first for 100% native unblocked PDF delivery, falls back to Cloudinary.
 */
export const uploadToCloudinary = async (file: File, userId?: string): Promise<string> => {
  // Strict 10MB size limit check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File size exceeds the 10MB limit.');
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  // If PDF, try uploading to Supabase Storage 'media_kits' bucket first
  if (isPdf) {
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${userId || 'public'}/${Date.now()}_${cleanFileName}`;
      
      const { data, error } = await supabase.storage
        .from('media_kits')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/pdf'
        });

      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage
          .from('media_kits')
          .getPublicUrl(filePath);
        return publicUrl;
      }
    } catch (supabaseErr) {
      console.warn('Supabase storage upload error, using Cloudinary fallback:', supabaseErr);
    }
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset || cloudName === 'your_cloud_name') {
    throw new Error('Cloudinary environment variables are missing or not configured.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'ginger_uploads');

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

  throw lastError || new Error('Upload failed. Please try again.');
};
