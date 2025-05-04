'use client';

import { useState } from 'react';
import { FiLock, FiAlertCircle } from 'react-icons/fi';

interface AuthFormProps {
  onAuthenticated: () => void;
}

export default function AuthForm({ onAuthenticated }: AuthFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // In a real app, you would verify this with a backend service
  // This is just for demonstration
  const correctPassword = 'birthday2025'; 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simulate authentication delay
    setTimeout(() => {
      if (password === correctPassword) {
        onAuthenticated();
      } else {
        setError('Incorrect password. Please try again.');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiLock className="text-3xl text-gray-600" />
        </div>
        <p className="text-black">
          This area is password protected. Please enter the password to view the gallery.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
            <FiAlertCircle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <div>
          <label htmlFor="password" className="block text-black font-medium mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter password"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 btn ${
            isLoading ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'
          }`}
        >
          {isLoading ? 'Verifying...' : 'Access Gallery'}
        </button>
      </form>
    </div>
  );
} 