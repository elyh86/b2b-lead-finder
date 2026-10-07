# B2B Lead Finder

Een gratis-beta voor lokale prospectie met open data van OpenStreetMap, een lichte CRM-werkruimte en Prisma/SQLite.

## Lokaal starten

1. Installeer Node.js 20.9 of hoger.
2. Kopieer `.env.example` naar `.env` en vervang `AUTH_SECRET` door een willekeurige secret. Voor zoeken zijn geen API-sleutels nodig.
3. Installeer pakketten met `npm install`.
4. Maak het lokale SQLite-schema met `npm run db:push`.
5. Maak de demoaccounts met `npm run db:seed-demo`. De opdracht toont twee nieuwe wachtwoorden; bewaar ze meteen.
6. Start met `npm run dev` en open `http://localhost:3000`.

De seed maakt uitsluitend lokale SQLite-demoaccounts aan en weigert te draaien in productie of tegen PostgreSQL. De accounts zijn `admin@b2b-lead-finder.test` (rol Admin) en `klant@b2b-lead-finder.test` (rol Klant). Elke seedrun roteert hun wachtwoorden.

Nieuwe accounts krijgen 50 gratis credits. Elke nieuwe lead kost 1 credit; een lege zoekopdracht is gratis. Elke scan is begrensd op 20 resultaten. Locaties worden gevonden met Photon en bedrijven met Overpass, beide op basis van OpenStreetMap-data. Beoordelingen en reviewaantallen zijn niet beschikbaar in deze bron. De publieke diensten zijn gratis zonder sleutel, maar gedeeld, kennen fair-use-beperkingen en bieden geen uptimegarantie. De dekking verschilt per plaats en branche; zoek daarom per stad of plaats. Data valt onder de ODbL; de app toont OpenStreetMap-attributie.

De S+-modus vereist een exact herkende OSM-branchetag, een openbaar telefoonnummer en e-mailadres, én geen websitevermelding in OSM. S betekent een exacte branchetag met minimaal een van beide contactkanalen en evenmin een websitevermelding; A/B zijn bredere matches of bedrijven met een websitevermelding. Grades meten alleen de beschikbare OSM-data: niet-vermeld betekent niet bewezen afwezig, en contactgegevens of bedrijfsactiviteit zijn niet onafhankelijk geverifieerd.

## Beta en betalingen

De productervaring is momenteel gratis: nieuwe accounts krijgen 50 zoekcredits en de betaalde plannen/checkout zijn niet zichtbaar. De Stripe-routes en configuratie zijn alleen voorbereid voor later; stel geen prijzen in voordat dekking, contactkwaliteit en terugkerend gebruik met echte gebruikers zijn gevalideerd.

## Productie

Gebruik voor productie een beheerde database, HTTPS, sterke secrets en monitoring. Photon en Overpass zijn publieke gemeenschapsdiensten zonder SLA; houd het gebruik bescheiden en cache resultaten. Bij veel gebruikers of hogere volumes moet je een eigen Photon- en Overpass-instance of een andere gehoste provider gebruiken. Voer `npm run build` uit voor een productiebuild. Regel ook back-ups, privacy-/toestemmingsteksten en bewaartermijnen. OpenStreetMap-data is beschikbaar onder de ODbL; controleer de toepasselijke attributie- en share-alike-verplichtingen voor je gebruik.
