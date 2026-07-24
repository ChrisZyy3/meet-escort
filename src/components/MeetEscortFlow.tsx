import { useEffect, useMemo, useState } from 'react';
import type { FC, ReactNode } from 'react';
import { ArrowLeft, CalendarDays, Check, ChevronRight, Clock3, Heart, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Staff } from '../types';
import { fetchCities } from '../services/api';
import { StaffCard } from './StaffCard';

type Step = 'continent' | 'city' | 'time' | 'duration' | 'results';
type ResultTab = 'online' | 'favorites';

interface MeetEscortFlowProps {
  staffList: Staff[];
  baseUrl?: string;
  onClose: () => void;
  onStaffClick: (staff: Staff) => void;
  favoriteIds: Set<number>;
  onToggleFavorite: (id: number) => void;
}

interface DestinationGroup {
  continent: string;
  cities: string[];
}

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
};

export const MeetEscortFlow: FC<MeetEscortFlowProps> = ({
  staffList,
  baseUrl = '',
  onClose,
  onStaffClick,
  favoriteIds,
  onToggleFavorite,
}) => {
  const [step, setStep] = useState<Step>('continent');
  const [continent, setContinent] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState(() => formatDateForInput(new Date()));
  const [time, setTime] = useState('20:00');
  const [duration, setDuration] = useState('2 hours');
  const [resultTab, setResultTab] = useState<ResultTab>('online');
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high'>('default');
  const [destinations, setDestinations] = useState<DestinationGroup[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCities()
      .then((cities) => {
        const grouped = new Map<string, Set<string>>();
        cities.forEach(({ continent: regionName, country, city: cityName }) => {
          const region = regionName.trim() || country.trim() || 'Other';
          const cityValue = cityName.trim();
          if (!cityValue) return;
          if (!grouped.has(region)) grouped.set(region, new Set());
          grouped.get(region)?.add(cityValue);
        });
        const groups = Array.from(grouped, ([region, citySet]) => ({
          continent: region,
          cities: Array.from(citySet).sort(),
        }));
        if (active) {
          setDestinations(groups);
          setCitiesError(null);
          setCitiesLoading(false);
        }
      })
      .catch((error) => {
        if (!active) return;
        setDestinations([]);
        setCitiesError(error instanceof Error ? error.message : 'Unable to load cities right now.');
        setCitiesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedCities = destinations.find((item) => item.continent === continent)?.cities ?? [];
  const steps: Step[] = ['continent', 'city', 'time', 'duration', 'results'];
  const currentStepIndex = ['continent', 'city', 'time', 'duration'].indexOf(step);
  const minDate = formatDateForInput(new Date());

  const results = useMemo(
    () => staffList.filter((staff) => staff.city?.trim() === city),
    [city, staffList],
  );

  const visibleResults = useMemo(() => {
    const filtered = results.filter((staff) => resultTab === 'favorites'
      ? favoriteIds.has(staff.id)
      : staff.isActive);
    if (sortBy === 'price-low') return [...filtered].sort((left, right) => left.price - right.price);
    if (sortBy === 'price-high') return [...filtered].sort((left, right) => right.price - left.price);
    return filtered;
  }, [favoriteIds, resultTab, results, sortBy]);

  const selectContinent = (value: string) => {
    setContinent(value);
    setCity('');
    setStep('city');
  };

  const selectCity = (value: string) => {
    setCity(value);
    setStep('time');
  };

  const goBack = () => {
    const index = steps.indexOf(step);
    if (index <= 0) {
      onClose();
      return;
    }
    setStep(steps[index - 1]);
  };

  const startAgain = () => {
    setContinent('');
    setCity('');
    setResultTab('online');
    setStep('continent');
  };

  const labels = ['Region', 'City', 'Time', 'Duration'];

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-neutral-bgLight">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <button type="button" onClick={goBack} className="inline-flex items-center gap-2 text-sm font-bold text-neutral-medium hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> {step === 'continent' ? 'Close' : 'Back'}
          </button>
          <div className="text-center">
            <p className="text-lg font-extrabold text-neutral-dark">Meet an escort</p>
            <p className="text-xs text-neutral-light">Find availability in your city</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close search" className="rounded-full p-2 text-neutral-light hover:bg-neutral-bgLight hover:text-neutral-dark">
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {step !== 'results' && (
        <div className="mx-auto max-w-3xl px-4 pt-7 md:px-8">
          <div className="flex items-center justify-between gap-1">
            {labels.map((label, index) => (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index <= currentStepIndex ? 'bg-primary text-white' : 'bg-gray-200 text-neutral-light'}`}>
                    {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className={`hidden text-xs font-semibold sm:inline ${index <= currentStepIndex ? 'text-neutral-dark' : 'text-neutral-light'}`}>{label}</span>
                </div>
                {index < labels.length - 1 && <span className="mx-2 h-px flex-1 bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        {step === 'continent' && (
          <StepPanel icon={<MapPin />} eyebrow="Step 1 of 4" title="Where would you like to meet?" description="Choose a region from the live city directory.">
            <div className="grid gap-3 sm:grid-cols-2">
              {citiesLoading ? <p className="rounded-2xl bg-neutral-bgLight px-4 py-8 text-center text-sm text-neutral-light">Loading cities...</p> : null}
              {citiesError ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-8 text-center text-sm text-red-600" role="alert">{citiesError}</p> : null}
              {!citiesLoading && !citiesError && !destinations.length ? <p className="rounded-2xl bg-neutral-bgLight px-4 py-8 text-center text-sm text-neutral-light">No cities are currently available.</p> : null}
              {destinations.map((item) => <OptionButton key={item.continent} title={item.continent} subtitle={`${item.cities.length} cities`} onClick={() => selectContinent(item.continent)} />)}
            </div>
          </StepPanel>
        )}

        {step === 'city' && (
          <StepPanel icon={<MapPin />} eyebrow="Step 2 of 4" title={`Choose a city in ${continent}`} description="You can change your region with the Back button.">
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedCities.map((item) => <OptionButton key={item} title={item} subtitle="View available profiles" onClick={() => selectCity(item)} />)}
            </div>
          </StepPanel>
        )}

        {step === 'time' && (
          <StepPanel icon={<CalendarDays />} eyebrow="Step 3 of 4" title="When would you like to meet?" description="Choose a date and preferred time for your request.">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-neutral-dark">Date
                <span className="relative mt-2 block">
                  <span className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-neutral-medium">{formatDateForDisplay(date)}</span>
                  <input type="date" min={minDate} value={date} onChange={(event) => setDate(event.target.value)} aria-label="Date" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                </span>
              </label>
              <label className="text-sm font-bold text-neutral-dark">Preferred time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-neutral-medium outline-none focus:border-primary" /></label>
            </div>
            <button type="button" onClick={() => setStep('duration')} className="mt-7 w-full rounded-full bg-primary px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-primary-hover">Continue</button>
          </StepPanel>
        )}

        {step === 'duration' && (
          <StepPanel icon={<Clock3 />} eyebrow="Step 4 of 4" title="How long would you like to meet?" description="This preference is included in your booking request.">
            <div className="grid gap-3 sm:grid-cols-2">
              {['1 hour', '2 hours', '3 hours', 'Overnight'].map((item) => <OptionButton key={item} title={item} selected={duration === item} onClick={() => setDuration(item)} />)}
            </div>
            <button type="button" onClick={() => setStep('results')} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-primary-hover"><Search className="h-4 w-4" /> Search profiles</button>
          </StepPanel>
        )}

        {step === 'results' && (
          <section>
            <div className="mb-8 flex flex-col justify-between gap-5 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Search results</p>
                <h1 className="mt-1 text-3xl font-extrabold text-neutral-dark">Available in {city}</h1>
                <p className="mt-2 text-sm text-neutral-light">{visibleResults.length} profile{visibleResults.length === 1 ? '' : 's'} matching your current view.</p>
              </div>
              <button type="button" onClick={startAgain} className="rounded-full border border-primary px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white">Edit search</button>
            </div>
            <div className="mb-7 flex flex-wrap items-center gap-2 text-sm font-semibold text-neutral-medium">
              {[city, `${date} / ${time}`, duration].map((item) => <span key={item} className="rounded-full bg-white px-4 py-2 shadow-sm">{item}</span>)}
            </div>
            <div className="mb-6 flex flex-col justify-between gap-4 border-b border-gray-200 pb-3 sm:flex-row sm:items-center">
              <div className="flex gap-5 text-sm font-bold">
                {(['online', 'favorites'] as const).map((tab) => {
                  const label = tab === 'online' ? 'Online' : 'Favorites';
                  const Icon = tab === 'favorites' ? Heart : null;
                  return <button type="button" key={tab} onClick={() => setResultTab(tab)} className={`flex items-center gap-1 border-b-2 pb-3 transition ${resultTab === tab ? 'border-primary text-primary' : 'border-transparent text-neutral-light hover:text-neutral-dark'}`}>{Icon && <Icon className="h-4 w-4" />} {label}</button>;
                })}
              </div>
              <label className="flex items-center gap-2 text-sm font-bold text-neutral-medium"><SlidersHorizontal className="h-4 w-4 text-primary" /> Sort<select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-primary"><option value="default">Default</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
            </div>
            {visibleResults.length ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 md:gap-6">
                {visibleResults.map((staff) => <StaffCard key={staff.id} staff={staff} baseUrl={baseUrl} onClick={() => onStaffClick(staff)} isFavorite={favoriteIds.has(staff.id)} onToggleFavorite={() => onToggleFavorite(staff.id)} />)}
              </div>
            ) : (
              <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm">
                <h2 className="text-xl font-bold text-neutral-dark">No profiles match this city</h2>
                <p className="mt-2 text-sm text-neutral-light">Try another city or choose a different date.</p>
                <button type="button" onClick={startAgain} className="mt-6 rounded-full bg-primary px-5 py-3 font-bold text-white hover:bg-primary-hover">Start a new search</button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

const StepPanel: FC<{ icon: ReactNode; eyebrow: string; title: string; description: string; children: ReactNode }> = ({ icon, eyebrow, title, description, children }) => (
  <section className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm md:p-10">
    <div className="mb-7 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</span>
      <p className="text-xs font-bold uppercase tracking-widest text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-dark">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-neutral-light">{description}</p>
    </div>
    {children}
  </section>
);

const OptionButton: FC<{ title: string; subtitle?: string; selected?: boolean; onClick: () => void }> = ({ title, subtitle, selected = false, onClick }) => (
  <button type="button" onClick={onClick} className={`group flex items-center justify-between rounded-2xl border p-4 text-left transition ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-sm'}`}>
    <span><span className="block font-bold text-neutral-dark">{title}</span>{subtitle && <span className="mt-1 block text-xs text-neutral-light">{subtitle}</span>}</span>
    <ChevronRight className={`h-5 w-5 transition ${selected ? 'text-primary' : 'text-neutral-light group-hover:text-primary'}`} />
  </button>
);
