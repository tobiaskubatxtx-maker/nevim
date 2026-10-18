# AXIS Manager

Česká aplikace pro správu malé CNC firmy. React 19, TypeScript, Tailwind CSS 4 a Vite.

## Spuštění

```sh
npm ci --cache /tmp/axis-npm-cache
npm run dev -- --port 5173
```

Produkční sestavení: `npm run build`. Náhled sestavení: `npm run preview`.

## Funkce

Dashboard, správa zakázek, zaměstnanců, zákazníků a strojů, finanční kalkulace s 21% DPH, historie zakázek zákazníka a export zakázek do CSV. Kliknutí na řádek zakázky otevře úpravy. Data se automaticky ukládají pod klíčem `axis-v1` v localStorage daného prohlížeče.

Aplikace obsahuje fiktivní data z října 2026. Historické grafy a srovnání jsou demonstrační; aktuální součty, stavy a ziskovost vycházejí z upravitelných zakázek. Náklady zakázek zadává uživatel; mzdové náklady se zobrazují zvlášť a automaticky se do zakázek nerozpočítávají. Čistý zisk na dashboardu označuje rozdíl evidovaných cen bez DPH a zadaných nákladů, nikoli účetní zisk po zdanění.

Bez backendu, přihlášení a synchronizace mezi zařízeními. Vymazání dat prohlížeče odstraní lokální změny. CSV je export zakázek, nikoli úplná záloha aplikace.
