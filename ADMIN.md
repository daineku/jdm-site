# Admin Panel Setup

## 1. Supabase — отключи RLS для записи

Зайди в Supabase → SQL Editor → выполни:

```sql
alter table site_settings disable row level security;
alter table cars disable row level security;
alter table gallery_photos disable row level security;
alter table builds disable row level security;
alter table accessories disable row level security;
alter table videos disable row level security;
alter table racing_games disable row level security;
```

## 2. Cloudflare R2 — создай bucket

1. dash.cloudflare.com → R2 Object Storage → Create bucket
2. Название: `jdm-photos`
3. После создания: Settings → Public Access → Allow Access → скопируй Public URL (вида `https://pub-xxx.r2.dev`)
4. Главная R2 страница → Manage R2 API Tokens → Create API Token:
   - Permissions: Object Read & Write
   - Scope: конкретный bucket `jdm-photos`
   - Скопируй: Access Key ID и Secret Access Key
5. Account ID: правый сайдбар на главной странице Cloudflare

## 3. Vercel — добавь переменные окружения

Vercel → твой проект → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `R2_ACCOUNT_ID` | твой Account ID из Cloudflare |
| `R2_ACCESS_KEY_ID` | Access Key ID из R2 API Token |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key из R2 API Token |
| `R2_BUCKET_NAME` | `jdm-photos` |
| `R2_PUBLIC_URL` | `https://pub-xxx.r2.dev` (без слэша в конце) |
| `ADMIN_SECRET_PATH` | придумай случайную строку, например `x7k2p9m4` |

## 4. Задеплой

```bash
git add .
git commit -m "add admin panel"
git push
```

## 5. Открой админку

После деплоя — зайди по адресу:
```
https://твойдомен.com/ADMIN_SECRET_PATH
```

Например если ADMIN_SECRET_PATH = `x7k2p9m4`:
```
https://daineku.com/x7k2p9m4
```

## Как добавить первую машину

1. Открой админку
2. Вкладка **Cars** → заполни Title, Brand, Description → Add Car
3. Вкладка **Photos** → выбери машину → загрузи фото (drag & drop или кнопка)
4. На каждом фото нажми **○ Home** чтобы показывалось на главной
5. Проверь orientation — если определилась неверно, нажми кнопку переключения
6. Зайди на главную — должна появиться галерея
