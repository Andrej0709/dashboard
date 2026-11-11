# Dashboard na telefonu — podešavanje

Aplikacija radi i kao web app. Podaci se sinhronizuju preko besplatne Supabase baze,
pa komp i telefon vide isto. Kod je na GitHub-u, Vercel ga hostuje, a Supabase čuva podatke.

## 1. Supabase (baza)

1. Pokreni SQL iz [`supabase/migrations/20261111120000_dashboards.sql`](supabase/migrations/20261111120000_dashboards.sql):
   **SQL Editor** → **New query** → nalepi → **Run**.
   Ako je Supabase povezan sa GitHub-om i sam primenjuje migracije, ovaj fajl će pokupiti i odatle.
   SQL može da se pokrene više puta bez greške.
2. **Authentication** → **Sign In / Providers** → **Email** → isključi **Confirm email** → Save.
3. **Project Settings** → **API Keys** (ili dugme **Connect** gore): zapiši **Project URL** i
   **anon / publishable** ključ. NE uzimaj `service_role` / secret ključ.

## 2. Vercel (web verzija za telefon)

1. Na https://vercel.com: **Add New** → **Project** → izaberi GitHub repo `Andrej0709/dashboard` → **Import**.
2. Framework Preset: **Vite** (Vercel ga sam prepozna). Build Command `npm run build`, Output Directory `dist`.
3. Otvori **Environment Variables** i dodaj dve promenljive:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon / publishable ključ
4. **Deploy**. Dobiješ link tipa `https://dashboard-xxx.vercel.app`.

Ako si dodao promenljive posle prvog deploy-a: **Deployments** → poslednji → ⋯ → **Redeploy**
(ključevi se ugrađuju u aplikaciju tokom build-a).
Svaki novi push na GitHub automatski pravi novu verziju sajta.

## 3. Desktop aplikacija (Electron)

U folderu aplikacije napravi fajl `.env.local` (kopija `.env.example`) sa iste dve vrednosti, pa:

```
npm run package
```

Novi `.exe` je u `release/Glassy Dashboard-win32-x64/`. `.env.local` se ne šalje na GitHub.

## 4. Prijava

1. **Na kompu:** Settings → *Sync across devices* → email i lozinka → **Create account**.
   Tvoji postojeći podaci se odmah šalju na nalog.
2. **Na telefonu:** otvori Vercel link.
   - iPhone (Safari): dugme Share → **Add to Home Screen**
   - Android (Chrome): meni ⋮ → **Add to Home screen** / **Install app**
3. Otvori aplikaciju sa početnog ekrana → Settings → isti email i lozinka → **Sign in**.

## 5. Zaključaj nalog (preporučeno)

Kad napraviš svoj nalog: Supabase → **Authentication** → **Sign In / Providers** →
isključi **Allow new users to sign up**. Tako niko drugi ne može da napravi nalog u tvojoj bazi.

## Dobro je znati

- Tačkica na avataru gore desno: zelena = sinhronizovano, žuta = šalje, crvena = nema neta/greška, siva = nisi prijavljen.
- Bez interneta sve radi. Izmene se pošalju kad se veza vrati.
- Ako oba uređaja menjaju nešto u isto vreme, stavke se spajaju i ništa se ne briše.
  Jedini izuzetak: stavka obrisana na jednom uređaju dok je drugi bio offline i menjao podatke može da se vrati.
- Pozadina, blur i tamnoća panela su posebni za svaki uređaj.
- Besplatan Supabase projekat se pauzira posle 7 dana bez ikakvog korišćenja.
  Ako se to desi, uđi na supabase.com i klikni **Restore**. Podaci ostaju.
