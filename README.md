# AsilKino 🎬

Asilmedia.org uslubida qilingan onlayn kinoteatr. Ichida tarjima kinolar, seriallar, multfilmlar, premyeralar, treylerlar, filtrlar, **tasodifiy kino** tanlash va **Admin panel** bor.

Texnologiyalar: **Next.js (App Router) + TypeScript + Tailwind CSS v4 + Supabase (ixtiyoriy)**.

## Ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda oching: http://localhost:3000

## Ikki xil rejim

| Rejim | Qachon ishlaydi | Ma'lumotlar qayerda saqlanadi |
|------|-----------------|-------------------------|
| **Demo (LocalStorage)** | `.env.local` bo'lmasa (standart holat) | Brauzeringizda. 12 ta demo kino oldindan qo'shilgan |
| **Supabase** | `.env.local` da Supabase kalitlari yozilgan bo'lsa | Supabase Postgres bazasida (hamma tashrif buyuruvchilar bir xil ma'lumotni ko'radi) |

### Admin panel — `/admin`
- Demo rejimda parol: `admin123` (`NEXT_PUBLIC_ADMIN_PASSWORD` orqali o'zgartirsa bo'ladi). ⚠️ Bu himoya faqat namuna uchun, chunki ma'lumotlar baribir brauzerda turadi.
- Supabase rejimida kirish Supabase Auth (email + parol) orqali bo'ladi. Admin bo'lish uchun foydalanuvchida `app_metadata.role = "admin"` turishi kerak. Ruxsatlarni bazadagi RLS siyosatlari tekshiradi.

## Supabase'ni ulash (haqiqiy sayt uchun)

1. https://supabase.com da **yangi** loyiha oching.
2. SQL Editor'ni oching va [`supabase/schema.sql`](supabase/schema.sql) faylini ishga tushiring.
3. `.env.example` faylidan nusxa olib `.env.local` yarating, keyin URL va publishable key'ni yozing.
4. Authentication → Users bo'limida admin foydalanuvchi yarating. Keyin SQL Editor'da quyidagini bajaring:
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
   where email = 'sizning@email.uz';
   ```
5. `npm run dev` ni qayta ishga tushiring. Endi kinolarni `/admin` sahifasidan qo'shasiz.

## Sahifalar

- `/` — bosh sahifa: slayder, yangi kinolar, premyeralar, eng ko'p ko'rilganlar va bo'limlar
- `/kinolar` — katalog: qidiruv, tur, janr, yil, davlat bo'yicha filtr va saralash
- `/kino/[slug]` — kino sahifasi: pleer, serial qismlari, treyler, yuklab olish tugmalari va o'xshash kinolar
- `/random` — tasodifiy kino (filtr va minimal reyting bilan)
- `/admin` — kino va qismlarni qo'shish, tahrirlash, o'chirish

## Video haqida

Video maydoniga to'g'ridan-to'g'ri MP4/WebM havola, YouTube havola yoki istalgan embed (iframe) havolani qo'yish mumkin. Demo videolar Google'ning ochiq namuna videolari va Blender Foundation'ning erkin litsenziyali filmlaridan olingan.

> ⚖️ Faqat tarqatish huquqi sizda bo'lgan yoki erkin litsenziyali kontentni joylang.
