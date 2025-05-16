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
        setError('Nieprawidłowe hasło. Spróbuj ponownie.');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-4 sm:mb-6">
        <div className="bg-gray-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <FiLock className="text-2xl sm:text-3xl text-gray-600" />
        </div>
        <p className="text-black text-sm sm:text-base mb-4 sm:mb-6">
          Ta galeria jest chroniona hasłem. Podaj hasło, aby zobaczyć wspomnienia.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2 sm:p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
            <FiAlertCircle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
            <p className="text-sm sm:text-base">{error}</p>
          </div>
        )}
        
        <div>
          <label htmlFor="password" className="block text-black font-medium mb-2 text-sm sm:text-base">
            Hasło
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black text-sm sm:text-base"
            placeholder="Wprowadź hasło"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 sm:py-3 btn text-sm sm:text-base ${
            isLoading ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'
          }`}
        >
          {isLoading ? 'Weryfikacja...' : 'Wejdź do galerii'}
        </button>
      </form>
    </div>
  );
} 