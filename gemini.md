# PROJEKTOVÁ DOKUMENTACE A PRAVIDLA (gemini.md)

Tento soubor slouží jako autoritativní zdroj pravdy pro AI a vývojáře pracující na projektu **Fitko Plán**.

## 1. ÚČEL PROJEKTU
**Fitko Plán** je progresivní webová aplikace (PWA) určená pro sledování týdenních fitness tréninků.
*   **Hlavní funkce:** Správa tréninkového plánu, odškrtávání cviků, historie výkonů, statistické grafy.
*   **Technologie:** HTML/JS (Modulární), Tailwind CSS (CDN), Firebase (Auth, Firestore).
*   **Platforma:** Primárně mobilní (iOS/Android), s responzivním desktop zobrazením.

## 2. PROSTŘEDÍ A SPOUŠTĚNÍ
Aplikace používá moderní JavaScript moduly (ES Modules).
*   **LOCALHOST:** Pro lokální testování je nutné použít HTTP server (např. `Live Server`, `http-server`). Adresa: `http://localhost`.
*   **PRODUKCE:** GitHub Pages.
*   **VAROVÁNÍ:** Protokol `file://` **NENÍ PODPOROVÁN**. Prohlížeče blokují ES moduly z disku.

## 3. VERZOVÁNÍ (KRITICKÉ)
Projekt používá sémantické verzování v `js/data.js` (`APP_VERSION`).
*   **Aktuální verze:** 1.3.0
*   **PATCH (+0.0.1):** Bugfixy, drobné UI změny.
*   **MINOR (+0.1.0):** Nové kompatibilní funkce.
*   **MAJOR (+1.0.0):** Změna architektury nebo struktury dat.

## 4. ARCHITEKTURA (STRIKTNÍ)
1.  **SINGLE ENTRY POINT:** Hlavním vstupem je `js/app.js`. Ostatní soubory pouze exportují logiku.
2.  **LIFECYCLE:** `initializeState()` (Sync) -> `initFirebase()` (Setup) -> `renderApp()` (UI) -> `onAuthStateChanged()` (Async Sync).
3.  **FIREBASE ISOLATION:** Veškerá Firebase logika je v `js/firebase.js`. Inicializace nesmí blokovat start UI.
4.  **FAIL-SAFE:** Aplikace musí fungovat offline/lokálně i při selhání Firebase.

## 5. PRAVIDLA PRO AI
*   Nikdy neměň logiku bez zvýšení verze.
*   Všechny importy musí být relativní (`./filename.js`).
*   Žádné side-effekty při importu souborů. Vše řídí `boot()` v `app.js`.

---
*Tento soubor nesmí být smazán.*
