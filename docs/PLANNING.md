# Projektordning - Resursplanering

## Översikt

Planeringsmodulen i Projektordning är ett kraftfullt verktyg för att hantera projekt, resurser och materialleveranser med Gantt-vyer och resurstilldelning. Modulen är speciellt utformad för byggföretag och entreprenörer som behöver koordinera resurser över flera parallella projekt och undvika resurskonflikter.

## Huvudfunktioner

### Gantt-schema

- **Visuell projektplanering**: Se alla projekt och deras faser i tidssekvens
- **Fashantering**: Skapa, redigera och flytta projektfaser direkt i gränssnittet
- **Filtreringsmöjligheter**: Filtrera projekt baserat på namn, status eller andra kriterier
- **Anpassningsbar tidsperiod**: Visa 1, 2, 3 eller 6 månader i taget

### Resursplanering

- **Resursöversikt**: Visualisera resurstilldelningar över alla projekt
- **Beläggningsanalys**: Se varje resurs beläggningsgrad med visuella indikatorer
- **Konfliktidentifiering**: Automatisk upptäckt av överlappande uppdrag för samma resurs
- **Resursdetaljer**: Detaljerad information om varje resurs med kompetenser och kapacitet
- **Resurstilldelning**: Enkel tilldelning av resurser till projektfaser med anpassningsbara arbetstimmar

### Materialleveranser

- **Leveransplanering**: Spåra materialleveranser till olika projekt
- **Statusuppföljning**: Följ leveransstatus (beställd, levererad, försenad)
- **Projektkoppling**: Koppla leveranser direkt till projekten de tillhör
- **Kostnadsöverblick**: Se alla kostnader för materialleveranser

## Teknisk implementation

### Datastruktur

Planeringsmodulen är uppbyggd kring följande datamodeller:

- **Project**: Projektinformation med tidsramar och status
- **Phase**: Projektfaser med start- och slutdatum samt statusinfo
- **Resource**: Information om resurser, kompetens och kapacitet
- **ResourceAssignment**: Koppling mellan resurser och projektfaser
- **Delivery**: Information om materialleveranser

### API-gränssnitt

Planeringsmodulen tillhandahåller följande API-ändpunkter:

```
/api/planning
  - GET / - Hämta all planeringsdata (projekt, resurser, leveranser)
  - POST / - Skapa/uppdatera planeringsdata (resurstilldelningar och faser)
  
/api/planning/import-projects
  - POST / - Importera befintliga projekt till planeringsmodulen

/api/planning/phases
  - GET / - Hämta alla eller projektspecifika faser
  - PUT / - Uppdatera en befintlig fas
  - DELETE / - Ta bort en fas och dess tilldelningar

/api/planning/resources
  - GET / - Hämta tillgängliga resurser
  - POST / - Skapa ny resurs
  - PUT / - Uppdatera en befintlig resurs

/api/planning/assignments
  - GET / - Hämta resurstilldelningar
  - DELETE / - Ta bort resurstilldelningar
```

### Komponentöversikt

- **GanttView**: Visualiserar projekt och faser över tid
- **ResourcesView**: Hanterar resurser och deras tilldelningar
- **MaterialsView**: Spårar materialleveranser

## Användningsguide

### Komma igång

1. Navigera till planeringsfliken från huvudmenyn
2. Lägg till projekt genom att klicka på "Lägg till projekt"-knappen
3. Välj projekt att importera från projektlistan
4. Växla mellan Gantt-vy, Resurser och Material med flikarna överst

### Resursallokering

1. Gå till Resurser-fliken
2. Klicka på en resurs för att se detaljerad information
3. Se beläggningsgrad och eventuella konflikter
4. Användningen av färgkoder visar:
   - Grönt: Normal belastning
   - Gult: Hög belastning (75-90%)
   - Rött: Överbelastad (>90%)

### Projektfashantering

1. I Gantt-vyn, klicka på en projektfas för att se detaljer
2. Klicka på "Redigera" för att öppna redigeringsdialogrutan
3. Se tilldelade resurser till fasen
4. Hantera tilldelningar genom att:
   - Klicka på "Lägg till resurs" för att öppna resursurvalsdialogrutan
   - Välj en resurs från listan över tillgängliga resurser
   - Klicka på "Lägg till" för att tilldela resursen till fasen
   - Anpassa timmar per dag för varje resurs
   - Ta bort resurser genom att klicka på "Ta bort" bredvid resurser
5. Redigera fasinformation som namn, datum och status
6. Spara ändringar med "Spara ändringar"-knappen

## Kända begränsningar

- Material-vyn har endast grundläggande funktionalitet i denna version
- Kalendervyn för resurser är under utveckling

## Kommande funktioner

Framtida planerade förbättringar inkluderar:

- **AI-driven resursoptimering**: Automatiska förslag för optimal resursallokering
- **Drag-and-drop**: Möjlighet att schemalägga och flytta faser direkt i Gantt-vyn
- **Kalendergränssnitt**: Alternativ kalendervy för resursplanering
- **Notifieringar**: Automatiska varningar vid resurskonflikter
- **Exportfunktioner**: Export av schema till Excel eller PDF
- **Integration med ekonomisystem**: Koppling till fakturering och tidsrapportering

## Integration med projektmodulen

Planeringsmodulen är djupt integrerad med projektmodulerna i systemet:

- Projekt skapade i projektmodulen kan importeras till planeringen
- Förändringar i projektstatus synkroniseras mellan modulerna
- Projektrubrikerna, ID och grundläggande information delas sömlöst

## Felsökning

Om du stöter på problem i planeringsmodulen:

1. Kontrollera att du har tillgång till projekten i projektmodulen
2. Verifiera att API-anropen returnerar korrekta svar i utvecklarkonsolen
3. Vid konflikter i resurstilldelningen, kontrollera detaljvyn för resursen
4. Om projekt inte visas i Gantt-vyn, kontrollera filtrering och sökkriterier
5. Om resurstilldelning misslyckas, kontrollera att resursen inte redan är tilldelad till fasen

---

*Detta är version 1.2 av planeringsmodulen. För frågor eller feedback, kontakta utvecklingsteamet.* 