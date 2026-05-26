# Steam V2

Web aplikacija za upravljanje bazom podataka digitalne trgovine videoigara
inspirirane Steam platformom.  
Projekt omogućava upravljanje korisnicima, igrama i bibliotekama kroz web
sučelje razvijeno pomoću Node.js, Hono, TypeScript tehnologija, s podrškom za
MongoDB i PostgreSQL.

---

## Funkcionalnosti

- Upravljanje korisnicima (dodavanje, uređivanje, brisanje)
- Upravljanje katalogom igara
- Upravljanje zapisima korisničke biblioteke
- Pregled statistike na početnoj stranici
- CRUD operacije nad bazom podataka
- Prebacivanje između MongoDB i PostgreSQL baze putem prekidača u navigaciji
- Server-side prikaz stranica (JSX)
- Bootstrap UI dizajn
- Validacija podataka pomoću Zod shema

---

## Tehnologije

Projekt koristi sljedeće tehnologije:

- Node.js
- Hono
- TypeScript
- MongoDB (službeni driver)
- PostgreSQL (`pg` driver)
- Docker Compose (lokalni PostgreSQL)
- Zod
- JSX
- Bootstrap 5

---

## Arhitektura baza podataka

Aplikacija koristi repository sloj koji skriva razlike između baza podataka.
Isti CRUD sučelj i forme rade nad obje baze — korisnik bira aktivnu bazu
prekidačem u navigacijskoj traci (MongoDB / PostgreSQL).

- **MongoDB** — dokumentna shema s ugrađenim developer/publisher podacima
- **PostgreSQL** — normalizirana relacijska shema definirana u `postgres.sql`

Podaci se ne sinkroniziraju automatski; prekidač određuje koja baza se koristi
za trenutnu sesiju.

---

## Instalacija projekta

### 1. Kloniranje repozitorija

```bash
git clone https://github.com/DraganArapovic/steam-database-manager.git
```

### 2. Ulazak u direktorij projekta

```bash
cd steam-database-manager
```

### 3. Instalacija dependency paketa

```bash
npm install
```

### 4. Konfiguracija okruženja

```bash
cp .env.example .env
```

U `.env` postavite varijable okruženja:

- `MONGODB_URI` — connection string prema MongoDB
- `MONGODB_DB_NAME` — naziv MongoDB baze
- `POSTGRES_URL` — connection string prema PostgreSQL (npr. `postgresql://steam_admin:admin_pass@localhost:5432/steamdb`)
- `PORT` — port aplikacije (opcionalno, zadano 3000)

### 5. Pokretanje PostgreSQL baze (Docker)

Lokalni PostgreSQL se pokreće pomoću Docker Composea. Pri prvom pokretanju
automatski se izvršava `postgres.sql`, koji kreira tablice, korisnike i
početne podatke.

```bash
docker compose up -d postgres
```

Docker Compose postavlja:

- bazu: `steamdb`
- aplikacijski korisnik: `steam_admin` / `admin_pass` (CRUD)
- gost korisnik: `steam_guest` / `guest_pass` (samo čitanje)

### 6. Pokretanje aplikacije

```bash
npm run dev
```

Za pokretanje bez hot reloada: `npm run start`.

Aplikacija je dostupna na `http://localhost:3000`. Zadano se koristi MongoDB;
PostgreSQL se aktivira prekidačem u navigacijskoj traci.

---

## Autori

- Dragan Arapović
- Leo Petrović
- Vedran Marić
- Ante Pavlović
