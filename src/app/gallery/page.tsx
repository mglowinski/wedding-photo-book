'use client';

import { useState } from 'react';
import Link from 'next/link';
import GalleryView from '@/components/GalleryView';
import AuthForm from '@/components/AuthForm';

export default function GalleryPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <div className="container-custom py-12">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:underline flex items-center">
            ← Back to Home
          </Link>
        </div>
        
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-3xl font-bold text-center mb-6">Memory Gallery</h2>
            
            {!isAuthenticated ? (
              <AuthForm onAuthenticated={() => setIsAuthenticated(true)} />
            ) : (
              <GalleryView />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 