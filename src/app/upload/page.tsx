import UploadForm from '@/components/UploadForm';
import Link from 'next/link';

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <div className="container-custom py-12">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:underline flex items-center">
            ← Back to Home
          </Link>
        </div>
        
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-3xl font-bold text-black text-center mb-6">Share Your Memories</h2>
            <UploadForm />
          </div>
        </div>
      </div>
    </div>
  );
} 