import { BadgeCheck, Clock3, Heart, MapPin, Star } from 'lucide-react';
import type { Staff } from '../types';
import { resolveMediaUrl } from '../services/api';
import { useTranslation } from '../i18n';

interface StaffCardProps {
  staff: Staff;
  onClick: () => void;
  baseUrl?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function StaffCard({ staff, onClick, baseUrl = '', isFavorite = false, onToggleFavorite }: StaffCardProps) {
  const { t } = useTranslation();
  const photo = resolveMediaUrl(staff.photoUrl || staff.photoUrls?.[0], baseUrl);

  return (
    <div className="relative">
      <button type="button" onClick={onClick} className="staff-card w-full">
      <span className="staff-card__media">
        {photo ? <img src={photo} alt={`${staff.name} profile`} loading="lazy" /> : <span className="staff-card__fallback">{staff.name.charAt(0)}</span>}
        <span className={`staff-card__status ${staff.isActive ? 'is-online' : ''}`}>
          <span /> {staff.isActive ? t('common.online') : t('common.offline')}
        </span>
        {staff.verified ? <BadgeCheck className="staff-card__verified" aria-label={t('card.verified')} /> : null}
      </span>

      <span className="staff-card__body">
        <span className="staff-card__title-row">
          <strong>{staff.name}{staff.age ? `, ${staff.age}` : ''}</strong>
          <span className="staff-card__rating"><Star aria-hidden="true" /> {staff.rating ? staff.rating.toFixed(1) : t('card.new')}</span>
        </span>
        <span className="staff-card__meta">
          <span><MapPin aria-hidden="true" /> {staff.location ?? staff.city ?? t('card.locationMissing')}</span>
          {staff.responseMinutes != null ? <span><Clock3 aria-hidden="true" /> ~{staff.responseMinutes} min</span> : null}
        </span>
        <span className="staff-card__description">{staff.description || t('card.noDescription')}</span>
        <span className="staff-card__footer">
          <span>{staff.reviewCount != null ? t('card.reviews', { count: staff.reviewCount }) : t('card.reviewsUnavailable')}</span>
          <strong>{staff.price > 0 ? `${staff.price.toFixed(0)} USDT` : t('card.priceUnavailable')} {staff.price > 0 ? <small>{t('card.perHour')}</small> : null}</strong>
        </span>
      </span>
      </button>
      {onToggleFavorite && (
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={isFavorite ? t('card.removeFavorite', { name: staff.name }) : t('card.addFavorite', { name: staff.name })}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition ${isFavorite ? 'bg-primary text-white' : 'bg-white/90 text-neutral-dark hover:bg-white'}`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      )}
    </div>
  );
}
