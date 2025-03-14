import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTokenFromUrl } from '../lib/spotify';

export const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = getTokenFromUrl();
    if (hash.access_token) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#181818]">
      <p className="text-white">Connecting to Spotify...</p>
    </div>
  );
};