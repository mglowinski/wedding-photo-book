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
  const [modalScrollY, setModalScrollY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingFileUrl, setDownloadingFileUrl] = useState<string | null>(null);

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
      
      // Add cache busting parameter to ensure we get fresh data
      const cacheBuster = `t=${Date.now()}`;
      const forceParam = forceRefresh ? 'force=true' : '';
      const queryParams = [cacheBuster, forceParam].filter(Boolean).join('&');
      
      // We'll use fetch to get a list of files from the server
      const response = await fetch(`/api/local-files?${queryParams}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.status}`);
      }
      
      // Parse response data
      const data = await response.json();
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
    fetchFiles(false);
  }, []);

  // Filter files based on selected filter
  const filteredFiles = filter === 'all' 
    ? files 
    : files.filter(file => file.type === filter);

  // Handle file download
  const handleDownload = async (url: string, fileName: string) => {
    try {
      // Show temporary download indicator for this specific file
      setDownloadingFileUrl(url);
      
      // Fetch the file as a blob
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      // Get the file as a blob
      const blob = await response.blob();
      
      // Create a local object URL for the blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary anchor element for downloading
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'download';
      link.style.display = 'none';
      
      // Add to DOM, click and clean up
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        setDownloadingFileUrl(null);
      }, 100);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Nie udało się pobrać pliku. Spróbuj ponownie.');
      setDownloadingFileUrl(null);
    }
  };

  // Open image modal
  const openImageModal = (file: LocalFile, e?: React.MouseEvent) => {
    // Stop event propagation if event is provided
    if (e) {
      e.stopPropagation();
    }
    
    // If there's already a modal open, close it first
    if (modalImage) {
      closeImageModal();
    }
    
    // Capture current scroll position
    const currentScrollY = window.scrollY;
    setModalScrollY(currentScrollY);
    
    // Set modal image
    setModalImage(file);
    
    // Store the scroll position
    window.sessionStorage.setItem('scrollPosition', currentScrollY.toString());
    
    // Prevent scrolling on body when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Close image modal
  const closeImageModal = () => {
    setModalImage(null);
    // Restore scrolling
    document.body.style.overflow = 'auto';
    // Restore scroll position
    const scrollPosition = parseInt(window.sessionStorage.getItem('scrollPosition') || '0');
    setTimeout(() => window.scrollTo(0, scrollPosition), 50);
  };

  // Handle global click events
  useEffect(() => {
    const handleGlobalClick = () => {
      if (modalImage) {
        closeImageModal();
      }
    };

    // Add event listener for global clicks if modal is open
    if (modalImage) {
      document.addEventListener('click', handleGlobalClick);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [modalImage]);

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
  
  // Let's not scroll the modal on mobile - it causes positioning issues
  // The modal container is already fixed position and should be visible

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
      {/* Image Modal - positioned at current scroll */}
      {modalImage && (
        <div 
          className="fixed z-50 flex items-center justify-center touch-none" 
          style={{ 
            position: 'fixed',
            top: `${modalScrollY}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'auto',
            padding: '0',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.75)'
          }}
          onClick={closeImageModal}
        >
          <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
            <button 
              className="absolute top-0 right-0 bg-white text-black p-2 rounded-full hover:bg-gray-100 z-50 shadow-lg"
              style={{
                top: '5px',
                right: '5px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(0,0,0,0.2)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                closeImageModal();
              }}
            >
              <FiX size={24} />
            </button>
            
            <div 
              className="bg-white bg-opacity-95 rounded-lg shadow-lg overflow-hidden flex flex-col"
              style={{ 
                maxWidth: '90vw',
                maxHeight: '85vh',
                width: 'auto',
                height: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image container with automatically adjusted position */}
              <div 
                className="relative overflow-hidden p-1 sm:p-2 flex-grow flex items-center justify-center"
                id="modalImageContainer"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={modalImage.url}
                  alt={modalImage.fileName || 'Zdjęcie'}
                  className="max-h-[80vh] w-auto object-contain"
                  style={{ maxWidth: '95%', minWidth: '250px' }}
                  onClick={(e) => e.stopPropagation()}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                    // Replace with an inline error indicator
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
              
              {/* Info footer */}
              <div className="py-1 px-2 sm:p-3 border-t border-gray-100">
                {modalImage.message && (
                  <div className="mb-2 text-gray-600 flex items-start">
                    <FiMessageCircle className="text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                    <p className="text-xs">{modalImage.message}</p>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500 truncate max-w-[45%]">
                    {formatDate(modalImage.createdAt)}
                  </div>
                  <button
                    onClick={() => handleDownload(modalImage.url, modalImage.fileName || '')}
                    disabled={downloadingFileUrl === modalImage.url}
                    className="flex items-center text-primary hover:text-primary/80 text-xs"
                  >
                    {downloadingFileUrl === modalImage.url ? (
                      <>
                        <span className="mr-1.5 w-3 h-3 rounded-full bg-primary animate-pulse"></span>
                        Pobieranie...
                      </>
                    ) : (
                      <>
                        <FiDownload className="mr-1" /> Pobierz
                      </>
                    )}
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
              : 'wideo'}
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
              : `Brak plików typu ${filter === 'photo' ? 'zdjęcie' : 'wideo'}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredFiles.map((file, index) => (
            <div key={index} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 sm:p-4">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <div className="text-xs font-medium text-black">
                    {formatDate(file.createdAt)}
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
                      onClick={(e) => openImageModal(file, e)}
                    >
                      <img
                        src={file.url}
                        alt={file.fileName || 'Zdjęcie'}
                        className="object-cover w-full h-full"
                        loading="lazy"
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
                      <div className="absolute inset-0 bg-black opacity-0 hover:opacity-20 transition-opacity">
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
                    disabled={downloadingFileUrl === file.url}
                    className="flex items-center text-primary hover:text-primary/80 text-xs sm:text-sm"
                  >
                    {downloadingFileUrl === file.url ? (
                      <>
                        <span className="mr-1.5 w-3 h-3 rounded-full bg-primary animate-pulse"></span>
                        Pobieranie...
                      </>
                    ) : (
                      <>
                        <FiDownload className="mr-1" /> Pobierz
                      </>
                    )}
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