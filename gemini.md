# PROJEKTOVÁ DOKUMENTACE A PRAVIDLA (gemini.md)

Tento soubor slouží jako autoritativní zdroj pravdy pro AI a vývojáře pracující na projektu **Fitko Plán**.

## 1. ÚČEL PROJEKTU
**Fitko Plán** je progresivní webová aplikace (PWA) určená pro sledování týdenních fitness tréninků.
*   **Hlavní funkce:** Správa tréninkového plánu, odškrtávání cviků, historie výkonů, statistické grafy.
*   **Technologie:** HTML/JS (Modulární), Tailwind CSS (CDN), Firebase (Auth, Firestore).
*   **Platforma:** Primárně mobilní (iOS/Android), s responzivním desktop zobrazením.

## 2. VERZOVÁNÍ (KRITICKÉ)
Projekt používá sémantické verzování. Aktuální verze je uložena v `js/data.js` jako `APP_VERSION`.

**Pravidla pro zvyšování verze:**
*   **PATCH (+0.0.1):** Opravy chyb, drobné úpravy UI, které nemění datovou strukturu.
*   **MINOR (+0.1.0):** Nové funkce (např. editace plánu, nové grafy), které jsou zpětně kompatibilní.
*   **MAJOR (+1.0.0):** Změna architektury, změna struktury dat vyžadující migraci, nebo breaking changes v logice.

**Důsledky změny verze:**
*   Při startu aplikace se porovná uložená verze s `APP_VERSION`.
*   Pokud dojde k **MAJOR** změně, aplikace musí provést migraci dat nebo (v krajním případě) invalidovat cache `localStorage`, aby nedošlo k pádu.

## 3. PRAVIDLA PRO AI (ZÁSADNÍ)
Jako AI asistent jsi povinen dodržovat tato pravidla:

1.  **STABILITA PŘED NOVINKAMI:** Nikdy nepřidávej funkci, pokud není základní aplikace (boot, render, sync) 100% stabilní.
2.  **JEDEN ZDROJ PRAVDY:** Veškerý stav je v `js/data.js` (objekt `state`). UI nikdy nedrží vlastní stav.
3.  **ŽÁDNÉ REGRESE:** Před úpravou kódu si ověř, jak funguje `boot()` sekvence. Nesmíš rozbít inicializaci.
4.  **KOMPATIBILITA:** Při změně struktury `plan` nebo `weeks` musíš zajistit, že stará data v `localStorage` nezpůsobí `null reference` chybu.
5.  **VERZOVÁNÍ:** Pokud měníš logiku ukládání nebo strukturu, **MUSÍŠ** zvýšit číslo verze v `js/data.js`.

## 4. CACHE A OFFLINE
*   Aplikace je "Offline-First".
*   Data v `localStorage` jsou primárním zdrojem pro okamžité vykreslení.
*   Firebase synchronizace běží na pozadí a pouze aktualizuje stav.
*   Při změně verze aplikace zkontroluj, zda jsou data v cache validní.

## 5. PRACOVNÍ POSTUP
1.  **Analýza:** Přečti si `gemini.md` a pochop aktuální verzi.
2.  **Implementace:** Proveď změny v oddělených souborech (`plan.js`, `firebase.js` atd.).
3.  **Verze:** Pokud je to nutné, zvedni `APP_VERSION`.
4.  **Ověření:** Ujisti se, že `boot()` proběhne bez chyb a UI naskočí.

---
*Tento soubor nesmí být smazán.*
