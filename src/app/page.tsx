import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <div className="container-custom py-12 md:py-20">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4">
            30th Birthday Celebration
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-secondary mb-6">
            Joanna & Maciej
          </h2>
          <p className="text-xl md:text-2xl font-medium text-black">
            May 24th, 2025
          </p>
        </header>

        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
          <div className="p-8 text-center">
            <h3 className="text-2xl font-semibold text-black mb-4">Share Your Memories</h3>
            <p className="text-lg text-black mb-6">
              Capture and share your favorite moments from our celebration!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/upload" 
                className="btn btn-primary text-center text-lg py-3">
                Upload Media
              </Link>
              <Link href="/gallery" 
                className="btn bg-gray-200 hover:bg-gray-300 text-black text-center text-lg py-3">
                View Gallery
              </Link>
            </div>
          </div>
        </div>
        
        <div className="text-center text-black text-sm">
          <p>© 2025 Joanna & Maciej | All rights reserved</p>
        </div>
      </div>
    </div>
  );
} 