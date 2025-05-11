'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiImage, FiVideo, FiMic, FiDownload, FiFilter } from 'react-icons/fi';

type FileType = 'photo' | 'video' | 'audio' | 'other';
type Filter = 'all' | FileType;

interface LocalFile {
  url: string;
  type: FileType;
  name: string;
}

export default function LocalGallery() {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // Function to determine file type based on URL
  const determineFileType = (url: string): FileType => {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return 'photo';
    } else if (url.match(/\.(mp4|webm|mov|avi)$/i)) {
      return 'video';
    } else if (url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      return 'audio';
    }
    return 'other';
  };

  // Function to get file name from URL
  const getFileName = (url: string): string => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  // Scan the uploads directory on component mount
  useEffect(() => {
    const scanUploads = async () => {
      try {
        setLoading(true);
        
        // We'll use fetch to get a list of files from the server
        // This is a simple implementation - in a real app, you'd have a proper API
        const response = await fetch('/api/local-files');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch files: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Map server data to our LocalFile interface
        const filesList: LocalFile[] = data.files.map((filePath: string) => {
          return {
            url: filePath,
            type: determineFileType(filePath),
            name: getFileName(filePath)
          };
        });
        
        setFiles(filesList);
      } catch (err) {
        console.error('Error fetching files:', err);
        setError((err as Error).message || 'Failed to load files');
      } finally {
        setLoading(false);
      }
    };
    
    scanUploads();
  }, []);

  // Filter files based on selected filter
  const filteredFiles = filter === 'all' 
    ? files 
    : files.filter(file => file.type === filter);

  // Handle file download
  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <div className="container-custom py-12">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/" className="text-primary hover:underline flex items-center">
            ← Back to Home
          </Link>
          <Link href="/local-upload-test" className="text-primary hover:underline flex items-center">
            Upload More Files
          </Link>
        </div>
        
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-3xl font-bold text-black text-center mb-6">Local Files Gallery</h2>
            
            {loading ? (
              <div className="text-center py-10">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <p className="mt-6 text-black">Loading files...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-600">
                <p>{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-semibold text-black">Files ({filteredFiles.length})</h3>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1 rounded-md ${
                        filter === 'all' 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-black'
                      }`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFilter('photo')}
                      className={`px-3 py-1 rounded-md flex items-center ${
                        filter === 'photo' 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-black'
                      }`}
                    >
                      <FiImage className="mr-1" /> Photos
                    </button>
                    <button 
                      onClick={() => setFilter('video')}
                      className={`px-3 py-1 rounded-md flex items-center ${
                        filter === 'video' 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-black'
                      }`}
                    >
                      <FiVideo className="mr-1" /> Videos
                    </button>
                    <button 
                      onClick={() => setFilter('audio')}
                      className={`px-3 py-1 rounded-md flex items-center ${
                        filter === 'audio' 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-black'
                      }`}
                    >
                      <FiMic className="mr-1" /> Audio
                    </button>
                  </div>
                </div>

                {filteredFiles.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xl text-black">
                      {filter === 'all' 
                        ? 'No files found. Upload some files first!' 
                        : `No ${filter} files found.`}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFiles.map((file, index) => (
                      <div key={index} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-black text-sm">{file.name}</h4>
                            <span className="text-xs bg-gray-100 text-black px-2 py-1 rounded-full">
                              {file.type}
                            </span>
                          </div>

                          <div className="mb-4">
                            {file.type === 'photo' && (
                              <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            )}
                            
                            {file.type === 'video' && (
                              <video 
                                controls 
                                className="w-full rounded-md"
                                src={file.url}
                              >
                                Your browser does not support the video tag.
                              </video>
                            )}
                            
                            {file.type === 'audio' && (
                              <audio 
                                controls 
                                className="w-full"
                                src={file.url}
                              >
                                Your browser does not support the audio tag.
                              </audio>
                            )}
                            
                            {file.type === 'other' && (
                              <div className="text-center p-4 bg-gray-50 rounded-md">
                                <a 
                                  href={file.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  View File
                                </a>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleDownload(file.url, file.name)}
                              className="flex items-center text-primary hover:text-primary/80 text-sm"
                            >
                              <FiDownload className="mr-1" /> Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 