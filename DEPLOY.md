# 🚀 DEPLOY GUIDE — PrintTrack

Полностью бесплатный стек. Время: ~30 минут.

```
GitHub (код) → Render.com (backend) + Vercel (frontend) + Neon (БД)
```

---

## ШАГ 1 — GitHub репозиторий

```bash
# В папке printtrack:
git init
git add .
git commit -m "feat: initial PrintTrack app"
git branch -M main
git remote add origin https://github.com/soiledz/printtrack.git
git push -u origin main
```

Репозиторий: https://github.com/soiledz/printtrack

---

## ШАГ 2 — База данных (Neon.tech) 🗄️

**Почему Neon:** бесплатно НАВСЕГДА, PostgreSQL, без expire (в отличие от Render Postgres).

1. Зайти на https://neon.tech → **Sign Up** (через GitHub)
2. **New Project** → имя `printtrack` → регион `Europe (Frankfurt)`
3. В дашборде скопировать **Connection String** (вид: `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`)
4. Сохранить — это `DATABASE_URL` 🔑

---

## ШАГ 3 — Telegram Bot 🤖

1. Написать @BotFather в Telegram
2. `/newbot` → имя `PrintTrack` → username `printtrack_yourname_bot`
3. Сохранить **токен** (вид: `1234567890:AAH...`) 🔑
4. `/setmenubutton` → выбрать своего бота → после деплоя вернёмся и вставим URL

---

## ШАГ 4 — Backend на Render.com 🖥️

**Почему Render:** автодеплой из GitHub, бесплатно, Node.js из коробки.

1. Зайти на https://render.com → **Sign Up** (через GitHub)
2. **New** → **Web Service**
3. Подключить репо `soiledz/printtrack`
4. Настройки:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npx tsx prisma/seed.ts`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. **Environment Variables** → добавить:

| Ключ | Значение |
|------|---------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(строка подключения из Neon)* |
| `JWT_SECRET` | *(любая длинная случайная строка, например: `printtrack_super_secret_2025_xyz`)* |
| `TELEGRAM_BOT_TOKEN` | *(токен от BotFather)* |
| `APP_URL` | *(заполним после деплоя фронтенда)* |
| `PORT` | `3001` |

6. **Create Web Service** → ждём ~3 минуты
7. Сохранить URL вида `https://printtrack-api.onrender.com` 🔑

---

## ШАГ 5 — Frontend на Vercel ⚡

**Почему Vercel:** CDN по всему миру, бесплатно навсегда для статических сайтов.

1. Зайти на https://vercel.com → **Sign Up** (через GitHub)
2. **Add New** → **Project**
3. Выбрать репо `soiledz/printtrack`
4. Настройки:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
5. **Environment Variables** → добавить:

| Ключ | Значение |
|------|---------|
| `VITE_API_URL` | `https://printtrack-api.onrender.com/api` |

6. **Deploy** → ждём ~1 минуту
7. Сохранить URL вида `https://printtrack.vercel.app` 🔑

---

## ШАГ 6 — Соединить всё 🔗

### Обновить backend на Render:
В Render → твой сервис → **Environment** → изменить:
- `APP_URL` = `https://printtrack.vercel.app`
→ **Save Changes** (автоматически передеплоится)

### Настроить Mini App в BotFather:
```
/setmenubutton
→ выбрать @printtrack_yourname_bot
→ URL: https://printtrack.vercel.app
→ Button text: 📋 PrintTrack
```

### Зарегистрировать себя как первый Admin:
Написать своему боту: `/addadmin`
(работает только если в системе 0 админов)

---

## ШАГ 7 — Предотвратить sleep на Render 😴

Render усыпляет бесплатные сервисы через 15 минут неактивности.
Решение: бесплатный мониторинг UptimeRobot.

1. Зайти на https://uptimerobot.com → **Sign Up** (бесплатно)
2. **Add New Monitor**:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** PrintTrack API
   - **URL:** `https://printtrack-api.onrender.com/health`
   - **Monitoring Interval:** Every 5 minutes
3. **Create Monitor** ✅

Теперь сервис будет пинговаться каждые 5 минут и никогда не уснёт.

---

## ШАГ 8 — Проверка ✅

1. Открыть `https://printtrack-api.onrender.com/health` → должно вернуть `{"status":"ok"}`
2. Открыть `https://printtrack.vercel.app` → должен загрузиться интерфейс
3. Написать боту `/start` → должна появиться кнопка открытия Mini App
4. Нажать кнопку → Mini App открывается в Telegram ✅

---

## 🔄 Обновление кода (после изменений)

```bash
git add .
git commit -m "feat: описание изменений"
git push
```

Render и Vercel автоматически передеплоят через ~2-3 минуты.

---

## 📊 Итоговая схема инфраструктуры

```
Telegram App
     │
     ▼
┌──────────────────┐
│  Vercel (FREE)   │  ← React фронтенд
│  printtrack.     │     CDN по всему миру
│  vercel.app      │     автодеплой из GitHub
└──────────────────┘
     │ API запросы
     ▼
┌──────────────────┐
│  Render (FREE)   │  ← Node.js / Fastify
│  printtrack-api. │     750 часов/месяц
│  onrender.com    │     не спит (UptimeRobot)
└──────────────────┘
     │ SQL
     ▼
┌──────────────────┐
│  Neon (FREE)     │  ← PostgreSQL
│  нет expire!     │     0.5 GB хранилище
│  EU Frankfurt    │     автомасштабирование
└──────────────────┘
```

---

## 💰 Стоимость: $0/месяц навсегда

| Сервис | Лимит | Достаточно для |
|--------|-------|----------------|
| GitHub | Публичные репо бесплатно | ✅ |
| Neon | 0.5 GB, нет expire | ~100к записей |
| Render | 750 ч/мес, 512MB RAM | небольшая команда |
| Vercel | 100GB bandwidth | любой трафик |
| UptimeRobot | 50 мониторов | ✅ |

---

## 🆘 Частые проблемы

**Backend не стартует:**
- Проверить все env variables в Render
- Открыть Render → Logs и найти ошибку

**"Вас нет в системе":**
- Написать боту `/addadmin` (первый запуск)
- После: `/adduser <telegram_id> <имя>`

**Mini App не открывается:**
- APP_URL должен быть HTTPS (Vercel даёт автоматически)
- В BotFather проверить setmenubutton URL

**Render засыпает несмотря на UptimeRobot:**
- Убедиться что интервал 5 минут (не больше)
- Проверить что URL /health возвращает 200
