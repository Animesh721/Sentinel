import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

const VideoUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [videoId, setVideoId] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const socketData = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (socketData?.channel && videoId) {
      const handleProgress = (data) => {
        if (data.videoId === videoId) {
          setProcessingProgress(data.progress);
        }
      };

      const handleComplete = (data) => {
        if (data.videoId === videoId) {
          setProcessingProgress(100);
          setSuccess('Video processed successfully!');
          setTimeout(() => {
            navigate('/library');
          }, 2000);
        }
      };

      const handleError = (data) => {
        if (data.videoId === videoId) {
          setError('Video processing failed: ' + data.error);
        }
      };

      socketData.channel.bind('video:progress', handleProgress);
      socketData.channel.bind('video:complete', handleComplete);
      socketData.channel.bind('video:error', handleError);

      return () => {
        socketData.channel.unbind('video:progress', handleProgress);
        socketData.channel.unbind('video:complete', handleComplete);
        socketData.channel.unbind('video:error', handleError);
      };
    }
  }, [socketData?.channel, videoId, navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 500 * 1024 * 1024) {
        setError('File size must be less than 500MB');
        return;
      }
      setFile(selectedFile);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a video file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);
    setProcessingProgress(0);

    try {
      console.log('Starting file upload...', { name: file.name, size: file.size, type: file.type });

      // Step 1: Get upload URL from backend
      console.log('Getting upload URL from backend...');
      const urlResponse = await axios.post('/api/videos/upload-url', {
        originalName: file.name,
        mimeType: file.type,
        size: file.size
      });

      const { uploadUrl, uploadPreset, publicId, videoId: newVideoId } = urlResponse.data;
      setVideoId(newVideoId);
      console.log('Got upload URL, uploading directly to Cloudinary...');

      // Step 2: Upload directly to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('public_id', publicId);

      const cloudinaryResponse = await axios.post(uploadUrl, formData, {
        headers: {
          'Authorization': undefined  // Remove auth header for Cloudinary
        },
        transformRequest: [(data, headers) => {
          // Remove Authorization headers that might be set globally
          if (headers && headers.common) {
            delete headers.common['Authorization'];
          }
          if (headers) {
            delete headers['Authorization'];
          }
          return data;
        }],
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log('Upload progress:', percentCompleted + '%');
          setUploadProgress(percentCompleted);
        }
      });

      console.log('Cloudinary upload complete:', cloudinaryResponse.data);

      // Step 3: Notify backend that upload is complete
      console.log('Notifying backend of upload completion...');
      await axios.post(`/api/videos/${newVideoId}/upload-complete`, {
        cloudinaryData: cloudinaryResponse.data
      });

      setSuccess('Video uploaded successfully! Processing...');
      setUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      setError(error.response?.data?.message || error.message || 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="container">
      <h1>Upload Video</h1>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="form-group">
          <label>Select Video File</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <p style={{ marginTop: '0.5rem', color: '#666' }}>
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div style={{ marginBottom: '1rem' }}>
            <p>Upload Progress: {uploadProgress}%</p>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {processingProgress > 0 && processingProgress < 100 && (
          <div style={{ marginBottom: '1rem' }}>
            <p>Processing Progress: {processingProgress}%</p>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          className="btn btn-primary"
          disabled={!file || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </div>
    </div>
  );
};

export default VideoUpload;

