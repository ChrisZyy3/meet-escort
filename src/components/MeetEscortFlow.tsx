import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { ArrowLeft, CalendarDays, Check, ChevronRight, Clock3, MapPin, Search, UserRound, X } from 'lucide-react';
import type { Staff } from '../types';
import { mockStaffSearchMeta } from '../mockData';
import { StaffCard } from './StaffCard';

type Step = 'continent' | 'city' | 'gender' | 'time' | 'duration' | 'results';
type Gender = 'Female' | 'Male';
type ServiceMode = 'On-call' | 'In-call';

interface MeetEscortFlowProps {
  staffList: Staff[];
  baseUrl?: string;
  onClose: () => void;
  onStaffClick: (staff: Staff) => void;
}

const destinations = [
  { continent: 'Asia', cities: ['Bangkok', 'Tokyo', 'Manila', 'Singapore'] },
  { continent: 'Europe', cities: ['London', 'Paris', 'Barcelona', 'Berlin'] },
  { continent: 'North America', cities: ['New York', 'Los Angeles', 'Miami', 'Toronto'] },
  { continent: 'Middle East', cities: ['Dubai', 'Doha', 'Abu Dhabi', 'Istanbul'] }
];

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const MeetEscortFlow: FC<MeetEscortFlowProps> = ({ staffList, baseUrl = '', onClose, onStaffClick }) => {
  const [step, setStep] = useState<Step>('continent');
  const [continent, setContinent] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [serviceMode, setServiceMode] = useState<ServiceMode | null>(null);
  const [date, setDate] = useState(() => formatDateForInput(new Date()));
  const [time, setTime] = useState('20:00');
  const [duration, setDuration] = useState('2 hours');

  const selectedCities = destinations.find((item) => item.continent === continent)?.cities ?? [];
  const currentStepIndex = ['continent', 'city', 'gender', 'time', 'duration'].indexOf(step);
  const minDate = formatDateForInput(new Date());

  const results = useMemo(() => {
    return staffList.filter((staff) => {
      const meta = mockStaffSearchMeta[staff.id];
      if (!meta) return false;
      return meta.city === city && meta.gender === gender && meta.modes.includes(serviceMode as ServiceMode);
    });
  }, [city, gender, serviceMode, staffList]);

  const selectContinent = (value: string) => {
    setContinent(value);
    setCity('');
    setStep('city');
  };

  const selectCity = (value: string) => {
    setCity(value);
    setStep('gender');
  };

  const selectGender = (value: Gender) => {
    setGender(value);
    setStep('time');
  };

  const selectMode = (value: ServiceMode) => {
    setServiceMode(value);
  };

  const goBack = () => {
    const steps: Step[] = ['continent', 'city', 'gender', 'time', 'duration', 'results'];
    const index = steps.indexOf(step);
    if (index === 0) {
      onClose();
      return;
    }
    setStep(steps[index - 1]);
  };

  const startAgain = () => {
    setContinent('');
    setCity('');
    setGender(null);
    setServiceMode(null);
    setStep('continent');
  };

  const labels = ['Region', 'City', 'Gender', 'Time', 'Duration'];

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-neutral-bgLight">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <button onClick={goBack} className="inline-flex items-center gap-2 text-sm font-bold text-neutral-medium hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> {step === 'continent' ? 'Close' : 'Back'}
          </button>
          <div className="text-center">
            <p className="text-lg font-extrabold text-neutral-dark">Meet an escort</p>
            <p className="text-xs text-neutral-light">Find availability in your city</p>
          </div>
          <button onClick={onClose} aria-label="Close search" className="rounded-full p-2 text-neutral-light hover:bg-neutral-bgLight hover:text-neutral-dark">
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
          <StepPanel icon={<MapPin />} eyebrow="Step 1 of 5" title="Where would you like to meet?" description="Choose a region to see cities with mock availability.">
            <div className="grid gap-3 sm:grid-cols-2">
              {destinations.map((item) => <OptionButton key={item.continent} title={item.continent} subtitle={`${item.cities.length} cities`} onClick={() => selectContinent(item.continent)} />)}
            </div>
          </StepPanel>
        )}

        {step === 'city' && (
          <StepPanel icon={<MapPin />} eyebrow="Step 2 of 5" title={`Choose a city in ${continent}`} description="You can change your region with the Back button.">
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedCities.map((item) => <OptionButton key={item} title={item} subtitle="View available profiles" onClick={() => selectCity(item)} />)}
            </div>
          </StepPanel>
        )}

        {step === 'gender' && (
          <StepPanel icon={<UserRound />} eyebrow="Step 3 of 5" title="Who would you like to meet?" description={`Showing preferences for ${city}.`}>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['Female', 'Male'] as Gender[]).map((item) => <OptionButton key={item} title={item} subtitle={`Show ${item.toLowerCase()} profiles`} selected={gender === item} onClick={() => selectGender(item)} />)}
            </div>
          </StepPanel>
        )}

        {step === 'time' && (
          <StepPanel icon={<CalendarDays />} eyebrow="Step 4 of 5" title="When and how would you like to meet?" description="Pick an availability type, date, and preferred time.">
            <div className="grid gap-3 sm:grid-cols-2">
              {(['On-call', 'In-call'] as ServiceMode[]).map((item) => <OptionButton key={item} title={item} subtitle={item === 'On-call' ? 'Meet at your preferred location' : 'Meet at the profile location'} selected={serviceMode === item} onClick={() => selectMode(item)} />)}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-neutral-dark">Date<input type="date" min={minDate} value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-neutral-medium outline-none focus:border-primary" /></label>
              <label className="text-sm font-bold text-neutral-dark">Preferred time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-neutral-medium outline-none focus:border-primary" /></label>
            </div>
            <button disabled={!serviceMode} onClick={() => setStep('duration')} className="mt-7 w-full rounded-full bg-primary px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40">Continue</button>
          </StepPanel>
        )}

        {step === 'duration' && (
          <StepPanel icon={<Clock3 />} eyebrow="Step 5 of 5" title="How long would you like to meet?" description="This preference is included in your mock search result.">
            <div className="grid gap-3 sm:grid-cols-2">
              {['1 hour', '2 hours', '3 hours', 'Overnight'].map((item) => <OptionButton key={item} title={item} selected={duration === item} onClick={() => setDuration(item)} />)}
            </div>
            <button onClick={() => setStep('results')} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-primary-hover"><Search className="h-4 w-4" /> Search profiles</button>
          </StepPanel>
        )}

        {step === 'results' && (
          <section>
            <div className="mb-8 flex flex-col justify-between gap-5 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Mock search results</p>
                <h1 className="mt-1 text-3xl font-extrabold text-neutral-dark">Available in {city}</h1>
                <p className="mt-2 text-sm text-neutral-light">{results.length} profile{results.length === 1 ? '' : 's'} matching your current preferences.</p>
              </div>
              <button onClick={startAgain} className="rounded-full border border-primary px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white">Edit search</button>
            </div>
            <div className="mb-7 flex flex-wrap items-center gap-2 text-sm font-semibold text-neutral-medium">
              {[city, gender, serviceMode, `${date} · ${time}`, duration].map((item) => <span key={item} className="rounded-full bg-white px-4 py-2 shadow-sm">{item}</span>)}
            </div>
            {results.length ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 md:gap-6">
                {results.map((staff) => <StaffCard key={staff.id} staff={staff} baseUrl={baseUrl} onClick={() => onStaffClick(staff)} />)}
              </div>
            ) : (
              <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm">
                <h2 className="text-xl font-bold text-neutral-dark">No mock profiles match this combination</h2>
                <p className="mt-2 text-sm text-neutral-light">Try another city, gender, or availability type.</p>
                <button onClick={startAgain} className="mt-6 rounded-full bg-primary px-5 py-3 font-bold text-white hover:bg-primary-hover">Start a new search</button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

const StepPanel: FC<{ icon: React.ReactNode; eyebrow: string; title: string; description: string; children: React.ReactNode }> = ({ icon, eyebrow, title, description, children }) => (
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
  <button onClick={onClick} className={`group flex items-center justify-between rounded-2xl border p-4 text-left transition ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-sm'}`}>
    <span><span className="block font-bold text-neutral-dark">{title}</span>{subtitle && <span className="mt-1 block text-xs text-neutral-light">{subtitle}</span>}</span>
    <ChevronRight className={`h-5 w-5 transition ${selected ? 'text-primary' : 'text-neutral-light group-hover:text-primary'}`} />
  </button>
);
