# B2B Lead Finder

Een Next.js-app voor lokale B2B-leadgeneratie met Google Places, Prisma/PostgreSQL, accountsessies en Stripe-abonnementen.

## Lokaal starten

1. Installeer Node.js 20.9 of hoger.
2. Kopieer `.env.example` naar `.env` en vervang `AUTH_SECRET` door een willekeurige secret.
3. Installeer pakketten met `npm install`.
4. Maak het lokale SQLite-schema met `npm run db:push`.
5. Maak de demoaccounts met `npm run db:seed-demo`. De opdracht toont twee nieuwe wachtwoorden; bewaar ze meteen.
6. Start met `npm run dev` en open `http://localhost:3000`.

De seed maakt uitsluitend lokale SQLite-demoaccounts aan en weigert te draaien in productie of tegen PostgreSQL. De accounts zijn `admin@b2b-lead-finder.test` (rol Admin) en `klant@b2b-lead-finder.test` (rol Klant). Elke seedrun roteert hun wachtwoorden.

Nieuwe accounts krijgen 50 gratis credits. Elke gevonden lead kost 1 credit; een lege zoekopdracht is gratis. Elke Places-scan is begrensd op 20 resultaten. Google Places is een betaald gebruiksproduct en kan een actief Cloud Billing-account vereisen.

## Stripe instellen

Maak in Stripe maandelijkse prijzen van EUR 19 (Starter) en EUR 49 (Pro). Zet de Price IDs in `STRIPE_STARTER_PRICE_ID` en `STRIPE_PRO_PRICE_ID`, en vul `STRIPE_SECRET_KEY` in. Configureer een webhook naar `/api/stripe/webhook` voor `checkout.session.completed`, `invoice.paid` en `customer.subscription.deleted`; bewaar de signing secret als `STRIPE_WEBHOOK_SECRET`.

Starter voegt 1.000 credits toe na een betaalde factuur. Pro schakelt onbeperkt zoeken in. Webhookhandtekeningen worden server-side gecontroleerd en dubbele Starter-facturen worden door een unieke databaseconstraint niet dubbel toegekend.

## Productie

Gebruik voor productie een beheerde PostgreSQL-database, HTTPS, sterke secrets, een beperkt Google API-key en ingestelde Stripe live-prijzen/webhooks. Zet in `prisma/schema.prisma` de datasource-provider op `postgresql`, stel `DATABASE_URL` in en maak voor die database een migratie voordat je `npm run db:deploy` gebruikt. Voer `npm run build` uit voor een productiebuild. Regel ook monitoring, back-ups, privacy-/toestemmingsteksten en bewaartermijnen. De app gebruikt de officiële Places API; controleer de toepasselijke Google Maps Platform-voorwaarden voor je gebruik en opslag van gegevens.
