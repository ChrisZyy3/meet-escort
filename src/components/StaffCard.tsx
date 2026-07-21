import { BadgeCheck, Clock3, Heart, MapPin, Star } from 'lucide-react';
import type { Staff } from '../types';
import { resolveMediaUrl } from '../services/api';

interface StaffCardProps {
  staff: Staff;
  onClick: () => void;
  baseUrl?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function StaffCard({ staff, onClick, baseUrl = '', isFavorite = false, onToggleFavorite }: StaffCardProps) {
  const photo = resolveMediaUrl(staff.photoUrl || staff.photoUrls?.[0], baseUrl);

  return (
    <div className="relative">
      <button type="button" onClick={onClick} className="staff-card w-full">
      <span className="staff-card__media">
        {photo ? <img src={photo} alt={`${staff.name} profile`} loading="lazy" /> : <span className="staff-card__fallback">{staff.name.charAt(0)}</span>}
        <span className={`staff-card__status ${staff.isActive ? 'is-online' : ''}`}>
          <span /> {staff.isActive ? 'Online' : 'Replies today'}
        </span>
        {staff.verified ? <BadgeCheck className="staff-card__verified" aria-label="Verified profile" /> : null}
      </span>

      <span className="staff-card__body">
        <span className="staff-card__title-row">
          <strong>{staff.name}{staff.age ? `, ${staff.age}` : ''}</strong>
          <span className="staff-card__rating"><Star aria-hidden="true" /> {staff.rating ? staff.rating.toFixed(1) : 'New'}</span>
        </span>
        <span className="staff-card__meta">
          <span><MapPin aria-hidden="true" /> {staff.location ?? staff.city ?? 'Your area'}</span>
          <span><Clock3 aria-hidden="true" /> ~{staff.responseMinutes ?? 5} min</span>
        </span>
        <span className="staff-card__description">{staff.description || `Available in ${staff.city || 'your area'}.`}</span>
        <span className="staff-card__footer">
          <span>{staff.reviewCount ?? 0} verified reviews</span>
          <strong>{staff.price.toFixed(0)} USDT <small>/ hour</small></strong>
        </span>
      </span>
      </button>
      {onToggleFavorite && (
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={isFavorite ? `Remove ${staff.name} from favorites` : `Add ${staff.name} to favorites`}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition ${isFavorite ? 'bg-primary text-white' : 'bg-white/90 text-neutral-dark hover:bg-white'}`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      )}
    </div>
  );
}
