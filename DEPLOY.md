# Deploy Guide

## 1. Supabase — настройка базы данных

1. Открой supabase.com → твой проект
2. Слева меню → **SQL Editor**
3. Скопируй содержимое файла `supabase/schema.sql` и нажми **Run**
4. Таблицы созданы. Теперь получи ключи:
   - Settings → API → скопируй **Project URL** и **Publishable key**

## 2. GitHub — загрузка кода

Открой терминал в папке проекта:

```bash
git init
git add .
git commit -m "Initial JDM site"
git remote add origin https://github.com/ВАШ_ЮЗЕРНЕЙМ/ВАШ_РЕПО.git
git push -u origin main
```

Создай репо на github.com если ещё нет: New repository → назови jdm-site → Create.

## 3. Cloudflare Pages — деплой

1. Открой dash.cloudflare.com
2. Слева → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Выбери GitHub аккаунт → выбери репозиторий `jdm-site`
4. Настройки билда:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
5. **Environment Variables** → Add:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://твой-проект.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = твой_publishable_key
   ```
6. Нажми **Save and Deploy**

Деплой занимает 2-3 минуты. После этого сайт доступен по адресу `*.pages.dev`.

## 4. Подключение домена

1. Cloudflare Pages → твой проект → **Custom domains**
2. Введи свой домен → **Begin setup**
3. Так как домен уже на Cloudflare DNS — привяжется автоматически за 1 минуту

## 5. Заполнение контентом (Supabase)

В Supabase → **Table Editor**:

### Добавить машину:
- Таблица `cars` → Insert row
- Заполни: title, slug (например `honda-s2000`), brand, description, is_published: true

### Добавить фото:
- Таблица `gallery_photos` → Insert row
- car_id: ID из таблицы cars
- url: ссылка на фото (загружай в Supabase Storage или Cloudflare R2)
- orientation: `vertical` или `horizontal`
- show_on_home: true (чтобы показывалось на главной)

### Настройки сайта:
- Таблица `site_settings` → редактируй единственную строку
- Вставь свои ссылки на TikTok, YouTube, Instagram

## 6. Хранилище фотографий (опционально — Cloudflare R2)

1. Cloudflare → R2 → Create bucket → назови `jdm-photos`
2. Settings → Custom domain → привяжи поддомен типа `cdn.твойдомен.com`
3. Загружай фото туда, используй URL вида `https://cdn.твойдомен.com/фото.jpg`

## Последующие деплои

После изменений в коде:
```bash
git add .
git commit -m "описание изменений"
git push
```
Cloudflare автоматически пересоберёт и задеплоит.
