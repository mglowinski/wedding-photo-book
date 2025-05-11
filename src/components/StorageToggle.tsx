'use client';

import { useState, useEffect } from 'react';
import { FiDatabase, FiCloud, FiRefreshCw } from 'react-icons/fi';

export default function StorageToggle() {
  const [storageType, setStorageType] = useState<'local' | 's3'>('local');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch current storage type
  const fetchStorageType = async () => {
    try {
      const response = await fetch('/api/storage-config');
      if (response.ok) {
        const data = await response.json();
        setStorageType(data.storageType);
      }
    } catch (error) {
      console.error('Error fetching storage config:', error);
    }
  };

  // Load current storage type on component mount
  useEffect(() => {
    fetchStorageType();
  }, []);

  // Toggle storage type
  const toggleStorage = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const response = await fetch('/api/toggle-storage', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStorageType(data.currentType);
        setMessage(data.message);
      } else {
        setMessage('Nie udało się zmienić typu magazynu.');
      }
    } catch (error) {
      console.error('Error toggling storage:', error);
      setMessage('Wystąpił błąd podczas zmiany typu magazynu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Konfiguracja magazynu</h3>
      
      <div className="flex items-center mb-4">
        <div className="flex-1">
          <div className="flex items-center">
            {storageType === 'local' ? (
              <FiDatabase className="text-blue-500 mr-2 text-xl" />
            ) : (
              <FiCloud className="text-blue-500 mr-2 text-xl" />
            )}
            <span className="font-medium">
              Aktualny magazyn: {storageType === 'local' ? 'Lokalny' : 'AWS S3'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {storageType === 'local' 
              ? 'Pliki są przechowywane lokalnie na serwerze.'
              : 'Pliki są przechowywane w chmurze AWS S3.'}
          </p>
        </div>
        
        <button
          onClick={toggleStorage}
          disabled={loading}
          className={`px-4 py-2 rounded-md flex items-center ${
            loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? (
            <>
              <FiRefreshCw className="animate-spin mr-2" /> Zmieniam...
            </>
          ) : (
            <>
              Przełącz na {storageType === 'local' ? 'AWS S3' : 'Lokalny'}
            </>
          )}
        </button>
      </div>
      
      {message && (
        <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded-md">
          {message}
        </div>
      )}
    </div>
  );
} 