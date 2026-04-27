'use client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  _count: { posts: number };
}

interface Props {
  categories: Category[];
  active: string;
  onChange: (slug: string) => void;
}

export function CategoryFilter({ categories, active, onChange }: Props) {
  if (!categories.length) return null;

  return (
    <div className="sticky top-16 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => onChange('')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
            !active
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onChange(active === cat.slug ? '' : cat.slug)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              active === cat.slug
                ? 'text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
            style={active === cat.slug ? { background: cat.color || '#6366f1' } : {}}
          >
            {cat.name}
            <span className="ml-1.5 text-xs opacity-60">({cat._count.posts})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
