# Steam V2

Web aplikacija za upravljanje bazom podataka digitalne trgovine videoigara
inspirirane Steam platformom.  
Projekt omogućava upravljanje korisnicima, igrama i bibliotekama kroz web
sučelje razvijeno pomoću Bun, Hono, MongoDB i TypeScript tehnologija.

---

## Funkcionalnosti

- Upravljanje korisnicima (dodavanje, uređivanje, brisanje)
- Upravljanje katalogom igara
- Upravljanje zapisima korisničke biblioteke
- Pregled statistike na početnoj stranici
- CRUD operacije nad bazom podataka
- Server-side prikaz stranica (JSX)
- Bootstrap UI dizajn
- Validacija podataka pomoću Zod shema

---

## Tehnologije

Projekt koristi sljedeće tehnologije:

- Bun
- Hono
- TypeScript
- MongoDB (službeni driver)
- Zod
- JSX
- Bootstrap 5

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
bun install
```

### 4. Konfiguracija okruženja

```bash
cp .env.example .env
```

U `.env` postavite connection string i naziv baze:

- `MONGODB_URI` - connection string prema MongoDB
- `MONGODB_DB_NAME` - naziv baze
- `PORT` - port aplikacije (opcionalno, zadano 3000)

### 5. Pokretanje aplikacije

```bash
bun run dev
```

Za pokretanje bez hot reloada: `bun run start`.

---

## Autori

- Dragan Arapović
- Leo Petrović
- Vedran Marić
- Ante Pavlović
