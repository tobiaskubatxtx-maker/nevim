# Kontroly před ostrým provozem

Toto je plán integračních kontrol pro skutečný projekt, nikoli záznam jejich provedení. Migrace ani RLS zde nebyly ověřeny proti běžícímu PostgreSQL/Supabase.

Použijte oddělený testovací projekt. Pozvěte dva členy A/B a administrátora, přihlaste se přes jejich vlastní session. Nikdy netestujte členská oprávnění service-role klíčem (obchází RLS).

- Bez session: žádné čtení tabulek ani zápisy.
- Člen A: čtení kalendáře, vytvoření vlastní rezervace, změna/zrušení vlastní rezervace. Aktualizace a zrušení rezervace B nesmí změnit žádný řádek (ověřit vrácená data i následný dotaz jako B).
- Člen A: podvržené user_id B, kind closure, změna vlastní role a otevření uzavřené plochy musí být odmítnuty.
- Založte rezervaci 09:00–10:00: odmítnout 08:30–09:30, 09:30–10:30, 09:00–10:00, 08:00–11:00 i 09:15–09:45 se SQLSTATE 23P01. Povolit 08:00–09:00, 10:00–11:00 a stejné časy na jiné ploše.
- Stejná pravidla platí při UPDATE existující rezervace a při vložení administrátorské blokace. Vlastní nezměněný interval nemá kolidovat sám se sebou.
- V testu souběhu odešlete dvě rezervace stejné plochy a intervalu pomocí Promise.all přes dvě nezávislé přihlášené session. Právě jeden insert uspěje a právě jeden skončí 23P01. Totéž ověřte mezi rezervací a blokací. U nezávislých SQL transakcí první ponechte necommitnutou, druhou odešlete, pak první commitněte: druhá musí čekat a následně selhat. Po rollbacku první může druhá uspět.
- Administrátor: změna/zrušení všech rezervací, editace pravidel, změny role a aktivity profilu, uzavření a znovuotevření plochy.
- Deaktivovaný člen: zákaz čtení klubových tabulek a všech změn; pouze vlastní profil může načíst kvůli vysvětlení deaktivace.
- Uzavřená plocha: nové rezervace a jejich úpravy jsou odmítnuté. Existující záznamy zůstávají viditelné a lze je zrušit. Souběžné uzavření a zápis rezervace se serializují zámkem řádku plochy.
- Ověřte datum/čas v Europe/Prague, přechod letního času, provoz 06–21, zákaz převráceného a nulového intervalu, minulosti a přechodu přes půlnoc.
- Ověřte obnovení a expiraci session, odhlášení, síťovou chybu a dvojklik na uložení. Po kolizi načtěte aktuální kalendář. Po neúspěchu nesmí UI zobrazit falešné potvrzení.

V reálném nasazení neukazujte přepínač ukázkových rolí a nevytvářejte demonstrační rezervace. Rozhodnutí o oprávnění vždy náleží databázi a Auth, nikoli stavu Reactu.
