# НОВОСТИ СЕКУНДЫ

Новостной сайт с публикацией материалов от читателей и модерацией через админ-панель.
Разделы: **Новости**, **Анекдоты**, **Погода**.

- **Frontend:** React 18 + Vite + React Router + Tailwind CSS + axios + Lucide React
- **Backend:** Node.js + Express + JWT + bcrypt + express-validator
- **База данных и хранилище:** PostgreSQL и Storage в Supabase
- **Деплой:** клиент — GitHub Pages, сервер — Railway или Render

---

## Возможности

**Публичная часть**

- Главная страница: главный материал в блоке «Главное сейчас» и лента новостей в три колонки
- Бегущая строка со свежими заголовками под шапкой
- Вкладки категорий: Новости, Анекдоты, Погода
- Поиск с мгновенной фильтрацией (запрос уходит с задержкой в 300 мс)
- Страница статьи: счётчик просмотров и комментарии
- Пагинация и кнопка «Показать ещё»

**Авторизация**

- Регистрация с хешированием пароля через bcrypt
- Вход выдаёт JWT, токен хранится в `localStorage`
- Защищённые маршруты: отправка новости, «Мои новости», закладки, админ-панель

**Для авторизованных пользователей**

- Отправка своей новости: заголовок, текст, категория, загрузка изображения
- Отслеживание статуса своих материалов: на модерации / одобрено / отклонено
- Комментарии к статьям
- Закладки

**Админ-панель** (`/admin`, только для роли `admin`)

- Обзор: пользователи, материалы на модерации, всего статей, просмотры, комментарии
- Модерация: предпросмотр, одобрение и отклонение
- Пользователи: блокировка, разблокировка, смена роли
- Все статьи: редактирование и удаление

---

## Структура проекта

```
client/                    React-приложение
  src/
    api/axios.js           экземпляр axios с интерцепторами
    components/            Navbar, NewsCard, Ticker, SearchBar, AdminSidebar и другие
    context/AuthContext.jsx состояние авторизации и JWT
    hooks/useArticleFeed.js лента: поиск, страницы, дозагрузка
    layouts/               каркас публичной части
    pages/                 Home, Jokes, Weather, Article, Login, Register, Submit, ...
    pages/admin/           AdminLayout, AdminDashboard, AdminPending, AdminArticles, AdminUsers
    utils/format.js        форматирование дат, склонения, подписи категорий
server/                    Express API
  controllers/             логика маршрутов
  db/supabase.js           клиент Supabase (service role)
  db/schema.sql            схема БД, бакет и функция инкремента просмотров
  middleware/              authMiddleware, adminMiddleware, validate, errorHandler
  routes/                  auth.js, articles.js, admin.js, comments.js, upload.js
  index.js                 точка входа
.github/workflows/         деплой клиента на GitHub Pages
render.yaml                описание сервиса для Render
```

---

## Локальный запуск

### 1. Подготовка Supabase

1. Создайте проект на [supabase.com](https://supabase.com).
2. Откройте **SQL Editor** и выполните содержимое файла [`server/db/schema.sql`](server/db/schema.sql).
   Скрипт создаёт таблицы `users`, `articles`, `comments`, `bookmarks`, функцию
   `increment_article_views` и публичный бакет `article-images`.
3. В **Project Settings → API** скопируйте `Project URL` и ключ `service_role`.

> Ключ `service_role` даёт полный доступ к базе. Он используется только на сервере
> и никогда не попадает в клиентскую сборку.

### 2. Сервер

```bash
cd server
cp .env.example .env      # заполните SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm install
npm run dev               # http://localhost:4000
```

Проверка: `curl http://localhost:4000/api/health`

### 3. Клиент

```bash
cd client
cp .env.example .env      # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev               # http://localhost:5173
```

### 4. Назначение администратора

Зарегистрируйтесь на сайте, затем выполните в SQL Editor Supabase:

```sql
update public.users set role = 'admin' where email = 'ваш@email';
```

После повторного входа в шапке появится ссылка «Админ-панель».

---

## Переменные окружения

### `server/.env`

| Переменная                  | Описание                                                     |
| --------------------------- | ------------------------------------------------------------ |
| `PORT`                      | Порт HTTP-сервера (по умолчанию 4000)                        |
| `NODE_ENV`                  | `development` или `production`                               |
| `SUPABASE_URL`              | URL проекта Supabase                                         |
| `SUPABASE_SERVICE_ROLE_KEY` | Сервисный ключ Supabase, только для сервера                  |
| `SUPABASE_STORAGE_BUCKET`   | Бакет для картинок статей (`article-images`)                 |
| `JWT_SECRET`                | Секрет для подписи токенов, длинная случайная строка          |
| `JWT_EXPIRES_IN`            | Срок жизни токена, например `7d`                             |
| `CORS_ORIGIN`               | Разрешённые источники через запятую                          |

### `client/.env`

| Переменная       | Описание                                                        |
| ---------------- | --------------------------------------------------------------- |
| `VITE_API_URL`   | Базовый адрес API, например `http://localhost:4000/api`         |
| `VITE_BASE_PATH` | Базовый путь сборки; для GitHub Pages — `/<имя-репозитория>/`   |

---

## API

Все ответы в формате JSON. Защищённые маршруты требуют заголовок
`Authorization: Bearer <token>`.

### Аутентификация

| Метод  | Маршрут              | Доступ | Описание                          |
| ------ | -------------------- | ------ | --------------------------------- |
| `POST` | `/api/auth/register` | —      | Регистрация, возвращает токен     |
| `POST` | `/api/auth/login`    | —      | Вход, возвращает токен            |
| `GET`  | `/api/auth/me`       | Токен  | Текущий пользователь              |

### Статьи

| Метод  | Маршрут                        | Доступ | Описание                                        |
| ------ | ------------------------------ | ------ | ----------------------------------------------- |
| `GET`  | `/api/articles`                | —      | Одобренные статьи: `page`, `limit`, `category`, `search` |
| `GET`  | `/api/articles/featured`       | —      | Главный материал                                |
| `GET`  | `/api/articles/ticker`         | —      | Заголовки для бегущей строки                    |
| `GET`  | `/api/articles/:id`            | —      | Одна статья, увеличивает счётчик просмотров     |
| `POST` | `/api/articles`                | Токен  | Отправка материала на модерацию                 |
| `GET`  | `/api/articles/mine`           | Токен  | Свои материалы со всеми статусами               |
| `GET`  | `/api/articles/bookmarks/list` | Токен  | Закладки                                        |
| `POST` | `/api/articles/:id/bookmark`   | Токен  | Добавить или убрать закладку                    |

### Комментарии

| Метод    | Маршрут                            | Доступ | Описание                          |
| -------- | ---------------------------------- | ------ | --------------------------------- |
| `GET`    | `/api/comments/article/:articleId` | —      | Комментарии к статье              |
| `POST`   | `/api/comments`                    | Токен  | Добавить комментарий              |
| `DELETE` | `/api/comments/:id`                | Токен  | Удалить свой; админ — любой       |

### Загрузка файлов

| Метод  | Маршрут       | Доступ | Описание                                       |
| ------ | ------------- | ------ | ---------------------------------------------- |
| `POST` | `/api/upload` | Токен  | `multipart/form-data`, поле `image`, до 5 МБ   |

### Администрирование (роль `admin`)

| Метод    | Маршрут                          | Описание                                  |
| -------- | -------------------------------- | ----------------------------------------- |
| `GET`    | `/api/admin/stats`               | Статистика                                |
| `GET`    | `/api/admin/articles`            | Все статьи: `status`, `search`            |
| `PATCH`  | `/api/admin/articles/:id/status` | Одобрить или отклонить                    |
| `PUT`    | `/api/admin/articles/:id`        | Редактировать статью                      |
| `DELETE` | `/api/admin/articles/:id`        | Удалить статью                            |
| `GET`    | `/api/admin/users`               | Список пользователей                      |
| `PATCH`  | `/api/admin/users/:id/role`      | Сменить роль                              |
| `PATCH`  | `/api/admin/users/:id/ban`       | Заблокировать или разблокировать          |

---

## Деплой

### Сервер на Railway

1. На [railway.app](https://railway.app) создайте проект из этого репозитория.
2. В настройках сервиса укажите **Root Directory**: `server`.
3. Команды: build — `npm ci`, start — `npm start`. Railway сам подставляет `PORT`.
4. Во вкладке **Variables** задайте: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_STORAGE_BUCKET`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=production`
   и `CORS_ORIGIN=https://<username>.github.io`.
5. Включите **Generate Domain** и проверьте `https://<домен>/api/health`.

### Сервер на Render

Разворачивание в один клик по готовому [`render.yaml`](render.yaml):

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/WingedSaga/news-seconds)

Render сам создаст сервис с нужными командами сборки и запуска и сгенерирует
`JWT_SECRET`. Останется вписать три значения: `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` и `CORS_ORIGIN`.

Вручную: Web Service с **Root Directory** `server`, build `npm ci`,
start `npm start`. Переменные окружения те же, что и для Railway.

### Клиент на GitHub Pages

1. **Settings → Pages → Build and deployment → Source**: выберите `GitHub Actions`.
2. **Settings → Secrets and variables → Actions → Variables**: при необходимости
   задайте переменную `VITE_API_URL` со значением `https://<адрес-бэкенда>/api`.
   Если переменной нет, workflow подставит адрес по умолчанию, указанный в нём же.
3. Отправьте изменения в ветку `main` — workflow
   [`.github/workflows/deploy-client.yml`](.github/workflows/deploy-client.yml)
   соберёт клиент и опубликует его.
4. Сайт будет доступен по адресу `https://<username>.github.io/<имя-репозитория>/`.

Workflow сам подставляет `VITE_BASE_PATH=/<имя-репозитория>/` и копирует
`index.html` в `404.html`, чтобы прямые ссылки вида `/article/:id` открывались
корректно на статическом хостинге.

После деплоя клиента добавьте его адрес в `CORS_ORIGIN` на сервере.

---

## Оформление

Светлая тема, зелёная палитра:

| Назначение          | Цвет      |
| ------------------- | --------- |
| Основной            | `#2E7D32` |
| Наведение           | `#43A047` |
| Акцент              | `#A5D6A7` |
| Фон                 | `#F5F5F5` |
| Сайдбар админки     | `#1B5E20` |

Интерфейс без эмодзи, все иконки — из библиотеки Lucide React. Шапка закреплена
сверху: логотип слева, навигация по центру, кнопки авторизации справа. Активная
вкладка подчёркнута зелёной линией. Кнопка «Вход» с зелёной обводкой,
«Регистрация» — залитая зелёным. Вёрстка адаптивная, на мобильных доступно
меню-гамбургер.

---

## Команды

```bash
# клиент
cd client
npm run dev       # разработка
npm run build     # production-сборка в client/dist
npm run preview   # просмотр собранной версии
npm run lint      # проверка ESLint

# сервер
cd server
npm run dev       # запуск с автоперезагрузкой
npm start         # production-запуск
```
