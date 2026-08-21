// ═══════════════════════════════════════════════════════════
// GINGER — Cloudinary Upload Utility
// ═══════════════════════════════════════════════════════════

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * 
 * @param file The file object (from an input type="file")
 * @returns The secure URL of the uploaded image
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
  // Optional: add a folder structure if you want to organize uploads
  formData.append('folder', 'ginger_uploads'); 

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload image');
    }

    const data = await response.json();
    return data.secure_url; // Return the secure HTTPS url of the uploaded image
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};
