import { BadgeCheck, Clock3, MapPin, Star } from 'lucide-react';
import type { Staff } from '../types';

interface StaffCardProps {
  staff: Staff;
  onClick: () => void;
  baseUrl?: string;
}

export function StaffCard({ staff, onClick, baseUrl = '' }: StaffCardProps) {
  const photo = staff.photoUrl.startsWith('http') || staff.photoUrl.startsWith('/home_files')
    ? staff.photoUrl
    : `${baseUrl}${staff.photoUrl}`;

  return (
    <button type="button" onClick={onClick} className="staff-card">
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
          <span className="staff-card__rating"><Star aria-hidden="true" /> {staff.rating?.toFixed(1) ?? 'New'}</span>
        </span>
        <span className="staff-card__meta">
          <span><MapPin aria-hidden="true" /> {staff.location ?? 'Your area'}</span>
          <span><Clock3 aria-hidden="true" /> ~{staff.responseMinutes ?? 5} min</span>
        </span>
        <span className="staff-card__description">{staff.description}</span>
        <span className="staff-card__footer">
          <span>{staff.reviewCount ?? 0} verified reviews</span>
          <strong>{staff.price.toFixed(0)} USDT <small>/ hour</small></strong>
        </span>
      </span>
    </button>
  );
}
