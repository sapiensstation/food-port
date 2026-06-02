'use client';
import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
      <div className="glass rounded-2xl p-8 max-w-sm w-full text-center">
        <p className="text-6xl mb-4">⚠</p>
        <h2 className="font-heading text-3xl text-brand-white tracking-widest mb-2">SOMETHING WENT WRONG</h2>
        <p className="text-brand-dim text-sm mb-6">An unexpected error occurred. Please try again.</p>
        {error.digest && (
          <p className="font-mono text-xs text-brand-dim/50 mb-4">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3">
          <Button onClick={reset} className="flex-1">Try Again</Button>
          <Button variant="secondary" onClick={() => window.location.href = '/'} className="flex-1">Go Home</Button>
        </div>
      </div>
    </div>
  );
}
