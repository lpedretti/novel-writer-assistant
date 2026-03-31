import Link from 'next/link';

interface BookCardProps {
  book: {
    id: number;
    title: string;
    description: string | null;
    gender: string | null;
    topic: string | null;
    user: {
      name: string | null;
    } | null;
  };
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link
      href={`/dashboard/books/${book.id}`}
      className="group card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 border border-base-300 hover:border-primary/50 overflow-hidden"
    >
      <div className="h-48 bg-gradient-to-br from-[#2563eb33] via-[#60a5fa]/20 to-[#93c5fd33] relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white/50 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </div>
      <div className="card-body">
        <h3 className="card-title group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        <p className="text-sm opacity-60">by {book.user?.name ?? 'Unknown'}</p>
        {book.description && (
          <p className="text-sm opacity-70 line-clamp-2">{book.description}</p>
        )}
        <div className="card-actions justify-end mt-4">
          <div className="badge badge-outline badge-primary">{book.gender || 'General'}</div>
          {book.topic && <div className="badge badge-outline badge-secondary">{book.topic}</div>}
        </div>
      </div>
    </Link>
  );
}
