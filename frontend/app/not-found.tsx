import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
      <div className="text-center">
        <p className="font-heading text-[120px] text-brand-orange/20 leading-none mb-0">404</p>
        <h2 className="font-heading text-4xl text-brand-white tracking-widest -mt-4 mb-3">PAGE NOT FOUND</h2>
        <p className="text-brand-dim text-sm mb-8">This page doesn't exist or was moved.</p>
        <Link
          href="/order"
          className="inline-block bg-brand-orange text-white px-6 py-3 rounded-xl font-heading tracking-widest text-sm hover:bg-brand-orange/90 transition-colors"
        >
          BACK TO ORDERING
        </Link>
      </div>
    </div>
  );
}
