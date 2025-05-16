'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthForm from '@/components/AuthForm';
import LocalGalleryView from '@/components/LocalGalleryView';

export default function GalleryPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <div className="container-custom py-6 sm:py-12">
        <div className="mb-4 sm:mb-6">
          <Link href="/" className="text-primary hover:underline flex items-center">
            ← Powrót do strony głównej
          </Link>
        </div>
        
        <div className="max-w-4xl mx-auto bg-white rounded-lg sm:rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-black text-center mb-4 sm:mb-6">Galeria wspomnień</h2>
            
            {!isAuthenticated ? (
              <AuthForm onAuthenticated={handleAuthenticated} />
            ) : (
              <LocalGalleryView />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 