import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { ArrowLeft, CalendarDays, Check, ChevronRight, Hotel, Send, UserRound, X } from 'lucide-react';
import type { Staff } from '../types';

type Step = 'schedule' | 'contact' | 'location' | 'complete';
type ServiceMode = 'On-call' | 'In-call';
type ContactMethod = 'Phone' | 'LINE' | 'WhatsApp' | 'Telegram';

interface BookingRequestFlowProps {
  staff: Staff;
  onClose: () => void;
  onProceedToPayment: (details: BookingDetails, amount: number) => void;
}

export interface BookingDetails {
  serviceMode: ServiceMode;
  date: string;
  time: string;
  duration: number;
  name: string;
  email: string;
  phone: string;
  contactMethod: ContactMethod;
  hotel: string;
  room: string;
  specialRequests: string;
  addDinner: boolean;
}

const dateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const BookingRequestFlow: FC<BookingRequestFlowProps> = ({ staff, onClose, onProceedToPayment }) => {
  const [step, setStep] = useState<Step>('schedule');
  const [serviceMode, setServiceMode] = useState<ServiceMode>('On-call');
  const [date, setDate] = useState(() => dateForInput(new Date()));
  const [time, setTime] = useState('20:00');
  const [duration, setDuration] = useState(2);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('Phone');
  const [hotel, setHotel] = useState('');
  const [room, setRoom] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [addDinner, setAddDinner] = useState(false);

  const baseTotal = staff.price * duration;
  const dinnerFee = addDinner ? 50 : 0;
  const total = baseTotal + dinnerFee;
  const minDate = dateForInput(new Date());
  const stepIndex = ['schedule', 'contact', 'location'].indexOf(step);
  const canContinueSchedule = Boolean(date && time && duration > 0);
  const canContinueContact = Boolean(name.trim() && email.trim() && phone.trim());
  const canSubmit = Boolean(hotel.trim() && room.trim());
  const summary = useMemo(() => `${serviceMode} · ${date} · ${time} · ${duration}h`, [date, duration, serviceMode, time]);

  const goBack = () => {
    const steps: Step[] = ['schedule', 'contact', 'location'];
    const index = steps.indexOf(step);
    if (index <= 0) {
      onClose();
      return;
    }
    setStep(steps[index - 1]);
  };

  const submit = () => {
    if (!canSubmit) return;
    onProceedToPayment({
      serviceMode,
      date,
      time,
      duration,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      contactMethod,
      hotel: hotel.trim(),
      room: room.trim(),
      specialRequests: specialRequests.trim(),
      addDinner
    }, total);
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="mx-auto min-h-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur md:px-8">
          <button onClick={step === 'complete' ? onClose : goBack} className="inline-flex items-center gap-2 text-sm font-bold text-neutral-medium hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> {step === 'schedule' || step === 'complete' ? 'Close' : 'Back'}
          </button>
          <div className="text-center">
            <p className="text-sm font-extrabold text-neutral-dark">Send request to {staff.name}</p>
            {step !== 'complete' && <p className="text-xs text-neutral-light">Your request will continue to payment</p>}
          </div>
          <button onClick={onClose} aria-label="Close booking request" className="rounded-full p-2 text-neutral-light hover:bg-neutral-bgLight hover:text-neutral-dark"><X className="h-5 w-5" /></button>
        </header>

        {step !== 'complete' && (
          <div className="px-6 pt-6 md:px-10">
            <div className="flex items-center justify-between gap-1">
              {['Schedule', 'Contact', 'Location'].map((label, index) => (
                <div key={label} className="flex flex-1 items-center last:flex-none">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index <= stepIndex ? 'bg-primary text-white' : 'bg-gray-200 text-neutral-light'}`}>{index < stepIndex ? <Check className="h-4 w-4" /> : index + 1}</span>
                  <span className={`ml-2 hidden text-xs font-semibold sm:inline ${index <= stepIndex ? 'text-neutral-dark' : 'text-neutral-light'}`}>{label}</span>
                  {index < 2 && <span className="mx-2 h-px flex-1 bg-gray-200" />}
                </div>
              ))}
            </div>
          </div>
        )}

        <main className="px-6 py-8 md:px-10 md:py-10">
          {step === 'schedule' && (
            <Section icon={<CalendarDays />} title="When would you like to meet?" description="Choose the service type, preferred time, and duration.">
              <div className="grid gap-3 sm:grid-cols-2">
                {(['On-call', 'In-call'] as ServiceMode[]).map((mode) => <Choice key={mode} title={mode} subtitle={mode === 'On-call' ? 'Meet at your selected location' : 'Meet at the profile location'} selected={serviceMode === mode} onClick={() => setServiceMode(mode)} />)}
              </div>
              <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2 [&>label]:min-w-0">
                <Field label="Date" className="min-w-0"><input type="date" min={minDate} value={date} onChange={(event) => setDate(event.target.value)} className="field" /></Field>
                <Field label="Time" className="min-w-0"><input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="field" /></Field>
              </div>
              <Field label="Duration" className="mt-5"><select value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="field"><option value={1}>1 hour</option><option value={2}>2 hours</option><option value={3}>3 hours</option><option value={4}>4 hours</option></select></Field>
              <Continue disabled={!canContinueSchedule} onClick={() => setStep('contact')} />
            </Section>
          )}

          {step === 'contact' && (
            <Section icon={<UserRound />} title="How should the profile contact you?" description="These details are included with your booking request.">
              <div className="space-y-4">
                <Field label="Your name"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. John Doe" className="field" /></Field>
                <Field label="Email"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="e.g. you@email.com" className="field" /></Field>
                <Field label="Phone"><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="e.g. +1 555 0100" className="field" /></Field>
                <Field label="Preferred contact method"><div className="mt-2 flex flex-wrap gap-2">{(['Phone', 'LINE', 'WhatsApp', 'Telegram'] as ContactMethod[]).map((method) => <button key={method} onClick={() => setContactMethod(method)} className={`rounded-full border px-4 py-2 text-sm font-bold transition ${contactMethod === method ? 'border-primary bg-primary text-white' : 'border-gray-200 text-neutral-medium hover:border-primary'}`}>{method}</button>)}</div></Field>
              </div>
              <Continue disabled={!canContinueContact} onClick={() => setStep('location')} />
            </Section>
          )}

          {step === 'location' && (
            <Section icon={<Hotel />} title="Where are you staying?" description="Enter a hotel or condo and room number for an on-call request.">
              <div className="space-y-4">
                <Field label="Hotel or condo"><input value={hotel} onChange={(event) => setHotel(event.target.value)} placeholder="Search or enter a hotel name" className="field" /></Field>
                <Field label="Room number"><input value={room} onChange={(event) => setRoom(event.target.value)} placeholder="e.g. 147A" className="field" /></Field>
                <Field label="Special requests"><textarea value={specialRequests} onChange={(event) => setSpecialRequests(event.target.value)} placeholder="Optional notes for the request" rows={3} className="field resize-none" /></Field>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-gray-200 p-4 text-sm"><span><span className="block font-bold text-neutral-dark">Dinner arrangement</span><span className="mt-1 block text-xs text-neutral-light">Add this preference to the request</span></span><span className="flex items-center gap-3 font-bold text-primary">+ $50<input type="checkbox" checked={addDinner} onChange={(event) => setAddDinner(event.target.checked)} className="h-4 w-4 accent-primary" /></span></label>
              </div>
              <div className="mt-6 rounded-2xl bg-neutral-bgLight p-5 text-sm">
                <p className="font-bold text-neutral-dark">Request summary</p>
                <p className="mt-1 text-neutral-light">{summary}</p>
                <p className="mt-1 text-neutral-light">Contact via {contactMethod}</p>
                <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-neutral-medium"><div className="flex justify-between"><span>{staff.name} · {duration}h</span><span>${baseTotal.toFixed(2)}</span></div>{addDinner && <div className="flex justify-between"><span>Dinner arrangement</span><span>$50.00</span></div>}<div className="flex justify-between pt-2 text-base font-extrabold text-neutral-dark"><span>Total</span><span>${total.toFixed(2)}</span></div></div>
              </div>
              <button disabled={!canSubmit} onClick={submit} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /> Send request</button>
            </Section>
          )}

          {step === 'complete' && (
            <div className="py-10 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600"><Check className="h-8 w-8" /></span>
              <h2 className="mt-6 text-3xl font-extrabold text-neutral-dark">Request ready</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-light">Your request for {staff.name} is ready. Continue to payment to submit the booking deposit.</p>
              <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-neutral-bgLight p-4 text-sm font-semibold text-neutral-medium">{summary}<br />{hotel}, room {room}</div>
              <button onClick={onClose} className="mt-7 rounded-full bg-primary px-7 py-3 font-bold text-white hover:bg-primary-hover">Back to profile</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const Section: FC<{ icon: React.ReactNode; title: string; description: string; children: React.ReactNode }> = ({ icon, title, description, children }) => <section><div className="mb-7 text-center"><span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</span><h1 className="text-2xl font-extrabold text-neutral-dark">{title}</h1><p className="mt-2 text-sm text-neutral-light">{description}</p></div>{children}</section>;
const Field: FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className = '', children }) => <label className={`block text-sm font-bold text-neutral-dark ${className}`}><span>{label}</span><span className="mt-2 block">{children}</span></label>;
const Choice: FC<{ title: string; subtitle: string; selected: boolean; onClick: () => void }> = ({ title, subtitle, selected, onClick }) => <button onClick={onClick} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${selected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}><span><span className="block font-bold text-neutral-dark">{title}</span><span className="mt-1 block text-xs text-neutral-light">{subtitle}</span></span><ChevronRight className={`h-5 w-5 ${selected ? 'text-primary' : 'text-neutral-light'}`} /></button>;
const Continue: FC<{ disabled: boolean; onClick: () => void }> = ({ disabled, onClick }) => <button disabled={disabled} onClick={onClick} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40">Continue <ChevronRight className="h-4 w-4" /></button>;
