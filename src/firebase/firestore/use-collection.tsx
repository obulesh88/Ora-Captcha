
'use client';

import {
  onSnapshot,
  type Query,
  type QuerySnapshot,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

const getQueryPath = (q: Query | null) => {
    try {
        return q ? (q as any)._query.path.segments.join('/') : null;
    } catch (e) {
        return null;
    }
}

export const useCollection = <T,>(q: Query | null) => {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const queryPath = useMemo(() => getQueryPath(q), [q]);

  useEffect(() => {
    if (!q) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        const data: T[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as T)
        );
        setData(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          // The path property does not exist on a query. We assume this hook is for collections.
          // In a real app, you might want a more robust way to get the path.
          path: (q as any)._query?.path?.segments.join('/') ?? 'unknown path',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPath]);

  return { data, error, loading };
};
