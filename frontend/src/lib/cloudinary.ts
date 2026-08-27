// ═══════════════════════════════════════════════════════════
// GINGER — Cloudinary Upload Utility
// ═══════════════════════════════════════════════════════════

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

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'ginger_uploads');

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  
  // Try endpoints in order: 'auto' (general), 'image' (Cloudinary natively processes PDFs as images), then 'raw'
  const endpoints = isPdf ? ['auto', 'image', 'raw'] : ['image', 'auto'];

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
