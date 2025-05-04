'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import Image from 'next/image';
import { FiImage, FiVideo, FiMic, FiDownload, FiFilter } from 'react-icons/fi';

interface MediaItem {
  id: string;
  name: string;
  message: string;
  fileURL: string;
  fileType: 'photo' | 'video' | 'audio';
  mimeType: string;
  createdAt: {
    toDate: () => Date;
  };
}

export default function GalleryView() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'photo' | 'video' | 'audio'>('all');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const mediaCollection = collection(db, 'media');
      const q = query(mediaCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const items: MediaItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as MediaItem);
      });
      
      setMediaItems(items);
      setError('');
    } catch (err) {
      console.error('Error fetching media:', err);
      setError('Failed to load media. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = filter === 'all' 
    ? mediaItems 
    : mediaItems.filter(item => item.fileType === filter);

  const handleDownload = async (fileURL: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <p className="mt-6 text-gray-700">Loading gallery...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        <p>{error}</p>
        <button 
          onClick={fetchMedia}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-gray-800">
          {filter === 'all' 
            ? 'No media items found. Be the first to upload!' 
            : `No ${filter} uploads found.`}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-semibold">Gallery</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md ${
              filter === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('photo')}
            className={`px-3 py-1 rounded-md flex items-center ${
              filter === 'photo' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <FiImage className="mr-1" /> Photos
          </button>
          <button 
            onClick={() => setFilter('video')}
            className={`px-3 py-1 rounded-md flex items-center ${
              filter === 'video' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <FiVideo className="mr-1" /> Videos
          </button>
          <button 
            onClick={() => setFilter('audio')}
            className={`px-3 py-1 rounded-md flex items-center ${
              filter === 'audio' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <FiMic className="mr-1" /> Audio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium">{item.name}</h4>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {item.fileType}
                </span>
              </div>
              
              {item.message && (
                <p className="text-gray-800 text-sm mb-4">{item.message}</p>
              )}

              <div className="mb-4">
                {item.fileType === 'photo' && (
                  <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                    <Image 
                      src={item.fileURL}
                      alt={`Photo by ${item.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                )}
                
                {item.fileType === 'video' && (
                  <video 
                    controls 
                    className="w-full rounded-md"
                    src={item.fileURL}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
                
                {item.fileType === 'audio' && (
                  <audio 
                    controls 
                    className="w-full"
                    src={item.fileURL}
                  >
                    Your browser does not support the audio tag.
                  </audio>
                )}
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-700">
                <span>
                  {new Date(item.createdAt.toDate()).toLocaleString()}
                </span>
                <button
                  onClick={() => handleDownload(item.fileURL, `birthday_${item.id}`)}
                  className="flex items-center text-primary hover:text-primary/80"
                >
                  <FiDownload className="mr-1" /> Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 