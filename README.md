# Projekt Ordning - Rengjord version

Detta är en rengjord version av Projekt Ordning där all Gantt-funktionalitet har tagits bort för att förbättra prestandan och stabiliteten.

## Funktioner som finns kvar

- Projekthantering
- Offerthantering
- Rapporter
- Resurshantering

## Vad har tagits bort

Följande komponenter har tagits bort från projektet:
- Gantt-schema/diagram
- Gantt-API
- Relaterade Gantt-komponenter i navigeringen

## Användning

1. Klona repository
2. Installera beroenden: `npm install`
3. Generera Prisma-klient: `npx prisma generate`
4. Starta utvecklingsservern: `npm run dev`

## Framtida utveckling

Denna version kan användas som en stabil grund för framtida utveckling. Om Gantt-funktionalitet behöver implementeras igen, rekommenderas att det görs med en enklare och mer optimerad lösning.

## Brancher

- `main` - Huvudbranch med den rengjorda versionen
- `clean-version` - Version utan Gantt-funktionalitet
- `gantt-integration` - Original med Gantt-funktion (kan ha prestandaproblem)
