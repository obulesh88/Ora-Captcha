
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

export default function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: any) => {
      // In a real app, you might want to log this to a service like Sentry
      // For now, we'll just throw it to make it visible in the Next.js overlay
      console.error(
        'Firestore Permission Error:',
        error.message,
        'Context:',
        error.context
      );
      // Throwing the error will make it visible in the Next.js error overlay
      // during development, which is very helpful for debugging security rules.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  return null;
}
