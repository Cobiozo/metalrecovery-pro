# MetalRecovery Pro — Instrukcja wdrożenia (cyberfolks.pl / Passenger)

## Wymagania serwera
- Node.js ≥ 18
- Phusion Passenger (już skonfigurowany na cyberfolks.pl)

## Kroki wdrożenia

### 1. Pobierz repozytorium
```bash
git clone https://github.com/Cobiozo/metalrecovery-pro.git
cd metalrecovery-pro/deploy
```

### 2. Zainstaluj zależności (minimalne)
```bash
npm install
```

### 3. Skonfiguruj Passenger w cPanel
- W cPanel → **Setup Node.js App**
- **Node.js version**: 18+ (lub najnowsza dostępna)
- **Application mode**: `production`
- **Application root**: katalog `deploy/` w repozytorium (np. `/home/username/metalrecovery-pro/deploy`)
- **Application startup file**: `server.js`
- Kliknij **Create** → następnie **Run NPM Install**

### 4. Zmienne środowiskowe
| Zmienna | Domyślna | Opis |
|---|---|---|
| `PORT` | `3000` | Port serwera (Passenger ustawia automatycznie) |
| `OPENAI_API_KEY` | — | **Wymagany** do funkcji analizy zdjęć (Vision AI) |

Ustaw `OPENAI_API_KEY` w cPanel → **Environment Variables** lub w pliku `.env`.

## Struktura plików
```
server.js      → kompletny serwer standalone (Express + API + frontend) — NIE edytować!
public/        → zbudowany frontend React/Vite (PWA)
package.json   → minimalne zależności runtime
```
> `server.js` jest generowany automatycznie przez skrypt buildowy — nie edytuj go ręcznie.

## Endpointy API
| Endpoint | Metoda | Opis |
|---|---|---|
| `/api/healthz` | GET | Status serwera |
| `/api/metals/prices` | GET | Aktualne ceny metali (NBP) |
| `/api/materials/electronics` | GET | Lista materiałów (Au/Ag/Pt/Pd) |
| `/api/chemicals/processes` | GET | Lista procesów hydrometalurgicznych |
| `/api/calculator/estimate` | POST | Kalkulacja odzysku i opłacalności |
| `/api/vision/analyze` | POST | Analiza zdjęcia przez AI (wymaga OPENAI_API_KEY) |

---

## Jak aktualizować deploy po zmianach kodu

**W Replit:** uruchom skrypt z terminala:
```bash
bash scripts/build-deploy.sh
```
Skrypt:
1. Buduje frontend (Vite) z `BASE_PATH=/` dla Cyberfolks
2. Kopiuje zbudowany frontend do `deploy/public/`
3. Bundluje serwer API (`passenger.ts`) do `deploy/server.js`

Po zakończeniu Replit automatycznie tworzy checkpoint i pushuje zmiany na GitHub.
Cyberfolks pobiera zmiany z GitHuba przy następnym deployu.

---

## Wersja
- Node.js 18+
- Express 4.x (zbudowany w server.js)
- Frontend: React 19 + Vite 7 + TailwindCSS v4 + PWA
