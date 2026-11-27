# Сајт за car detailing (шаблон)

Next.js landing страница за детејлери: мобилни или со студио. Сè за еден клиент се менува во **една датотека**: `site.config.ts`.

## Пуштање

```bash
npm install
npm run dev
```

Отвори http://localhost:3000

## Нов клиент за 15 минути

1. Отвори `site.config.ts` и смени:
   - `mode`: `"mobile"` (одат кај клиентот) или `"studio"` (имаат локација). Ги менува насловот, чекорите, ЧПП и футерот.
   - `business`: име, прва буква за логото, град, адреса, градови што ги покриваат, години искуство, работно време.
   - `contact`: телефон (само бројки со `1` напред), WhatsApp, е-пошта, линк за резервации (ако користат Square, Calendly, Urable…), Instagram, Facebook, линк до Google рецензии.
   - `theme.accent`: бојата на брендот. Сите копчиња и акценти се прилагодуваат сами.
   - `rating`: оценка и број на рецензии од Google.
   - `services`, `calculator`: услуги и цени за калкулаторот.
   - `reviews`, `faq`: вистински рецензии и прашања.
2. Слики и видео ги ставаш во `public/`:
   - `public/video/hero.mp4` → во config: `hero.video: "/video/hero.mp4"` (кратко, тивко видео, до ~8 MB).
   - `public/images/...` → за услугите (`image`), пред/после (`before`, `after`) и `hero.poster`.
3. `npm run build` за проверка, потоа објави.

## Твојата страница со пакети (/for-detailers/)

`app/for-detailers` е **твојата** продажна страница за детејлерите: 2 пакети, цени и формулар што ти праќа SMS. Сè се менува во `offer.config.ts` (цени, месечна такса, попуст за првите клиенти, твој телефон).

На демо страницата горе има лента „This is a demo… Get this website“ што води до пакетите.

**Кога правиш сајт за вистински клиент:** во `offer.config.ts` стави `showDemoBanner: false` и избриши ја папката `app/for-detailers`.

## Објавување

Најлесно е на **Vercel**: качи го проектот на GitHub → vercel.com → Import → Deploy. Потоа го поврзуваш доменот на клиентот.

## Структура

```
site.config.ts        ← сите податоци за клиентот
app/layout.tsx        ← фонтови, SEO, бои
app/page.tsx          ← редоследот на секциите
app/globals.css       ← целиот дизајн
components/           ← секциите (Hero, PriceCalculator, BeforeAfter, Booking…)
lib/                  ← бои и линкови
```

## Како работи формата за резервација

Нема потреба од сервер. Формата отвора SMS кон детејлерот со сите податоци веќе пополнети (име, возило, услуга, проценка од калкулаторот, датум). Ако не работи, нуди испраќање по е-пошта. Копчето „Book this detail“ во калкулаторот ја пополнува формата автоматски.

## Админ панел (/admin/)

Без поставување (како сега на GitHub Pages) админот работи во **демо режим**: клиентите можат да го пробаат, но ништо не се зачувува.

### Еднаш за сè (твојот Supabase)
1. Направи бесплатен проект на supabase.com.
2. **SQL Editor** → залепи го целиот `supabase/schema.sql` → Run.
3. Во истиот SQL Editor стави го твојот email како главен админ:
   `insert into platform_admins (email) values ('tvojot@email.com');`
4. **Authentication → URL Configuration**: во *Redirect URLs* додај го доменот на секој клиент, на пр. `https://shineprodetailing.com/admin/`.
5. **Project Settings → API**: ќе ти требаат *Project URL* и *anon public* клучот (тие се јавни, смеат да одат на сајтот). *service_role* клучот никогаш не го ставај никаде.

### Нов клиент со админ
1. SQL Editor:
   ```sql
   insert into sites (slug, name, plan) values ('shine-pro', 'Shine Pro Detailing', 'admin') returning id;
   insert into site_members (site_id, email, role) values ('<id-od-gore>', 'klient@email.com', 'owner');
   ```
   (`plan = 'basic'` = клиентот гледа само барања за резервација.)
2. Netlify → *Add new site → Import from GitHub* → овој repo. Build command `npm run build`, publish directory `out`.
3. Netlify → *Site configuration → Environment variables*:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public клучот
   - `NEXT_PUBLIC_SITE_ID` = id-то на сајтот од чекор 1
4. Netlify → *Build & deploy → Build hooks* → направи hook, па во Supabase **Table Editor → sites** залепи го линкот во колоната `build_hook`. Така копчето **Publish** во админот го обновува сајтот (~2 минути).
5. Поврзи го доменот на клиентот во Netlify. Клиентот влегува на `нивниотдомен.com/admin`, пишува email и добива линк.

### Email за нови резервации
1. Направи акаунт на resend.com и потврди го твојот домен (за тест праќа само до твојот email).
2. Supabase → **Edge Functions** → deploy `supabase/functions/notify-booking` (или `supabase functions deploy notify-booking --no-verify-jwt`).
3. Edge Functions → **Secrets**: `RESEND_API_KEY`, `FROM_EMAIL` (на пр. `Bookings <bookings@tvojdomen.com>`), `WEBHOOK_SECRET` (било каков долг текст).
4. **Database → Webhooks** → нов webhook: табела `bookings`, настан *Insert*, тип *Supabase Edge Function* → `notify-booking`, header `x-webhook-secret` = истиот WEBHOOK_SECRET.

Детејлерот добива email за секое барање, а клиентот (ако остави email) добива „We got your request“.

### Барања за пристап
Новите детејлери кликаат *Request access* на /admin. Ги гледаш во **Table Editor → access_requests**, па ги додаваш со чекорите „Нов клиент“.
