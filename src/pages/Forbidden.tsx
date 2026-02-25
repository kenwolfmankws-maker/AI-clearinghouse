import { Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 rounded-full"></div>
            <ShieldAlert className="w-24 h-24 text-red-600 relative" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Access Forbidden</h2>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. This area is restricted to administrators only.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default" size="lg">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" onClick={() => window.history.back()}>
            <a>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
