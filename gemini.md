# PROJEKTOVÁ DOKUMENTACE A PRAVIDLA (gemini.md)

Tento soubor slouží jako autoritativní zdroj pravdy pro AI a vývojáře pracující na projektu **Fitko Plán**.

## 1. ÚČEL PROJEKTU
**Fitko Plán** je progresivní webová aplikace (PWA) určená pro sledování týdenních fitness tréninků.
*   **Hlavní funkce:** Správa tréninkového plánu, odškrtávání cviků, historie výkonů, statistické grafy.
*   **Technologie:** HTML/JS (Modulární), Tailwind CSS (CDN), Firebase (Auth, Firestore).
*   **Platforma:** Primárně mobilní (iOS/Android), s responzivním desktop zobrazením.

## 2. LOKÁLNÍ VÝVOJ
Aplikace používá moderní JavaScript moduly (ES Modules).
*   **DŮLEŽITÉ:** Protokol `file://` (otevření `index.html` dvojklikem v prohlížeči) **NENÍ PODPOROVÁN**. Prohlížeče blokují načítání modulů z lokálního disku z bezpečnostních důvodů.
*   **POŽADAVEK:** Pro lokální testování je nutné použít lokální HTTP server (např. `Live Server` ve VS Code, `http-server` v Node.js, nebo `python3 -m http.server`).
*   **ADRESA:** Aplikaci testujte na `http://localhost` nebo `http://127.0.0.1`.

## 3. VERZOVÁNÍ (KRITICKÉ)
Projekt používá sémantické verzování. Aktuální verze je uložena v `js/data.js` jako `APP_VERSION`.

**Pravidla pro zvyšování verze:**
*   **PATCH (+0.0.1):** Opravy chyb, drobné úpravy UI, které nemění datovou strukturu.
*   **MINOR (+0.1.0):** Nové funkce (např. editace plánu, nové grafy), které jsou zpětně kompatibilní.
*   **MAJOR (+1.0.0):** Změna architektury, změna struktury dat vyžadující migraci, nebo breaking changes v logice.

## 4. PRAVIDLA PRO AI (ZÁSADNÍ)
1.  **STABILITA PŘED NOVINKAMI:** Nikdy nepřidávej funkci, pokud není základní aplikace 100% stabilní.
2.  **JEDEN ZDROJ PRAVDY:** Veškerý stav je v `js/data.js` (objekt `state`).
3.  **ŽÁDNÉ REGRESE:** Před úpravou kódu si ověř, jak funguje `boot()` sekvence.
4.  **KOMPATIBILITA:** Při změně struktury `plan` nebo `weeks` musíš zajistit zpětnou kompatibilitu.
5.  **VERZOVÁNÍ:** Pokud měníš logiku nebo strukturu, **MUSÍŠ** zvýšit verzi v `js/data.js`.

## 5. CACHE A OFFLINE
*   Aplikace je "Offline-First".
*   Data v `localStorage` jsou primárním zdrojem pro okamžité vykreslení.
*   Firebase synchronizace běží na pozadí.

---
*Tento soubor nesmí být smazán.*