import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Dashboard = () => {
  const { user } = useAuth();
  const socket = useSocket(); // Returns null if not available
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    completed: 0,
    flagged: 0
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    const socketData = socket;
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
        fetchVideos(); // Refresh to get updated stats
      };

      const handleError = (data) => {
        setVideos(prev => prev.map(video =>
          video._id === data.videoId
            ? { ...video, status: 'failed' }
            : video
        ));
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
  }, [socket]);

  const fetchVideos = async () => {
    try {
      const response = await axios.get('/api/videos');
      const videoList = response.data.videos || [];
      setVideos(videoList.slice(0, 5)); // Show latest 5
      
      setStats({
        total: videoList.length,
        processing: videoList.filter(v => v.status === 'processing' || v.status === 'uploading').length,
        completed: videoList.filter(v => v.status === 'completed').length,
        flagged: videoList.filter(v => v.sensitivityStatus === 'flagged').length
      });
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      setError(error.response?.data?.message || 'Failed to load videos. Please try again.');
      setVideos([]);
      setStats({
        total: 0,
        processing: 0,
        completed: 0,
        flagged: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="container">
        <div className="card">
          <div className="alert alert-error">{error}</div>
          <button onClick={() => { setError(null); fetchVideos(); }} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <div className="alert alert-error">User data not available. Please try logging in again.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <p>Welcome, {user?.username || 'User'}! ({user?.role || 'viewer'})</p>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3>Total Videos</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>{stats.total}</p>
        </div>
        <div className="card">
          <h3>Processing</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0c5460' }}>{stats.processing}</p>
        </div>
        <div className="card">
          <h3>Completed</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#155724' }}>{stats.completed}</p>
        </div>
        <div className="card">
          <h3>Flagged</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#721c24' }}>{stats.flagged}</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Recent Videos</h2>
          <Link to="/library" className="btn btn-primary">View All</Link>
        </div>
        {videos.length === 0 ? (
          <p>No videos uploaded yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {videos.map(video => (
              <div key={video._id} style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>{video.originalName}</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>
                      {new Date(video.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`status-badge status-${video.status}`}>
                      {video.status}
                    </span>
                    {video.sensitivityStatus && (
                      <span className={`status-badge status-${video.sensitivityStatus}`} style={{ marginLeft: '0.5rem' }}>
                        {video.sensitivityStatus}
                      </span>
                    )}
                  </div>
                </div>
                {video.status === 'processing' && (
                  <div style={{ marginTop: '0.5rem' }}>
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
                {video.status === 'completed' && (
                  <Link to={`/video/${video._id}`} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                    Watch Video
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

