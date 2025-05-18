import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="container-custom py-12 md:py-20">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            30-te urodziny
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6">
            Asia & Maciek
          </h2>
          <p className="text-xl md:text-2xl font-medium text-white">
            24 maja 2025
          </p>
        </header>

        <div className="max-w-3xl mx-auto bg-white/60 rounded-2xl shadow-xl overflow-hidden mb-12 backdrop-blur-sm">
          <div className="p-8 text-center">
            <h3 className="text-2xl font-semibold text-black mb-4">Podziel się wspomnieniami</h3>
            <p className="text-lg text-black mb-6">
              Uwiecznij i udostępnij swoje ulubione chwile z naszego świętowania!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/upload" 
                className="btn bg-primary text-white text-center text-lg py-3 px-4 rounded-md font-medium transition-colors hover:bg-primary/90">
                Dodaj media
              </Link>
              <Link href="/gallery" 
                className="btn bg-primary text-white text-center text-lg py-3 px-4 rounded-md font-medium transition-colors hover:bg-primary/90">
                Zobacz galerię
              </Link>
            </div>
          </div>
        </div>
        
        <div className="text-center text-white text-sm">
          <p>© 2025 Asia & Maciek | Wszelkie prawa zastrzeżone</p>
        </div>
      </div>
    </div>
  );
} 