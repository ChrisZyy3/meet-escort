import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FC, FormEvent } from 'react';
import { ArrowLeft, Headset, LoaderCircle, Minimize2, Paperclip, Send, X } from 'lucide-react';
import type { AuthUser, ChatMessage } from '../types';
import { API_BASE_URL, fetchChatMessages, resolveMediaUrl, sendChatMessage } from '../services/api';
import { useTranslation } from '../i18n';

interface ChatWidgetProps {
  user: AuthUser | null;
  isSuppressed?: boolean;
  onLoginClick: () => void;
}

const ACTIVE_POLL_INTERVAL_MS = 2500;
const BACKGROUND_POLL_INTERVAL_MS = 60000;
const LAST_READ_PREFIX = 'meet_escort_chat_last_read_';

const readStoredMessageId = (key: string): number => {
  if (typeof window === 'undefined') return 0;
  const value = Number.parseInt(localStorage.getItem(key) || '0', 10);
  return Number.isFinite(value) ? value : 0;
};

const formatMessageTime = (value: string): string => {
  if (!value) return '';
  return value.replace('T', ' ').slice(0, 16);
};

const areMessagesEqual = (first: ChatMessage, second: ChatMessage): boolean => (
  first.id === second.id
  && first.sender === second.sender
  && first.content === second.content
  && first.fileUrl === second.fileUrl
  && first.adminName === second.adminName
  && first.createdAt === second.createdAt
);

export const ChatWidget: FC<ChatWidgetProps> = ({ user, isSuppressed = false, onLoginClick }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportMetrics, setViewportMetrics] = useState<{ height: number; offsetTop: number } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestMessageIdRef = useRef(0);
  const historyLoadedRef = useRef(false);
  const pollingRef = useRef(false);
  const sessionGenerationRef = useRef(0);
  const firstSyncRef = useRef(false);
  const lastReadIdRef = useRef(0);
  const lastReadKey = useMemo(() => `${LAST_READ_PREFIX}${user?.id ?? 'guest'}`, [user?.id]);

  const updateUnreadCount = useCallback((nextMessages: ChatMessage[]) => {
    const unread = nextMessages.filter((message) => message.sender === 'admin' && message.id > lastReadIdRef.current).length;
    setUnreadCount(unread);
  }, []);

  const pullMessages = useCallback(async () => {
    if (!user || pollingRef.current || document.visibilityState === 'hidden') return;
    const requestGeneration = sessionGenerationRef.current;
    pollingRef.current = true;
    if (!historyLoadedRef.current) setIsLoading(true);
    setError(null);
    try {
      const incoming = await fetchChatMessages(historyLoadedRef.current ? latestMessageIdRef.current : 0);
      if (requestGeneration !== sessionGenerationRef.current) return;
      setMessages((current) => {
        const merged = new Map(current.map((message) => [message.id, message]));
        incoming.forEach((message) => merged.set(message.id, message));
        const next = Array.from(merged.values()).sort((a, b) => a.id - b.id);
        const nextLatestId = next.reduce((max, message) => Math.max(max, message.id), latestMessageIdRef.current);
        latestMessageIdRef.current = nextLatestId;

        if (!firstSyncRef.current && nextLatestId > 0 && !localStorage.getItem(lastReadKey)) {
          lastReadIdRef.current = nextLatestId;
          localStorage.setItem(lastReadKey, String(nextLatestId));
        }
        firstSyncRef.current = true;
        updateUnreadCount(next);
        const messagesChanged = next.length !== current.length
          || next.some((message, index) => !areMessagesEqual(message, current[index]));
        return messagesChanged ? next : current;
      });
      historyLoadedRef.current = true;
    } catch (requestError) {
      if (requestGeneration === sessionGenerationRef.current) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load support messages.');
      }
    } finally {
      if (requestGeneration === sessionGenerationRef.current) {
        pollingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [lastReadKey, updateUnreadCount, user]);

  useEffect(() => {
    sessionGenerationRef.current += 1;
    pollingRef.current = false;
    lastReadIdRef.current = readStoredMessageId(lastReadKey);
    latestMessageIdRef.current = 0;
    historyLoadedRef.current = false;
    firstSyncRef.current = false;
    setMessages([]);
    setUnreadCount(0);
    setError(null);
    if (!user) return;

    void pullMessages();
  }, [lastReadKey, pullMessages, user]);

  const hasConversation = messages.length > 0;

  useEffect(() => {
    if (!user || (!isExpanded && !hasConversation)) return;

    const interval = isExpanded ? ACTIVE_POLL_INTERVAL_MS : BACKGROUND_POLL_INTERVAL_MS;
    const timer = window.setInterval(() => void pullMessages(), interval);
    return () => window.clearInterval(timer);
  }, [hasConversation, isExpanded, pullMessages, user]);

  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (isExpanded || hasConversation)) {
        void pullMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasConversation, isExpanded, pullMessages, user]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMedia = () => setIsMobile(mediaQuery.matches);
    updateMedia();
    mediaQuery.addEventListener('change', updateMedia);
    return () => mediaQuery.removeEventListener('change', updateMedia);
  }, []);

  useEffect(() => {
    if (!isMobile || !isExpanded) {
      setViewportMetrics(null);
      return;
    }
    const visualViewport = window.visualViewport;
    const updateViewport = () => setViewportMetrics({
      height: visualViewport?.height || window.innerHeight,
      offsetTop: visualViewport?.offsetTop || 0,
    });
    updateViewport();
    visualViewport?.addEventListener('resize', updateViewport);
    visualViewport?.addEventListener('scroll', updateViewport);
    return () => {
      visualViewport?.removeEventListener('resize', updateViewport);
      visualViewport?.removeEventListener('scroll', updateViewport);
    };
  }, [isExpanded, isMobile]);

  useEffect(() => {
    if (!isExpanded || !messages.length) return;
    const newestId = messages[messages.length - 1].id;
    lastReadIdRef.current = newestId;
    localStorage.setItem(lastReadKey, String(newestId));
    updateUnreadCount(messages);
  }, [isExpanded, lastReadKey, messages, updateUnreadCount]);

  useEffect(() => {
    if (!isMobile || !isExpanded) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isExpanded, isMobile]);

  useEffect(() => {
    if (isSuppressed) setIsExpanded(false);
  }, [isSuppressed]);

  useEffect(() => {
    if (!isExpanded) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isExpanded, messages]);

  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending || !user) return;
    setIsSending(true);
    setError(null);
    try {
      await sendChatMessage(content);
      setDraft('');
      await pullMessages();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send support message.');
    } finally {
      setIsSending(false);
    }
  };

  if (isSuppressed) return null;

  const panelStyle = viewportMetrics ? ({
    '--chat-viewport-height': `${viewportMetrics.height}px`,
    '--chat-viewport-top': `${viewportMetrics.offsetTop}px`,
  } as CSSProperties) : undefined;

  return (
    <div className={`chat-widget ${isExpanded ? 'chat-widget--expanded' : ''}`}>
      {isExpanded ? (
        <section className="chat-widget__panel" style={panelStyle} role="dialog" aria-modal="false" aria-labelledby="chat-widget-title">
          <header className="chat-widget__header">
            <div className="chat-widget__header-main">
              <button type="button" className="chat-widget__mobile-back" onClick={() => setIsExpanded(false)} aria-label={t('common.close')}>
                <ArrowLeft aria-hidden="true" />
              </button>
              <span className="chat-widget__avatar" aria-hidden="true"><Headset /></span>
              <div>
                <h2 id="chat-widget-title">{t('chat.title')}</h2>
                <p><span className="chat-widget__online-dot" /> {t('chat.replyTime')}</p>
              </div>
            </div>
            <div className="chat-widget__header-actions">
              <button type="button" className="chat-widget__icon-button chat-widget__desktop-only" onClick={() => setIsExpanded(false)} aria-label={t('chat.support')} title={t('chat.support')}>
                <Minimize2 aria-hidden="true" />
              </button>
              <button type="button" className="chat-widget__icon-button" onClick={() => setIsExpanded(false)} aria-label={t('common.close')} title={t('common.close')}>
                <X aria-hidden="true" />
              </button>
            </div>
          </header>

          {!user ? (
            <div className="chat-widget__auth-state">
              <span className="chat-widget__auth-icon"><Headset /></span>
              <h3>{t('chat.contactSupport')}</h3>
              <p>{t('chat.accountLinked')}</p>
              <button type="button" className="chat-widget__primary-button" onClick={onLoginClick}>{t('chat.signIn')}</button>
            </div>
          ) : (
            <>
              <div className="chat-widget__messages" aria-live="polite" aria-label={t('chat.support')}>
                {isLoading ? <LoaderCircle className="chat-widget__loader" aria-label={t('common.loading')} /> : null}
                {!isLoading && messages.length === 0 ? (
                  <div className="chat-widget__empty-state">
                    <span className="chat-widget__empty-icon"><Headset /></span>
                    <strong>{t('chat.help')}</strong>
                    <span>{t('chat.empty')}</span>
                  </div>
                ) : null}
                {messages.map((message) => {
                  const isUserMessage = message.sender === 'user';
                  return (
                    <article className={`chat-widget__message-row ${isUserMessage ? 'is-user' : 'is-admin'}`} key={message.id}>
                      <div className="chat-widget__message-bubble">
                        {!isUserMessage && message.adminName ? <span className="chat-widget__message-author">{message.adminName}</span> : null}
                        {message.content ? <p>{message.content}</p> : null}
                        {message.fileUrl ? <a href={resolveMediaUrl(message.fileUrl, API_BASE_URL)} target="_blank" rel="noreferrer" className="chat-widget__file-link"><Paperclip aria-hidden="true" /> {t('chat.attachedFile')}</a> : null}
                        <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
                      </div>
                    </article>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-widget__composer" onSubmit={handleSubmit}>
                {error ? <p className="chat-widget__error" role="alert">{error}</p> : null}
                <div className="chat-widget__composer-row">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={2000}
                    placeholder={t('chat.writeMessage')}
                    aria-label={t('chat.messageSupport')}
                    disabled={isSending}
                  />
                  <button type="submit" className="chat-widget__send-button" disabled={!draft.trim() || isSending} aria-label={t('chat.sendMessage')} title={t('chat.sendMessage')}>
                    {isSending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
                  </button>
                </div>
                <span className="chat-widget__composer-note">{t('chat.textOnly')}</span>
              </form>
            </>
          )}
        </section>
      ) : null}

      <button type="button" className="chat-widget__launcher" onClick={() => setIsExpanded(true)} aria-label={t('chat.open')} title={t('chat.open')}>
        <Headset aria-hidden="true" />
        <span>{t('chat.support')}</span>
        {unreadCount > 0 ? <b className="chat-widget__unread-badge" aria-label={t('chat.unread', { count: unreadCount })}>{unreadCount > 9 ? '9+' : unreadCount}</b> : null}
      </button>
    </div>
  );
};
