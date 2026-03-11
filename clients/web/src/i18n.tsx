import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type Lang = 'ua' | 'en' | 'ru'

const LANG_KEY = 'streeming_lang'

const translations = {
  // ---- TopBar ----
  search: { ua: 'Пошук стрімів…', en: 'Search streams…', ru: 'Поиск стримов…' },
  login: { ua: 'Увійти', en: 'Log In', ru: 'Войти' },
  register: { ua: 'Реєстрація', en: 'Sign Up', ru: 'Регистрация' },
  logout: { ua: 'Вийти', en: 'Log Out', ru: 'Выйти' },
  interfaceLang: { ua: 'Мова інтерфейсу', en: 'Interface Language', ru: 'Язык интерфейса' },
  later: { ua: 'Пізніше', en: 'Later', ru: 'Позже' },

  // ---- Sidebar ----
  home: { ua: 'Головна', en: 'Home', ru: 'Главная' },
  browse: { ua: 'Огляд', en: 'Browse', ru: 'Обзор' },
  dashboard: { ua: 'Панель керування', en: 'Dashboard', ru: 'Панель управления' },
  liveChannels: { ua: 'LIVE КАНАЛИ', en: 'LIVE CHANNELS', ru: 'LIVE КАНАЛЫ' },
  recommended: { ua: 'РЕКОМЕНДОВАНІ', en: 'RECOMMENDED', ru: 'РЕКОМЕНДУЕМЫЕ' },
  offline: { ua: 'Офлайн', en: 'Offline', ru: 'Офлайн' },

  // ---- StreamGrid ----
  liveNow: { ua: 'Наживо', en: 'Live Now', ru: 'В эфире' },
  streams_count: { ua: 'стрімів', en: 'streams', ru: 'стримов' },
  channels_count: { ua: 'каналів', en: 'channels', ru: 'каналов' },
  recommendedChannels: { ua: 'Рекомендовані канали', en: 'Recommended Channels', ru: 'Рекомендуемые каналы' },
  noStreams: { ua: 'Поки немає стрімів', en: 'No streams yet', ru: 'Пока нет стримов' },
  createFirst: { ua: 'Створіть свій перший стрім!', en: 'Create your first stream!', ru: 'Создайте свой первый стрим!' },
  searchResults: { ua: 'Результати пошуку', en: 'Search results', ru: 'Результаты поиска' },
  allStreams: { ua: 'Усі стріми', en: 'All streams', ru: 'Все стримы' },

  // ---- StreamCard ----
  live: { ua: 'Наживо', en: 'Live', ru: 'В эфире' },

  // ---- Auth modal ----
  loginTitle: { ua: 'Увійти в Streeming', en: 'Log in to Streeming', ru: 'Вход в Streeming' },
  registerTitle: { ua: 'Створити акаунт', en: 'Create Account', ru: 'Создать аккаунт' },
  email: { ua: 'Email', en: 'Email', ru: 'Email' },
  password: { ua: 'Пароль', en: 'Password', ru: 'Пароль' },
  passwordMin: { ua: 'Мінімум 8 символів', en: 'Minimum 8 characters', ru: 'Минимум 8 символов' },
  noAccount: { ua: 'Немає акаунту?', en: "Don't have an account?", ru: 'Нет аккаунта?' },
  hasAccount: { ua: 'Вже є акаунт?', en: 'Already have an account?', ru: 'Уже есть аккаунт?' },
  authRequired: { ua: 'Email та пароль (мін. 8 символів) обов\'язкові', en: 'Email and password (min 8 chars) required', ru: 'Email и пароль (мин. 8 символов) обязательны' },
  authError: { ua: 'Помилка авторизації', en: 'Authentication error', ru: 'Ошибка авторизации' },
  wait: { ua: 'Зачекайте…', en: 'Please wait…', ru: 'Подождите…' },

  // ---- Create stream ----
  createStream: { ua: 'Створити стрім', en: 'Create Stream', ru: 'Создать стрим' },
  streamTitle: { ua: 'Назва стріму', en: 'Stream Title', ru: 'Название стрима' },
  streamTitlePlaceholder: { ua: 'Наприклад: Fortnite Ranked', en: 'e.g. Fortnite Ranked', ru: 'Например: Fortnite Ranked' },
  streamDescription: { ua: 'Опис', en: 'Description', ru: 'Описание' },
  streamDescPlaceholder: { ua: 'Розкажіть про свій стрім…', en: 'Tell about your stream…', ru: 'Расскажите о стриме…' },
  streamCategory: { ua: 'Категорія', en: 'Category', ru: 'Категория' },
  selectCategory: { ua: 'Оберіть категорію', en: 'Select category', ru: 'Выберите категорию' },
  streamLanguage: { ua: 'Мова стріму', en: 'Stream Language', ru: 'Язык стрима' },
  create: { ua: 'Створити', en: 'Create', ru: 'Создать' },
  cancel: { ua: 'Скасувати', en: 'Cancel', ru: 'Отмена' },
  streamCreated: { ua: 'Стрім створено!', en: 'Stream created!', ru: 'Стрим создан!' },
  streamCreatedDesc: { ua: 'Ваші ключі для стріму готові. Перейдіть у Панель керування щоб їх побачити.', en: 'Your stream keys are ready. Go to Dashboard to see them.', ru: 'Ваши ключи для стрима готовы. Перейдите в Панель управления чтобы увидеть их.' },
  goToDashboard: { ua: 'Перейти до панелі', en: 'Go to Dashboard', ru: 'Перейти к панели' },
  titleMin: { ua: 'Назва мін. 3 символи', en: 'Title min. 3 characters', ru: 'Название мин. 3 символа' },
  createError: { ua: 'Не вдалось створити стрім', en: 'Failed to create stream', ru: 'Не удалось создать стрим' },

  // ---- Dashboard ----
  dashboardTitle: { ua: 'Панель керування', en: 'Creator Dashboard', ru: 'Панель управления' },
  yourStreams: { ua: 'Ваші стріми', en: 'Your Streams', ru: 'Ваши стримы' },
  streamSettings: { ua: 'Налаштування стріму', en: 'Stream Settings', ru: 'Настройки стрима' },
  rtmpUrl: { ua: 'URL сервера', en: 'Server URL', ru: 'URL сервера' },
  streamKey: { ua: 'Ключ стріму', en: 'Stream Key', ru: 'Ключ стрима' },
  copied: { ua: 'Скопійовано!', en: 'Copied!', ru: 'Скопировано!' },
  goLive: { ua: 'Розпочати стрім', en: 'Go Live', ru: 'Начать стрим' },
  stopStream: { ua: 'Зупинити', en: 'Stop', ru: 'Остановить' },
  deleteStream: { ua: 'Видалити', en: 'Delete', ru: 'Удалить' },
  deleteConfirm: { ua: 'Видалити цей стрім?', en: 'Delete this stream?', ru: 'Удалить этот стрим?' },
  noOwnStreams: { ua: 'У вас ще немає стрімів', en: 'You have no streams yet', ru: 'У вас пока нет стримов' },
  obsHint: { ua: 'Використовуйте ці дані у OBS Studio або іншому ПЗ для трансляцій', en: 'Use these in OBS Studio or other broadcasting software', ru: 'Используйте эти данные в OBS Studio или другом ПО для трансляций' },
  show: { ua: 'Показати', en: 'Show', ru: 'Показать' },
  hide: { ua: 'Сховати', en: 'Hide', ru: 'Скрыть' },

  // ---- Watch ----
  follow: { ua: 'Підписатись', en: 'Follow', ru: 'Подписаться' },
  following: { ua: 'Підписано', en: 'Following', ru: 'Подписан' },
  back: { ua: 'Назад', en: 'Back', ru: 'Назад' },

  // ---- Chat ----
  chatTitle: { ua: 'Чат стріму', en: 'Stream Chat', ru: 'Чат стрима' },
  chatWelcome: { ua: 'Вітаємо у чаті!', en: 'Welcome to the chat!', ru: 'Добро пожаловать в чат!' },
  chatFirst: { ua: 'Напишіть перше повідомлення', en: 'Send the first message', ru: 'Напишите первое сообщение' },
  chatPlaceholder: { ua: 'Надіслати повідомлення', en: 'Send a message', ru: 'Отправить сообщение' },
  connecting: { ua: 'З\'єднання…', en: 'Connecting…', ru: 'Подключение…' },
  guest: { ua: 'Гість', en: 'Guest', ru: 'Гость' },

  // ---- Toasts ----
  welcome: { ua: 'Ласкаво просимо!', en: 'Welcome!', ru: 'Добро пожаловать!' },
  loggedOut: { ua: 'Ви вийшли з акаунту', en: 'You have logged out', ru: 'Вы вышли из аккаунта' },
  streamDeleted: { ua: 'Стрім видалено', en: 'Stream deleted', ru: 'Стрим удалён' },

  // ---- Categories ----
  cat_gaming: { ua: 'Ігри', en: 'Gaming', ru: 'Игры' },
  cat_irl: { ua: 'IRL', en: 'IRL', ru: 'IRL' },
  cat_music: { ua: 'Музика', en: 'Music', ru: 'Музыка' },
  cat_esports: { ua: 'Кіберспорт', en: 'Esports', ru: 'Киберспорт' },
  cat_creative: { ua: 'Творчість', en: 'Creative', ru: 'Творчество' },
  cat_education: { ua: 'Навчання', en: 'Education', ru: 'Образование' },
  cat_talkshow: { ua: 'Ток-шоу', en: 'Talk Show', ru: 'Ток-шоу' },
  cat_other: { ua: 'Інше', en: 'Other', ru: 'Другое' },

  // ---- Thumbnail ----
  thumbnail: { ua: 'Превʼю стріму', en: 'Stream Thumbnail', ru: 'Превью стрима' },
  thumbnailHint: { ua: 'JPG, PNG або WebP, до 5 МБ', en: 'JPG, PNG or WebP, up to 5 MB', ru: 'JPG, PNG или WebP, до 5 МБ' },
  uploadThumbnail: { ua: 'Завантажити превʼю', en: 'Upload Thumbnail', ru: 'Загрузить превью' },
  changeThumbnail: { ua: 'Змінити', en: 'Change', ru: 'Изменить' },
  thumbnailUploaded: { ua: 'Превʼю завантажено!', en: 'Thumbnail uploaded!', ru: 'Превью загружено!' },

  // ---- Chat features ----
  chatViewers: { ua: 'глядачів', en: 'viewers', ru: 'зрителей' },
  chatRules: { ua: 'Правила чату', en: 'Chat Rules', ru: 'Правила чата' },
  chatRulesText: { ua: 'Будьте ввічливі. Без спаму та реклами.', en: 'Be respectful. No spam or ads.', ru: 'Будьте вежливы. Без спама и рекламы.' },
  chatJoined: { ua: 'приєднався до чату', en: 'joined the chat', ru: 'присоединился к чату' },

  // ---- Language names ----
  lang_ua: { ua: 'Українська', en: 'Ukrainian', ru: 'Украинский' },
  lang_en: { ua: 'English', en: 'English', ru: 'English' },
  lang_ru: { ua: 'Російська', en: 'Russian', ru: 'Русский' },
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
    if (stored === 'en' || stored === 'ru' || stored === 'ua') return stored
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

export const STREAM_LANGUAGES: Lang[] = ['ua', 'en', 'ru']
