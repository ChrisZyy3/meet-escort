import { Heart, X } from 'lucide-react';
import type { FC } from 'react';
import type { Staff } from '../types';
import { StaffCard } from './StaffCard';

interface FavoritesPanelProps {
  staffList: Staff[];
  favoriteIds: Set<number>;
  baseUrl?: string;
  onClose: () => void;
  onStaffClick: (staff: Staff) => void;
  onToggleFavorite: (id: number) => void;
}

export const FavoritesPanel: FC<FavoritesPanelProps> = ({ staffList, favoriteIds, baseUrl = '', onClose, onStaffClick, onToggleFavorite }) => {
  const favorites = staffList.filter((staff) => favoriteIds.has(staff.id));

  return (
    <div className="fixed inset-0 z-[105] overflow-y-auto bg-neutral-bgLight">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <div><p className="text-lg font-extrabold text-neutral-dark">Favorites</p><p className="text-xs text-neutral-light">{favorites.length} saved profile{favorites.length === 1 ? '' : 's'}</p></div>
          <button onClick={onClose} aria-label="Close favorites" className="rounded-full p-2 text-neutral-light hover:bg-neutral-bgLight hover:text-neutral-dark"><X className="h-5 w-5" /></button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        {favorites.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 md:gap-6">{favorites.map((staff) => <StaffCard key={staff.id} staff={staff} baseUrl={baseUrl} onClick={() => onStaffClick(staff)} isFavorite onToggleFavorite={() => onToggleFavorite(staff.id)} />)}</div> : <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm"><Heart className="mx-auto h-9 w-9 text-primary" /><h1 className="mt-4 text-xl font-extrabold text-neutral-dark">No saved profiles yet</h1><p className="mt-2 text-sm text-neutral-light">Tap the heart on any profile to keep it here.</p></div>}
      </main>
    </div>
  );
};
