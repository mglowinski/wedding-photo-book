'use client';

import { useState, useEffect } from 'react';
import { FiImage, FiVideo, FiMic, FiDownload, FiUser, FiMessageCircle, FiX, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';

type FileType = 'photo' | 'video' | 'audio' | 'other';
type Filter = 'all' | FileType;

interface LocalFile {
  url: string;
  type: FileType;
  name?: string;
  message?: string; // Keep for backward compatibility with existing files
  fileName?: string;
  createdAt?: string;
  key?: string;
  id?: string;
}

export default function LocalGalleryView() {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [modalImage, setModalImage] = useState<LocalFile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  // Function to fetch files from API
  const fetchFiles = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (forceRefresh) {
        setRefreshing(true);
      }
      
      // Add cache busting parameter and force parameter if needed
      const cacheBuster = `t=${Date.now()}`;
      const forceParam = forceRefresh ? 'force=true' : '';
      const queryParams = [cacheBuster, forceParam].filter(Boolean).join('&');
      
      // We'll use fetch to get a list of files from the server
      const response = await fetch(`/api/local-files?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Gallery received ${data.files?.length || 0} files from API`);
      
      // Log the first few files for debugging
      if (data.files && data.files.length > 0) {
        data.files.slice(0, 5).forEach((file: any, index: number) => {
          console.log(`Gallery file ${index + 1}:`, {
            url: file.url ? file.url.substring(0, 50) + '...' : 'null',
            type: file.type || 'unknown',
            name: file.name || 'unnamed',
            fileName: file.fileName || 'no filename'
          });
        });
        
        if (data.files.length > 5) {
          console.log(`... and ${data.files.length - 5} more files`);
        }
      } else {
        console.log('No files received from API');
      }
      
      setFiles(data.files || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError((err as Error).message || 'Failed to load files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load files on component mount
  useEffect(() => {
    // Load files when the component mounts
    fetchFiles(true);
    
    // No need for refresh interval as we're using public direct URLs now
  }, []);

  // Filter files based on selected filter
  const filteredFiles = filter === 'all' 
    ? files 
    : files.filter(file => file.type === filter);

  // Handle file download
  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || url.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open image in modal
  const openImageModal = (file: LocalFile) => {
    setModalImage(file);
    // Prevent scrolling on body when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Close image modal
  const closeImageModal = () => {
    setModalImage(null);
    // Restore scrolling
    document.body.style.overflow = 'auto';
  };

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalImage) {
        closeImageModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalImage]);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pl-PL', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="text-center py-10">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <p className="mt-6 text-black">Wczytywanie plików...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        <p>{error}</p>
        <button 
          onClick={() => fetchFiles(true)}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Image Modal */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={closeImageModal}>
          <div className="relative max-w-5xl max-h-[90vh] w-full mx-2 sm:mx-4">
            <button 
              className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black bg-opacity-50 text-white p-1.5 sm:p-2 rounded-full hover:bg-opacity-70 z-10"
              onClick={closeImageModal}
            >
              <FiX size={20} className="sm:hidden" />
              <FiX size={24} className="hidden sm:block" />
            </button>
            
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-lg max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center mb-2 sm:mb-3">
                <FiUser className="text-gray-400 mr-1 sm:mr-1.5" />
                <h3 className="font-medium text-black text-sm sm:text-base">{modalImage.name}</h3>
              </div>
              
              {modalImage.message && (
                <div className="mb-3 sm:mb-4 text-gray-600 flex items-start">
                  <FiMessageCircle className="text-gray-400 mr-1 sm:mr-1.5 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">{modalImage.message}</p>
                </div>
              )}
              
              <div className="mb-3 sm:mb-4">
                <img
                  src={modalImage.url}
                  alt={modalImage.fileName || 'Zdjęcie'}
                  className="w-full h-auto max-h-[60vh] sm:max-h-[70vh] object-contain rounded-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                    // Replace with an inline error indicator instead of loading another image
                    const container = target.parentElement;
                    if (container) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'flex flex-col items-center justify-center bg-gray-100 w-full h-64 rounded-md';
                      errorDiv.innerHTML = `
                        <div class="text-red-500 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-triangle">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                        </div>
                        <p class="text-gray-700">Nie można załadować zdjęcia</p>
                      `;
                      container.appendChild(errorDiv);
                    }
                    console.error('Error loading image:', modalImage.url);
                  }}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[45%]">
                  {formatDate(modalImage.createdAt)}
                </div>
                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    onClick={() => handleDownload(modalImage.url, modalImage.fileName || '')}
                    className="flex items-center text-primary hover:text-primary/80 text-xs sm:text-sm"
                  >
                    <FiDownload className="mr-1" /> Pobierz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3 sm:gap-0">
        <div className="text-black text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
          {filteredFiles.length} {filter === 'all' 
            ? 'elementów' 
            : filter === 'photo' 
              ? 'zdjęć' 
              : filter === 'video' 
                ? 'wideo' 
                : 'plików audio'}
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm ${
              filter === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-black'
            }`}
          >
            Wszystko
          </button>
          <button 
            onClick={() => setFilter('photo')}
            className={`px-2 sm:px-3 py-1 rounded-md flex items-center text-xs sm:text-sm ${
              filter === 'photo' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-black'
            }`}
          >
            <FiImage className="mr-1" /> Zdjęcia
          </button>
          <button 
            onClick={() => setFilter('video')}
            className={`px-2 sm:px-3 py-1 rounded-md flex items-center text-xs sm:text-sm ${
              filter === 'video' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-black'
            }`}
          >
            <FiVideo className="mr-1" /> Wideo
          </button>
          <button 
            onClick={() => setFilter('audio')}
            className={`px-2 sm:px-3 py-1 rounded-md flex items-center text-xs sm:text-sm ${
              filter === 'audio' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-black'
            }`}
          >
            <FiMic className="mr-1" /> Audio
          </button>
        </div>
      </div>

      {refreshing && (
        <div className="text-center py-2 mb-3 sm:mb-4 text-primary rounded-md text-xs sm:text-sm flex items-center justify-center">
          <FiRefreshCw className="inline-block animate-spin mr-2" />
          <span>Automatyczne odświeżanie zawartości...</span>
        </div>
      )}

      {filteredFiles.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-black">
            {filter === 'all' 
              ? 'Brak plików. Dodaj jakieś pliki!' 
              : `Brak plików typu ${filter === 'photo' ? 'zdjęcie' : filter === 'video' ? 'wideo' : 'audio'}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredFiles.map((file, index) => (
            <div key={index} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 sm:p-4">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <div className="flex items-center max-w-[65%]">
                    <FiUser className="text-gray-400 mr-1 sm:mr-1.5 flex-shrink-0" />
                    <h4 className="font-medium text-black text-sm sm:text-base truncate">{file.name}</h4>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    <span className="text-xs bg-gray-100 text-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      {file.type === 'photo' 
                        ? 'zdjęcie' 
                        : file.type === 'video' 
                          ? 'wideo' 
                          : file.type === 'audio' 
                            ? 'audio' 
                            : file.type}
                    </span>
                  </div>
                </div>

                {file.message && (
                  <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-gray-600 flex items-start">
                    <FiMessageCircle className="text-gray-400 mr-1 sm:mr-1.5 mt-0.5 flex-shrink-0" />
                    <p className="line-clamp-2">{file.message}</p>
                  </div>
                )}

                <div className="mb-3 sm:mb-4">
                  {file.type === 'photo' && (
                    <div 
                      className="relative w-full h-36 sm:h-48 bg-gray-100 rounded-md overflow-hidden cursor-pointer"
                      onClick={() => openImageModal(file)}
                    >
                      <img
                        src={file.url}
                        alt={file.fileName || 'Zdjęcie'}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.style.display = 'none';
                          // Replace with an inline error indicator
                          const container = target.parentElement;
                          if (container) {
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'flex flex-col items-center justify-center bg-gray-100 w-full h-full rounded-md';
                            errorDiv.innerHTML = `
                              <div class="text-red-500 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-triangle">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                  <line x1="12" y1="9" x2="12" y2="13"></line>
                                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                              </div>
                              <p class="text-gray-700 text-sm">Błąd obrazu</p>
                            `;
                            container.appendChild(errorDiv);
                          }
                          console.error('Error loading image:', file.url);
                        }}
                      />
                      <div className="absolute inset-0 bg-black opacity-0 hover:opacity-20 transition-opacity flex items-center justify-center">
                        <span className="text-white font-medium">Zobacz</span>
                      </div>
                    </div>
                  )}
                  
                  {file.type === 'video' && (
                    <video 
                      controls 
                      className="w-full rounded-md"
                      src={file.url}
                    >
                      Twoja przeglądarka nie obsługuje odtwarzania wideo.
                    </video>
                  )}
                  
                  {file.type === 'audio' && (
                    <audio 
                      controls 
                      className="w-full"
                      src={file.url}
                    >
                      Twoja przeglądarka nie obsługuje odtwarzania audio.
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
                        Zobacz plik
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500 truncate max-w-[65%]">
                    {formatDate(file.createdAt)}
                  </div>
                  <button
                    onClick={() => handleDownload(file.url, file.fileName || '')}
                    className="flex items-center text-primary hover:text-primary/80 text-xs sm:text-sm"
                  >
                    <FiDownload className="mr-1" /> Pobierz
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 