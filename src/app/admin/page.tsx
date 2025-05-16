'use client';

import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <div className="container-custom py-12">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:underline flex items-center">
            ← Powrót do strony głównej
          </Link>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-black mb-6">Panel administratora</h1>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black mb-4">Konfiguracja Amazon S3</h2>
              
              <div className="space-y-4 text-black">
                <p>
                  <span className="bg-yellow-100 px-2 py-1 rounded">Ważne:</span> Do hostowania dużych plików wideo zalecamy wykorzystanie AWS S3, który nie ma limitów wielkości pojedynczego pliku.
                </p>
                
                <ol className="list-decimal pl-5 space-y-3">
                  <li>
                    <strong>Utwórz konto AWS:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Przejdź do <a href="https://aws.amazon.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">AWS</a> i utwórz konto</li>
                    </ul>
                  </li>
                  
                  <li>
                    <strong>Utwórz bucket S3:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Przejdź do serwisu S3 w konsoli AWS</li>
                      <li>Kliknij "Create bucket" i nadaj mu nazwę</li>
                      <li>Skonfiguruj CORS dla dostępu z przeglądarki</li>
                    </ul>
                  </li>
                  
                  <li>
                    <strong>Utwórz użytkownika IAM:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Przejdź do serwisu IAM w konsoli AWS</li>
                      <li>Utwórz nowego użytkownika z dostępem API</li>
                      <li>Nadaj mu uprawnienia do dostępu do S3</li>
                      <li>Zapisz klucz dostępu i tajny klucz</li>
                    </ul>
                  </li>
                  
                  <li>
                    <strong>Zaktualizuj zmienne środowiskowe:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Utwórz plik <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code> w głównym katalogu projektu</li>
                      <li>Dodaj następujące zmienne:</li>
                      <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto text-sm">
                        {`AWS_ACCESS_KEY_ID=twój_klucz_dostępu
AWS_SECRET_ACCESS_KEY=twój_tajny_klucz
AWS_REGION=region_bucketa
AWS_S3_BUCKET_NAME=nazwa_twojego_bucketa`}
                      </pre>
                    </ul>
                  </li>
                </ol>
                
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="font-semibold text-blue-800">Zalety Amazon S3:</p>
                  <ul className="list-disc pl-5 mt-1 text-blue-800">
                    <li>Brak limitu wielkości pojedynczego pliku (do 5TB)</li>
                    <li>Płatność tylko za to, co używasz</li>
                    <li>Wysoka niezawodność i skalowalność</li>
                    <li>Darmowy tier na 12 miesięcy: 5GB przestrzeni</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 