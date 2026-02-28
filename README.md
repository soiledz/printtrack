# PrintTrack — Telegram Mini App

Система учёта рабочего времени и операций для шелкографии.

## Стек

| Слой | Технологии |
|------|-----------|
| Frontend | React 18, Vite, TypeScript, TailwindCSS |
| Backend | Node.js, Fastify, TypeScript |
| БД | PostgreSQL + Prisma ORM |
| Bot | Grammy.js |
| Auth | Telegram WebApp (initData validation) |

## Структура проекта

```
printtrack/
├── frontend/          # React Telegram Mini App
├── backend/           # Fastify API сервер
├── prisma/            # Схема БД и миграции
├── docker-compose.yml # PostgreSQL + pgAdmin
└── .env.example
```

## Быстрый старт

### 1. Требования
- Node.js 20+
- Docker & Docker Compose
- Telegram Bot Token (получить у @BotFather)

### 2. Установка

```bash
# Клонировать и установить зависимости
cd printtrack
cp .env.example .env
# Заполнить .env своими данными

# Запустить PostgreSQL
docker-compose up -d

# Backend
cd backend
npm install
npm run db:push      # применить схему
npm run db:seed      # заполнить нормами
npm run dev

# Frontend (другой терминал)
cd frontend
npm install
npm run dev
```

### 3. Настройка бота

В @BotFather:
```
/newbot → получить токен
/setmenubutton → установить кнопку открытия Mini App
URL: https://ваш-домен (или ngrok для локальной разработки)
```

## Уровни доступа

| Роль | Возможности |
|------|------------|
| `ADMIN` | Все права, управление пользователями, нормами, отчёты |
| `MANAGER` | Просмотр отчётов своего отдела, добавление сотрудников |
| `WORKER` | Свой рабочий день, задания, операции |

## API Endpoints

```
POST /api/auth/verify          — верификация Telegram initData
GET  /api/users/me             — текущий пользователь
GET  /api/calendar/:year/:month — дни месяца
POST /api/workday              — создать/обновить рабочий день
POST /api/task                 — создать задание
PUT  /api/task/:id/complete    — завершить задание
POST /api/operation            — старт операции
PUT  /api/operation/:id/stop   — стоп операции
GET  /api/norms                — нормы по операциям
GET  /api/reports/efficiency   — отчёт эффективности
```
