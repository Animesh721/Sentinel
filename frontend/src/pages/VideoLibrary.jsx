import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const VideoLibrary = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    sensitivityStatus: '',
    search: ''
  });
  const socketData = useSocket();
  const canDelete = user && (user.role === 'editor' || user.role === 'admin');

  useEffect(() => {
    fetchVideos();
  }, [filters]);

  useEffect(() => {
    if (socketData?.channel) {
      const handleProgress = (data) => {
        setVideos(prev => prev.map(video =>
          video._id === data.videoId
            ? { ...video, processingProgress: data.progress, status: data.status }
            : video
        ));
      };

      const handleComplete = (data) => {
        setVideos(prev => prev.map(video =>
          video._id === data.videoId
            ? { ...video, status: 'completed', sensitivityStatus: data.sensitivityStatus, processingProgress: 100 }
            : video
        ));
      };

      socketData.channel.bind('video:progress', handleProgress);
      socketData.channel.bind('video:complete', handleComplete);

      return () => {
        socketData.channel.unbind('video:progress', handleProgress);
        socketData.channel.unbind('video:complete', handleComplete);
      };
    }
  }, [socketData?.channel]);

  const fetchVideos = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.sensitivityStatus) params.append('sensitivityStatus', filters.sensitivityStatus);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/api/videos?${params.toString()}`);
      setVideos(response.data.videos);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await axios.delete(`/api/videos/${videoId}`);
      setVideos(videos.filter(v => v._id !== videoId));
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('Failed to delete video');
    }
  };

  if (loading) {
    return <div className="loading">Loading videos...</div>;
  }

  return (
    <div className="container">
      <h1>Video Library</h1>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>Filters</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search videos..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All</option>
              <option value="uploading">Uploading</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="form-group">
            <label>Sensitivity</label>
            <select
              value={filters.sensitivityStatus}
              onChange={(e) => setFilters({ ...filters, sensitivityStatus: e.target.value })}
            >
              <option value="">All</option>
              <option value="safe">Safe</option>
              <option value="flagged">Flagged</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {videos.length === 0 ? (
          <p>No videos found.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {videos.map(video => (
              <div key={video._id} style={{ padding: '1.5rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3>{video.originalName}</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      Uploaded: {new Date(video.createdAt).toLocaleString()}
                    </p>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>
                      Size: {(video.size / 1024 / 1024).toFixed(2)} MB
                      {video.duration && ` | Duration: ${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}`}
                    </p>
                    {video.uploadedBy && (
                      <p style={{ color: '#666', fontSize: '0.9rem' }}>
                        By: {video.uploadedBy.username || video.uploadedBy.email}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`status-badge status-${video.status}`}>
                      {video.status}
                    </span>
                    {video.sensitivityStatus && (
                      <span className={`status-badge status-${video.sensitivityStatus}`}>
                        {video.sensitivityStatus}
                      </span>
                    )}
                  </div>
                </div>

                {video.status === 'processing' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${video.processingProgress || 0}%` }}
                      />
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                      Processing: {video.processingProgress || 0}%
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  {video.status === 'completed' && (
                    <Link to={`/video/${video._id}`} className="btn btn-primary">
                      Watch
                    </Link>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(video._id)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoLibrary;

