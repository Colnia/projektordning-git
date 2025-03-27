# Gantt-diagram i Projektordning

## Översikt

Gantt-diagrammet är integrerat i projekthanteringssystemet för att ge en visuell överblick av projektens tidlinjer, faser och uppgifter. Implementationen stödjer hierarkiska vyer, interaktiva tidlinjer och uppgiftshantering.

## Funktioner

- **Projektvisualisering**: Visualisera alla projekt eller fokusera på ett specifikt projekt
- **Hierarkisk struktur**: Se projektet uppdelat i faser och uppgifter
- **Beroendevisualisering**: Se beroenden mellan uppgifter
- **Filtrering**: Filtrera vyn baserat på status, tilldelade resurser eller tidsram
- **Anpassningsbara vyer**: Välj mellan dag-, vecko- eller månadsvy med olika zoomnivåer

## Användning

### Komma åt Gantt-diagrammet

- Från dashboarden: Klicka på "Tidplanering"-fliken
- Från specifika projekt: Klicka på "Visa tidplan" i projekt-menyn

### Navigera i diagrammet

- Använd mushjulet eller zoom-knapparna för att zooma in/ut
- Dra i tidlinjen för att panorera horisontellt
- Klicka på en uppgift för att se detaljer

### Hantera uppgifter

- Klicka på en uppgift för att se och redigera detaljer
- Använd "Lägg till uppgift"-knappen för att skapa nya uppgifter
- Dra uppgifter för att ändra start- och slutdatum (kommande funktion)

## Tekniska detaljer

Implementationen består av följande huvudkomponenter:

- **GanttWrapper**: En klientkomponent som ansvarar för att hämta data och konvertera den till rätt format
- **gantt-chart**: Huvudkomponenten som renderar Gantt-diagrammet
- **gantt-adapter**: Hjälpfunktioner för att konvertera projektdata till Gantt-format

## Kända problem och lösningar

### Aktuella problem

1. **Syntaxfel i JSX**: Det finns syntaxproblem relaterade till JSX-kommentarer i gantt-chart.tsx. Om du ser fel med meddelandet "Expected ',', got '{'" behöver du kontrollera return-satsen i komponenten och byta ut JSX-kommentarerna mot vanlig JSX eller Fragment-syntax.

2. **Importfel**: Gantt-chart exporteras som en namngiven export men importeras ibland som en default export. Om du ser fel som "does not contain a default export (imported as 'GanttChart')", kontrollera att importen använder korrekt syntax: `import { GanttChart } from "@/components/gantt/gantt-chart"`.

3. **"Cannot read properties of undefined"**: Detta fel uppstår när koden försöker läsa egenskaper från objekt som kan vara null eller undefined. Detta har åtgärdats med null-checks och fallback-värden, men kan fortfarande uppstå i vissa fall.

4. **Metadata-export med "use client"**: Next.js tillåter inte export av metadata från klientkomponenter. Lösningen är att separera layout-filen från klientkomponenter genom att skapa en separat Providers-komponent.

### Felsökningsåtgärder

1. Stoppa servern med `taskkill /f /im node.exe`
2. Ta bort cache-mappen med `rm -r -fo .next`
3. Starta om servern med `npm run dev`

## Kommande funktioner

- Dra-och-släpp-hantering för uppgifter
- Direkt sparande till databasen
- Förbättrad resursvisualisering
- Exportalternativ för tidlinjer

## Implementationsanteckningar

Gantt-implementationen bygger på följande grundprinciper:

1. **Dataadaptering**: Projektdata konverteras till ett format som är lämpligt för Gantt-rendering
2. **Rendering i lager**: Tidlinjen rendereras i separata lager för header, innehåll och interaktionselement
3. **Synkroniserad scrollning**: Diagrammets huvud och innehåll är synkroniserade för bättre användning

Koden är strukturerad för att vara modulär och utbyggbar, med tydlig separation mellan datahämtning, datakonvertering och rendering.

## Rapportera problem

Om du stöter på problem eller har förbättringsförslag, vänligen rapportera dem till projektstyrningssystemet med detaljerad information om:

1. Exakt felmeddelande (om tillämpligt)
2. Steg för att reproducera problemet
3. Skärmdumpar (om möjligt)

## Utvecklare

Implementationen har utförts av utvecklingsteamet med fokus på användarupplevelse och integrering med befintliga systemkomponenter. 