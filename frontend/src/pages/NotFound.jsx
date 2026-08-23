import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="h-24 w-24 bg-error-100 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="h-12 w-12 text-error-600" />
      </div>
      <h1 className="text-5xl font-extrabold text-secondary-900 tracking-tight mb-2">404</h1>
      <h2 className="text-2xl font-semibold text-secondary-700 mb-4">Page not found</h2>
      <p className="text-secondary-500 max-w-md mb-8">
        The page you are looking for doesn't exist, has been moved, or you don't have permission to view it.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Go Back
        </Button>
        <Link to="/">
          <Button variant="primary" leftIcon={<Home className="h-4 w-4" />}>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
