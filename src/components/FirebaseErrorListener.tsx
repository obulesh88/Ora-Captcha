
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useAuth } from '@/firebase';
import type { FirestorePermissionError } from '@/firebase/errors';

export default function FirebaseErrorListener() {
  const auth = useAuth();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In development, we log a detailed warning to the console.
      // In production, you might want to send this to a logging service.
      if (process.env.NODE_ENV === 'development') {
        console.warn('Firestore Permission Denied:', {
          message: error.message,
          user: auth.currentUser?.uid || 'not authenticated',
          context: error.context,
          timestamp: new Date().toISOString(),
        });
      }
      
      // We don't re-throw the error, which prevents the app from "crashing"
      // and showing the Next.js error overlay.
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [auth]);

  return null;
}
