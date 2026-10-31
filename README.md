# bloom

Mobilní marketplace pro kosmetiku v češtině. React 19, TypeScript a Vite. Nové rozhraní nahrazuje původní AXIS Manager.

## Spuštění

Vyžaduje Node.js (ověřeno s verzí 24) a npm.

```sh
npm ci --cache /tmp/axis-npm-cache
npm run dev -- --port 5173
```

`npm run build` kontroluje TypeScript a vytvoří produkční sestavení v `dist/`. `npm run preview -- --port 4173` spustí lokální náhled sestavení.

## Funkce

- Mobilní spodní navigace a responzivní katalog.
- Vyhledávání podle značky a názvu, kategorie, maximální cena a řazení.
- Oblíbené produkty a detail nabídky.
- Přidání vlastní nabídky s volitelnou fotografií do 1,5 MB.
- Ukládání vlastních nabídek, fotografií a oblíbených do localStorage pod klíči `bloom-products`, `bloom-photos` a `bloom-likes`.

Jde o lokální prototyp s osmi fiktivními nabídkami a ilustracemi produktů vytvořenými v CSS. Neobsahuje backend, skutečné účty, zprávy, platby, dopravu ani ověření prodejců a produktů. Data nejsou sdílena mezi zařízeními; vymazání dat prohlížeče je odstraní. Rozhraní tyto limity popisuje u funkcí, které backend vyžadují. Zveřejnění nabídky v prototypu znamená pouze lokální uložení.

Ověřeno produkční sestavení a prohlížečové scénáře: mobilní rozložení 390 px, hledání, oblíbené a jejich zachování po obnovení, otevření detailu, přidání nabídky a její zachování po obnovení, filtr ceny. Bez chyb JavaScriptu.
