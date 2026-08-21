import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiX, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { uploadToCloudinary } from '../../lib/cloudinary';
import './ImageUpload.css';

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: Error) => void;
  defaultImage?: string;
  className?: string;
  label?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  defaultImage,
  className = '',
  label = 'Upload Image',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onUploadError?.(new Error('Please select an image file'));
      return;
    }

    // Set local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);

    try {
      const url = await uploadToCloudinary(file);
      onUploadSuccess(url);
      setPreviewUrl(url); // Swap local blob URL with actual cloud URL
    } catch (err) {
      setPreviewUrl(defaultImage || null); // Revert on failure
      onUploadError?.(err instanceof Error ? err : new Error('Upload failed'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering file input click
    setPreviewUrl(null);
    onUploadSuccess(''); // Empty string implies removal
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input
    }
  };

  return (
    <div className={`image-upload-wrapper ${className}`}>
      {label && <label className="image-upload-label">{label}</label>}
      
      <div
        className={`image-upload-dropzone ${isDragging ? 'dragging' : ''} ${previewUrl ? 'has-image' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="image-upload-input"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        <AnimatePresence mode="wait">
          {previewUrl ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="image-upload-preview"
            >
              <img src={previewUrl} alt="Upload preview" />
              
              {isUploading ? (
                <div className="image-upload-overlay uploading">
                  <FiLoader className="icon-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="image-upload-overlay success">
                  <button type="button" className="image-remove-btn" onClick={handleRemove}>
                    <FiX />
                  </button>
                  <div className="image-success-badge">
                    <FiCheckCircle />
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="image-upload-placeholder"
            >
              <div className="image-upload-icon">
                <FiUploadCloud />
              </div>
              <span className="image-upload-text">
                <span className="text-highlight">Click to upload</span> or drag and drop
              </span>
              <span className="image-upload-hint">PNG, JPG up to 10MB</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ImageUpload;
