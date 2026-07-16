import { useMemo, useState } from 'react';
import { SlidersHorizontal, Users } from 'lucide-react';
import type { SearchCriteria, Staff } from '../types';
import { StaffCard } from './StaffCard';

interface StaffGridProps {
  staffList: Staff[];
  onStaffClick: (staff: Staff) => void;
  isLoading?: boolean;
  baseUrl?: string;
  criteria?: SearchCriteria;
  resultsMode?: boolean;
}

export function StaffGrid({
  staffList,
  onStaffClick,
  isLoading = false,
  baseUrl = '',
  criteria,
  resultsMode = false,
}: StaffGridProps) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');

  const visibleStaff = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchingCityExists = criteria
      ? staffList.some((staff) => staff.location === criteria.city)
      : false;

    const result = staffList.filter((staff) => {
      if (criteria?.availableNow && !staff.isActive) return false;
      if (criteria && matchingCityExists && staff.location !== criteria.city) return false;
      if (!normalizedQuery) return true;
      return [staff.name, staff.description, staff.location, ...(staff.languages ?? [])]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
    });

    return result.toSorted((left, right) => {
      if (sortBy === 'price-low') return left.price - right.price;
      if (sortBy === 'price-high') return right.price - left.price;
      if (sortBy === 'rating') return (right.rating ?? 0) - (left.rating ?? 0);
      return Number(right.isActive) - Number(left.isActive)
        || (right.rating ?? 0) - (left.rating ?? 0);
    });
  }, [criteria, query, sortBy, staffList]);

  return (
    <section id="directory" className={`directory-section ${resultsMode ? 'directory-section--results' : ''}`}>
      <div className="site-container">
        <div className="directory-section__heading">
          <div>
            <p className="section-kicker"><Users aria-hidden="true" /> Live directory</p>
            <h2>{resultsMode ? `Available in ${criteria?.city ?? 'your area'}` : 'Companions currently online'}</h2>
            <p>{resultsMode ? `${visibleStaff.length} profiles match your request` : 'Verified profiles with recent activity and quick response times.'}</p>
          </div>
          <div className="directory-controls">
            <label>
              <span className="sr-only">Search profiles</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, language, location"
              />
            </label>
            <label className="sort-control">
              <SlidersHorizontal aria-hidden="true" />
              <span className="sr-only">Sort results</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="recommended">Recommended</option>
                <option value="rating">Top rated</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="staff-grid" aria-label="Loading profiles">
            {Array.from({ length: 8 }, (_, index) => <div key={index} className="staff-card-skeleton" />)}
          </div>
        ) : visibleStaff.length ? (
          <div className="staff-grid">
            {visibleStaff.map((staff) => (
              <StaffCard key={staff.id} staff={staff} onClick={() => onStaffClick(staff)} baseUrl={baseUrl} />
            ))}
          </div>
        ) : (
          <div className="directory-empty">
            <Users aria-hidden="true" />
            <h3>No exact matches yet</h3>
            <p>Try another city, a broader keyword, or turn off “Online now”.</p>
          </div>
        )}
      </div>
    </section>
  );
}
