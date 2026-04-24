# MetalRecovery Pro — Instrukcja wdrożenia (cyberfolks.pl / Passenger)

## Wymagania serwera
- Node.js ≥ 18
- Phusion Passenger (już skonfigurowany na cyberfolks.pl)

## Kroki wdrożenia

### 1. Pobierz repozytorium
```bash
git clone https://github.com/Cobiozo/metalrecovery-pro.git
cd metalrecovery-pro
```

### 2. Zainstaluj zależności
```bash
npm install
```

### 3. Skonfiguruj Passenger w cPanel
- W cPanel → **Setup Node.js App**
- **Node.js version**: 18+ (lub najnowsza dostępna)
- **Application mode**: `production`
- **Application root**: katalog aplikacji (np. `/home/username/metalrecovery-pro`)
- **Application startup file**: `server.js`
- Kliknij **Create** → następnie **Run NPM Install**

### 4. Ustaw URL API w frontend (jeśli potrzeba)
Jeśli backend i frontend są na tej samej domenie, żadna konfiguracja nie jest wymagana — API jest serwowane pod `/api/*`.

## Struktura plików
```
server.js          → punkt wejścia Passenger (Express 4, CJS)
api-bundle.cjs     → skompilowane trasy API
public/            → zbudowany frontend (Vite SPA)
package.json       → zależności produkcyjne
```

## Endpointy API
| Endpoint | Metoda | Opis |
|---|---|---|
| `/api/healthz` | GET | Status serwera |
| `/api/metals/prices` | GET | Aktualne ceny metali (NBP) |
| `/api/materials/electronics` | GET | Lista 61 materiałów (Au/Ag/Pt/Pd) |
| `/api/chemicals/processes` | GET | Lista 9 procesów hydrometalurgicznych |
| `/api/calculator/estimate` | POST | Kalkulacja odzysku i opłacalności |

## Zmienne środowiskowe (opcjonalne)
| Zmienna | Domyślna | Opis |
|---|---|---|
| `PORT` | `3000` | Port serwera (Passenger ustawia automatycznie) |

## Wersja
- Node.js 18+
- Express 4.x
- Frontend: React 19 + Vite 7 + TailwindCSS v4
