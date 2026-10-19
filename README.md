# JK Liberec — rezervace jízdárenských ploch

Český responzivní prototyp. React 19, TypeScript, Tailwind CSS 4, Vite.

## Vizuální identita

Tmavé neutrální barvy, bílá typografie, monochromatický obrazový materiál a orámovaná tlačítka navazují na screenshoty webu jezdeckyklubliberec.cz. Aplikace používá plný název Jezdecký klub Liberec a obsahuje odkaz na hlavní web. `public/images/club-mark.svg` je dočasná vektorová rekonstrukce motivu koně v kruhu podle screenshotu, nikoli originální logo klubu. Pro přesnou shodu nahraďte soubor oficiálním SVG se stejným názvem. Obrazový materiál zůstává generovanou ilustrací; fotografie z webu nebyly dostupné. Barvy událostí v kalendáři jsou zachované pro rozlišení vlastní rezervace, cizí rezervace a uzavírky.

## Lokální spuštění

Node.js 24, npm 11 (ověřeno):

```sh
npm ci --cache /tmp/axis-npm-cache
npm run dev -- --port 5173 --strictPort
npm run build
npm test
```

Prototyp přepíná ukázkové členy a administrátorku v horní liště. Není to skutečné přihlášení. Data jsou pouze v paměti Reactu a obnovením stránky se resetují. Nejsou ukládána do localStorage ani odesílána serveru. Administrace umí přidat/deaktivovat ukázkové uživatele, měnit role, uzavřít plochy a blokovat časové intervaly. Ukázkový provoz je 6–21 hodin, rezervace nepřecházejí přes půlnoc. Pravidla klubu jsou jasně označená jako návrh. Obrazový materiál je generovaná ilustrace, nikoli fotografie skutečného areálu JK Liberec.

Sedm automatizovaných testů doménových pravidel spustíte přes `npm test`. Prohlížečové scénáře jsou v `tests/e2e.py` (Python Playwright a Chromium, běžící Vite); spouštění: `python tests/e2e.py`. Ověřují vytvoření, kolize, úpravu, zrušení, role, blokace, pravidla a mobilní zobrazení.

## Supabase: připravená integrace, dosud nezapojená

`supabase/migrations/202610190001_reservations.sql` vytváří profily, plochy, rezervace a pravidla. PostgreSQL EXCLUDE s GiST a polouzavřenými intervaly `[začátek,konec)` bezpečně zakazuje překryvy na stejné ploše včetně souběžných požadavků. Rezervace a uzavření používají stejnou tabulku, takže zákaz platí i mezi nimi. Navazující časy i paralelní rezervace jiných ploch jsou povolené. Triggery kontrolují aktivitu plochy a uživatele, minulost a provozní dobu. Databáze používá Europe/Prague pro provozní dobu. Členské RLS dovoluje měnit jen vlastní rezervace, administrátorské všechny. Role není přebírána z uživatelských registračních metadat.

`src/supabase.ts` obsahuje skutečný klientský adaptér pro přihlášení, čtení, uložení a zrušení s českými chybami. Není importovaný do prototypu. Pouhé nastavení proměnných neaktivuje produkční režim.

### Postup přechodu do ostrého provozu

1. Vytvořte projekt Supabase a aplikujte migraci přes Supabase CLI nebo SQL editor. Migrace zde nebyla spuštěna proti vzdálenému projektu.
2. V Auth zakažte veřejnou registraci, nastavte povolené HTTPS redirect URL a zvěte skutečné členy. Prvního administrátora nastavte jako vlastník projektu podle komentáře v migraci. Správa Auth účtů a pozvánek vyžaduje serverovou/Edge funkci, která ověří administrátora; service-role klíč nikdy nesmí být ve frontendu.
3. Nahraďte přepínač ukázkových osob skutečným přihlášením a obnovou session. Zavolejte `createBackend` s URL projektu a veřejným publishable/anon klíčem. `auth.getUser()` určuje identitu, RLS určuje oprávnění. Nesměšujte ukázková a skutečná data. Stav profilu a role načítejte z databáze.
4. Nahraďte stav v paměti voláními adaptéru, připojte plochy/pravidla/profily přes RLS a serverové operace správy účtů. Časy lokálně zadané pro Liberec převádějte jako Europe/Prague (včetně letního času) na absolutní ISO timestampy; nepoužívejte časové pásmo návštěvníkova zařízení. Při SQLSTATE 23P01 zobrazte kolizi a načtěte aktuální kalendář. Pro změny jiných členů doplňte polling nebo Supabase Realtime.
5. Před nasazením ověřte se skutečnými členy a administrátorem RLS, odhlášení, deaktivaci, neplatnou session a dvě současné kolidující rezervace: právě jedna musí uspět. Ověřte i aktualizace přesunem do cizího času, blokace, navazující termíny a jinou plochu. Doporučené případy jsou v `supabase/VALIDATION.md`.
6. Nastavte produkční hosting s HTTPS, monitoring, zálohy, schválená pravidla a skutečné kontakty klubu. Nahraďte ilustrační fotografie schválenými materiály.

Současný prototyp není připraven na ukládání skutečných rezervací. Frontendová kontrola chrání pouze ukázkový stav; serverové zabezpečení začne platit až po nasazení migrace a dokončení integrace.
