import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type Lang = 'ua' | 'en' | 'no'

const LANG_KEY = 'streeming_lang'

const translations = {
  // ---- TopBar ----
  search: { ua: 'Пошук стрімів…', en: 'Search streams…', no: 'Søk etter strømmer…' },
  login: { ua: 'Увійти', en: 'Log In', no: 'Logg inn' },
  register: { ua: 'Реєстрація', en: 'Sign Up', no: 'Registrer' },
  logout: { ua: 'Вийти', en: 'Log Out', no: 'Logg ut' },
  interfaceLang: { ua: 'Мова інтерфейсу', en: 'Interface Language', no: 'Språk' },
  later: { ua: 'Пізніше', en: 'Later', no: 'Senere' },

  // ---- Sidebar ----
  home: { ua: 'Головна', en: 'Home', no: 'Hjem' },
  browse: { ua: 'Огляд', en: 'Browse', no: 'Utforsk' },
  dashboard: { ua: 'Панель керування', en: 'Dashboard', no: 'Kontrollpanel' },
  liveChannels: { ua: 'LIVE КАНАЛИ', en: 'LIVE CHANNELS', no: 'LIVE-KANALER' },
  recommended: { ua: 'РЕКОМЕНДОВАНІ', en: 'RECOMMENDED', no: 'ANBEFALT' },
  offline: { ua: 'Офлайн', en: 'Offline', no: 'Frakoblet' },

  // ---- StreamGrid ----
  liveNow: { ua: 'Наживо', en: 'Live Now', no: 'Direkte nå' },
  streams_count: { ua: 'стрімів', en: 'streams', no: 'strømmer' },
  channels_count: { ua: 'каналів', en: 'channels', no: 'kanaler' },
  recommendedChannels: { ua: 'Рекомендовані канали', en: 'Recommended Channels', no: 'Anbefalte kanaler' },
  noStreams: { ua: 'Поки немає стрімів', en: 'No streams yet', no: 'Ingen strømmer ennå' },
  createFirst: { ua: 'Створіть свій перший стрім!', en: 'Create your first stream!', no: 'Opprett din første strøm!' },
  searchResults: { ua: 'Результати пошуку', en: 'Search results', no: 'Søkeresultater' },
  allStreams: { ua: 'Усі стріми', en: 'All streams', no: 'Alle strømmer' },

  // ---- StreamCard ----
  live: { ua: 'Наживо', en: 'Live', no: 'Direkte' },

  // ---- Auth modal ----
  loginTitle: { ua: 'Увійти в Streeming', en: 'Log in to Streeming', no: 'Logg inn på Streeming' },
  registerTitle: { ua: 'Створити акаунт', en: 'Create Account', no: 'Opprett konto' },
  email: { ua: 'Email', en: 'Email', no: 'E-post' },
  password: { ua: 'Пароль', en: 'Password', no: 'Passord' },
  passwordMin: { ua: 'Мінімум 8 символів', en: 'Minimum 8 characters', no: 'Minst 8 tegn' },
  noAccount: { ua: 'Немає акаунту?', en: "Don't have an account?", no: 'Har du ikke en konto?' },
  hasAccount: { ua: 'Вже є акаунт?', en: 'Already have an account?', no: 'Har du allerede en konto?' },
  authRequired: { ua: 'Email та пароль (мін. 8 символів) обов\'язкові', en: 'Email and password (min 8 chars) required', no: 'E-post og passord (min 8 tegn) kreves' },
  authError: { ua: 'Помилка авторизації', en: 'Authentication error', no: 'Autentiseringsfeil' },
  wait: { ua: 'Зачекайте…', en: 'Please wait…', no: 'Vennligst vent…' },

  // ---- Create stream ----
  createStream: { ua: 'Створити стрім', en: 'Create Stream', no: 'Opprett strøm' },
  streamTitle: { ua: 'Назва стріму', en: 'Stream Title', no: 'Strømmens tittel' },
  streamTitlePlaceholder: { ua: 'Наприклад: Fortnite Ranked', en: 'e.g. Fortnite Ranked', no: 'f.eks. Fortnite Ranked' },
  streamDescription: { ua: 'Опис', en: 'Description', no: 'Beskrivelse' },
  streamDescPlaceholder: { ua: 'Розкажіть про свій стрім…', en: 'Tell about your stream…', no: 'Fortell om strømmen din…' },
  streamCategory: { ua: 'Категорія', en: 'Category', no: 'Kategori' },
  selectCategory: { ua: 'Оберіть категорію', en: 'Select category', no: 'Velg kategori' },
  streamLanguage: { ua: 'Мова стріму', en: 'Stream Language', no: 'Strømmens språk' },
  create: { ua: 'Створити', en: 'Create', no: 'Opprett' },
  cancel: { ua: 'Скасувати', en: 'Cancel', no: 'Avbryt' },
  streamCreated: { ua: 'Стрім створено!', en: 'Stream created!', no: 'Strøm opprettet!' },
  streamCreatedDesc: { ua: 'Ваші ключі для стріму готові. Перейдіть у Панель керування щоб їх побачити.', en: 'Your stream keys are ready. Go to Dashboard to see them.', no: 'Strømnøklene dine er klare. Gå til Kontrollpanel for å se dem.' },
  goToDashboard: { ua: 'Перейти до панелі', en: 'Go to Dashboard', no: 'Gå til kontrollpanel' },
  titleMin: { ua: 'Назва мін. 3 символи', en: 'Title min. 3 characters', no: 'Tittel min. 3 tegn' },
  createError: { ua: 'Не вдалось створити стрім', en: 'Failed to create stream', no: 'Kunne ikke opprette strøm' },

  // ---- Dashboard ----
  dashboardTitle: { ua: 'Панель керування', en: 'Creator Dashboard', no: 'Kontrollpanel' },
  yourStreams: { ua: 'Ваші стріми', en: 'Your Streams', no: 'Dine strømmer' },
  streamSettings: { ua: 'Налаштування стріму', en: 'Stream Settings', no: 'Strøminnstillinger' },
  rtmpUrl: { ua: 'URL сервера', en: 'Server URL', no: 'Server-URL' },
  streamKey: { ua: 'Ключ стріму', en: 'Stream Key', no: 'Strømnøkkel' },
  copied: { ua: 'Скопійовано!', en: 'Copied!', no: 'Kopiert!' },
  goLive: { ua: 'Розпочати стрім', en: 'Go Live', no: 'Start strøm' },
  stopStream: { ua: 'Зупинити', en: 'Stop', no: 'Stopp' },
  deleteStream: { ua: 'Видалити', en: 'Delete', no: 'Slett' },
  deleteConfirm: { ua: 'Видалити цей стрім?', en: 'Delete this stream?', no: 'Slette denne strømmen?' },
  noOwnStreams: { ua: 'У вас ще немає стрімів', en: 'You have no streams yet', no: 'Du har ingen strømmer ennå' },
  obsHint: { ua: 'Використовуйте ці дані у OBS Studio або іншому ПЗ для трансляцій', en: 'Use these in OBS Studio or other broadcasting software', no: 'Bruk disse i OBS Studio eller annen kringkastingsprogramvare' },
  show: { ua: 'Показати', en: 'Show', no: 'Vis' },
  hide: { ua: 'Сховати', en: 'Hide', no: 'Skjul' },

  // ---- Watch ----
  follow: { ua: 'Підписатись', en: 'Follow', no: 'Følg' },
  following: { ua: 'Підписано', en: 'Following', no: 'Følger' },
  back: { ua: 'Назад', en: 'Back', no: 'Tilbake' },

  // ---- Chat ----
  chatTitle: { ua: 'Чат стріму', en: 'Stream Chat', no: 'Strøm-chat' },
  chatWelcome: { ua: 'Вітаємо у чаті!', en: 'Welcome to the chat!', no: 'Velkommen til chatten!' },
  chatFirst: { ua: 'Напишіть перше повідомлення', en: 'Send the first message', no: 'Send den første meldingen' },
  chatPlaceholder: { ua: 'Надіслати повідомлення', en: 'Send a message', no: 'Send en melding' },
  connecting: { ua: 'З\'єднання…', en: 'Connecting…', no: 'Kobler til…' },
  guest: { ua: 'Гість', en: 'Guest', no: 'Gjest' },

  // ---- Toasts ----
  welcome: { ua: 'Ласкаво просимо!', en: 'Welcome!', no: 'Velkommen!' },
  loggedOut: { ua: 'Ви вийшли з акаунту', en: 'You have logged out', no: 'Du har logget ut' },
  streamDeleted: { ua: 'Стрім видалено', en: 'Stream deleted', no: 'Strøm slettet' },

  // ---- Categories ----
  cat_gaming: { ua: 'Ігри', en: 'Gaming', no: 'Spill' },
  cat_irl: { ua: 'IRL', en: 'IRL', no: 'IRL' },
  cat_music: { ua: 'Музика', en: 'Music', no: 'Musikk' },
  cat_esports: { ua: 'Кіберспорт', en: 'Esports', no: 'E-sport' },
  cat_creative: { ua: 'Творчість', en: 'Creative', no: 'Kreativt' },
  cat_education: { ua: 'Навчання', en: 'Education', no: 'Utdanning' },
  cat_talkshow: { ua: 'Ток-шоу', en: 'Talk Show', no: 'Talkshow' },
  cat_other: { ua: 'Інше', en: 'Other', no: 'Annet' },

  // ---- Thumbnail ----
  thumbnail: { ua: 'Превʼю стріму', en: 'Stream Thumbnail', no: 'Strøm-miniatyrbilde' },
  thumbnailHint: { ua: 'JPG, PNG або WebP, до 5 МБ', en: 'JPG, PNG or WebP, up to 5 MB', no: 'JPG, PNG eller WebP, opptil 5 MB' },
  uploadThumbnail: { ua: 'Завантажити превʼю', en: 'Upload Thumbnail', no: 'Last opp miniatyrbilde' },
  changeThumbnail: { ua: 'Змінити', en: 'Change', no: 'Endre' },
  thumbnailUploaded: { ua: 'Превʼю завантажено!', en: 'Thumbnail uploaded!', no: 'Miniatyrbilde lastet opp!' },

  // ---- Chat features ----
  chatViewers: { ua: 'глядачів', en: 'viewers', no: 'seere' },
  chatRules: { ua: 'Правила чату', en: 'Chat Rules', no: 'Chat-regler' },
  chatRulesText: { ua: 'Будьте ввічливі. Без спаму та реклами.', en: 'Be respectful. No spam or ads.', no: 'Vær respektfull. Ingen spam eller reklame.' },
  chatJoined: { ua: 'приєднався до чату', en: 'joined the chat', no: 'ble med i chatten' },

  // ---- Language names ----
  lang_ua: { ua: 'Українська', en: 'Ukrainian', no: 'Ukrainsk' },
  lang_en: { ua: 'English', en: 'English', no: 'English' },
  lang_no: { ua: 'Norsk', en: 'Norwegian', no: 'Norsk' },
} as const

export type TKey = keyof typeof translations

interface I18nCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TKey) => string
}

const I18nContext = createContext<I18nCtx>({
  lang: 'ua',
  setLang: () => {},
  t: (k) => k
})

export function I18nProvider ({ children }: { children: ReactNode }): JSX.Element {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored === 'en' || stored === 'no' || stored === 'ua') return stored
    if (stored === 'ru') return 'ua'
    return 'ua'
  })

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem(LANG_KEY, l)
  }, [])

  const t = useCallback((key: TKey): string => {
    const entry = translations[key]
    return entry?.[lang] ?? key
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n (): I18nCtx {
  return useContext(I18nContext)
}

export const CATEGORIES = ['gaming', 'irl', 'music', 'esports', 'creative', 'education', 'talkshow', 'other'] as const
export type Category = typeof CATEGORIES[number]

export function getCategoryKey (cat: Category): TKey {
  return `cat_${cat}` as TKey
}

export const STREAM_LANGUAGES: Lang[] = ['ua', 'en', 'no']
