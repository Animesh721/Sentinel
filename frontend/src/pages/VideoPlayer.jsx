import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState(null);

  console.log('VideoPlayer component mounted with id:', id);

  useEffect(() => {
    console.log('useEffect triggered, fetching video...');
    fetchVideo();
  }, [id]);

  const fetchVideo = async () => {
    try {
      const response = await axios.get(`/api/videos/${id}`);
      const videoData = response.data.video;
      console.log('Video data received:', videoData);
      setVideo(videoData);

      // If video is completed, use Cloudinary URL directly
      if (videoData.status === 'completed' && videoData.cloudinaryUrl) {
        console.log('Setting video URL:', videoData.cloudinaryUrl);
        setVideoUrl(videoData.cloudinaryUrl);
      } else {
        console.log('Video not ready:', { status: videoData.status, hasUrl: !!videoData.cloudinaryUrl });
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      console.error('Error response:', error.response);
      setError(error.response?.data?.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <div className="loading">Loading video...</div>;
  }

  if (error || !video) {
    return (
      <div className="container">
        <div className="card">
          <div className="alert alert-error">
            {error || 'Video not found'}
          </div>
          <button onClick={() => navigate('/library')} className="btn btn-primary">
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button onClick={() => navigate('/library')} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
        ← Back to Library
      </button>

      <div className="card">
        <h1>{video.originalName}</h1>
        
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className={`status-badge status-${video.status}`}>
            {video.status}
          </span>
          {video.sensitivityStatus && (
            <span className={`status-badge status-${video.sensitivityStatus}`}>
              {video.sensitivityStatus}
            </span>
          )}
        </div>

        {video.status === 'completed' ? (
          <div style={{ marginTop: '2rem' }}>
            {videoUrl ? (
              <video
                controls
                style={{ width: '100%', maxHeight: '70vh', borderRadius: '8px' }}
                preload="metadata"
                key={videoUrl}
              >
                <source src={videoUrl} type={video.mimeType || 'video/mp4'} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="alert alert-info">
                Loading video...
              </div>
            )}
            {error && (
              <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="alert alert-info">
            Video is still processing. Please wait for processing to complete.
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <h3>Video Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <strong>Size:</strong> {(video.size / 1024 / 1024).toFixed(2)} MB
            </div>
            {video.duration && (
              <div>
                <strong>Duration:</strong> {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
              </div>
            )}
            <div>
              <strong>Uploaded:</strong> {new Date(video.createdAt).toLocaleString()}
            </div>
            {video.metadata && (
              <>
                {video.metadata.width && (
                  <div>
                    <strong>Resolution:</strong> {video.metadata.width}x{video.metadata.height}
                  </div>
                )}
                {video.metadata.codec && (
                  <div>
                    <strong>Codec:</strong> {video.metadata.codec}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;

