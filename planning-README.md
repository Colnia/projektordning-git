# Projektordning - Avancerat Planeringsverktyg

## Översikt

Detta planeringsverktyg är en utökad modul för Projektordning som möjliggör omfattande schemaläggning, resursallokering och materialleveransplanering med en integrerad Gantt-vy. Verktyget är särskilt utformat för entreprenadföretag med behov av att koordinera montörer, tekniker och material över flera parallella projekt.

## Funktioner

### Grundläggande funktioner

- **Multi-projekt Gantt-vy**: Visuell tidslinje av alla projekt med anpassningsbar tidsperiod (dag, vecka, månad, år)
- **Resursallokering**: Schemaläggning av personal (montörer/tekniker) över olika projekt
- **Materialleveransplanering**: Spårning av materialleveranser med integrerade påminnelser
- **Kapacitetsplanering**: Överblick över resursbelastning med varningar för överbeläggning
- **Projektberoenden**: Definiera beroenden mellan projekt, faser och leveranser

### Avancerade funktioner

- **AI-driven resursoptimering**: Automatiska förslag för optimal resursallokering baserat på kompetens och projektprioritet
- **Prognoser och scenarioplanering**: Simulering av olika planerings-scenarion med kostnads- och tidsanalys
- **Kritisk väg-analys**: Automatisk identifiering av flaskhalsar och kritiska aktiviteter
- **Realtidsuppdateringar**: Direktuppdatering av scheman när förändringar görs
- **Kompetensbaserad matchning**: Tilldelning av personal baserat på kompetenskrav för specifika uppgifter
- **E-postnotifikationer**: Automatiska påminnelser och meddelanden till resurser och projektledare

## Tekniska specifikationer

### Användargränssnitt

- Gantt-diagram för projekt, faser och resurser
  - Optimerad stapelberäkning för korrekt visning i olika tidsintervall
  - Intelligent visning/döljning av staplar baserat på synligt tidsintervall
  - Fasnamn visas bredvid staplarna för enkel identifiering
  - Adaptiv datumvisning på staplar baserad på tillgängligt utrymme
- Kapacitetsöversikt för alla resurser
- Materialleveransspårning med statusuppdateringar
- Filtreringsmöjligheter för kund, tidsperiod, status

### API-endpoints

```
/api/planning
  - GET /projects - Hämta alla projekt med planeringsinformation
  - GET /resources - Hämta alla resurser med tillgänglighet
  - GET /schedule - Hämta det fullständiga schemat
  - POST /optimize - Generera ett optimerat schema
  
/api/resources
  - GET / - Lista alla resurser
  - POST / - Skapa ny resurs
  - GET /:id - Hämta specifik resurs
  - PUT /:id - Uppdatera resurs
  - DELETE /:id - Ta bort resurs
  - GET /:id/availability - Hämta tillgänglighet
  - POST /:id/skills - Lägg till kompetens
  
/api/assignments
  - GET / - Lista alla tilldelningar
  - POST / - Skapa ny tilldelning
  - PUT /:id - Uppdatera tilldelning
  - DELETE /:id - Ta bort tilldelning
  - GET /conflicts - Identifiera schemakonflikter

/api/planning/assignments
  - DELETE /delete?id=<id> - Ta bort en resurstilldelning
  
/api/phases
  - GET / - Lista alla projektfaser
  - POST / - Skapa ny fas
  - PUT /:id - Uppdatera fas
  - DELETE /:id - Ta bort fas
  - GET /:id/dependencies - Hämta beroenden
  
/api/materials
  - GET / - Lista alla materialleveranser
  - POST / - Skapa ny leverans
  - PUT /:id - Uppdatera leverans
  - GET /tracking - Spåra alla leveranser
```

## Implementationsplan

### Fas 1: Grundläggande funktionalitet (4-6 veckor)
- Datamodell och API-design
- Grundläggande Gantt-vy
- Resurshantering med allokering
- Material och leveransplanering

### Fas 2: Avancerade funktioner (6-8 veckor)
- Implementering av resursoptimering
- Scenarioplanering
- Konfliktdetektering och lösning
- Realtidsuppdateringar

### Fas 3: AI och integration (8-10 veckor)
- AI-algoritmer för optimering
- E-postnotifikationer
- Avancerad datavisualisering

### Fas 4: Förfining och användarupplevelse (4-6 veckor)
- Prestandaoptimering
- Användartestar och feedback
- Mobil anpassning
- Slutlig polering

## Förväntade resultat

Detta avancerade planeringsverktyg kommer att revolutionera hur företaget hanterar sina resurser och projekt, med förväntade fördelar som:

- **30% effektivare resursanvändning** genom optimal allokering
- **25% minskade leveransförseningar** genom bättre materialplanering
- **20% kortare projekttider** genom eliminering av flaskhalsar
- **15% kostnadsbesparing** genom minskad överbokning och överkapacitet
- **40% bättre överblick** över alla pågående och kommande projekt 

## Kända problem och lösningar

### Saknat status-fält i Phase-modellen (AKTUELL)
- **Problem**: Status för faser kan inte uppdateras i databasen eftersom status-fältet saknas i Prisma-schemat för Phase-modellen.
- **Felmeddelande**: `Unknown argument `status`. Available options are marked with ?.`
- **Lösning**:
  1. Uppdatera Prisma-schemat i `prisma/schema.prisma` genom att lägga till status-fältet i Phase-modellen:
  ```prisma
  model Phase {
    // ... befintliga fält ...
    status           String   @default("not started")
    // ... resten av modellen ...
  }
  ```
  2. Kör en migrering med Prisma för att uppdatera databasen: `npx prisma migrate dev --name add_status_to_phase`
- **Status**: Ej åtgärdad. Detta måste lösas för att statusändringar ska fungera korrekt.

### Problem med färguppdatering i Gantt-vyn
- **Problem**: När man ändrar färg på en fas i Gantt-vyn, uppdateras färgen i databasen men visas inte visuellt i vyn förrän man laddar om sidan.
- **Orsak**: `setProjectsData` anropades inte efter API-anrop för att uppdatera fasfärger, vilket ledde till att UI:t inte uppdaterades korrekt.
- **Lösning**: 
  1. Lagt till ett anrop till `setProjectsData` när API-anropet för att uppdatera fasfärger slutförts
  2. Implementerat en tvingad omrendering genom att använda en `forceUpdateKey`
- **Status**: Åtgärdad. Färgändringar visas nu direkt i Gantt-vyn utan att sidan behöver laddas om.

### Förbättrade stapelberäkningar i Gantt-vyn
- **Problem**: Staplar i Gantt-schemat visades inkonsekvent eller helt utanför synligt område vid vissa datumintervall.
- **Orsak**: Beräkningslogiken för staplarnas position och bredd tog inte hänsyn till staplar som var delvis utanför det synliga området.
- **Lösning**:
  1. Helt omskriven `calculateBarPosition`-funktion med matematiskt korrekta beräkningar
  2. Implementerat en smart "isVisible"-property för att visa eller dölja staplar som är utanför vald tidsperiod
  3. Optimerat algoritmen för att hantera delvis synliga staplar genom att endast visa den del som är inom tidsintervallet
  4. Lagt till stöd för stackade vyer med tydligare organisation
- **Status**: Åtgärdad. Staplarna visas nu korrekt med exakt position och bredd i alla tidsintervall.

### Förbättrad visualisering med fasnamn
- **Problem**: Svårt att identifiera vilken fas som en stapel tillhörde utan att hovra över den.
- **Orsak**: Den ursprungliga designen visade bara staplar utan tillräcklig kontextuell information.
- **Lösning**:
  1. Lagt till fasnamn på vänster sida bredvid varje stapel för snabb identifiering
  2. Implementerat dynamisk visning av text på staplar baserat på tillgängligt utrymme
  3. Förbättrat färgkodning och visuell hierarki mellan projekt, faser och resurser
  4. Lagt till datum på staplarna när bredden tillåter det
- **Status**: Åtgärdad. Användargränssnittet ger nu tydligare visuell kontext för varje stapel i diagrammet.

### Problem med duplicerade React-nycklar
- **Problem**: Konsolen visade felmeddelanden om duplicerade nycklar när flera resurser med samma ID renderades i olika vyer.
- **Orsak**: Samma resurs-ID användes som nyckel för React-komponenter i olika kontexter, vilket strider mot Reacts krav på unika nycklar.
- **Lösning**:
  1. Implementerat sammansatta nycklar som kombinerar fas-ID, resurs-ID och index
  2. Säkerställt att varje komponent som renderas i en lista har en garanterat unik nyckel
  3. Förbättrad struktur för att undvika duplicerade renderingar av samma resurs
- **Status**: Åtgärdad. Inga felmeddelanden om duplicerade nycklar uppträder längre, och renderingen är korrekt och effektiv.

### Visning av resurstilldelningar i fas-dialogrutan
- **Problem**: Resurstilldelningar sparades korrekt i databasen men visades inte i fas-dialogrutan när användaren klickade på en fas.
- **Orsak**: Frontend-koden försökte hämta resurstilldelningar från en inaktuell datakälla (project.resources) istället för den faktiska assignments-listan som hämtas från API:et.
- **Lösning**:
  1. Uppdaterat GanttView-komponenten för att ta emot assignments-data som en separat prop.
  2. Ändrat koden för att visa fas-information så att den hämtar resurstilldelningar direkt från assignments-listan istället för från projekt-objekten.
  3. Säkerställt att korrekt ID-jämförelse görs genom att konvertera alla ID:n till strängar innan jämförelse.
- **Status**: Åtgärdad i den nuvarande versionen. Resurstilldelningar visas nu korrekt i fas-dialogrutan.

### Foreign key constraint i resurstilldelningar
- **Problem**: När användare försökte tilldela resurser från det grafiska gränssnittet misslyckades operationen med ett "Foreign key constraint violated" fel.
- **Orsak**: Systemet använde fördefinierade standardresurser i minnet istället för att faktiskt skapa dessa resurser i databasen. När en resurstilldelning sedan försökte skapas med referens till en resurs som inte existerade i databasen, utlöstes ett relationsdatabasfel.
- **Lösning**:
  1. Skapat en ny API-endpoint (`/api/planning/resources/import`) som importerar standardresurser till databasen.
  2. Uppdaterat planning-API:et så att det automatiskt anropar importeringsendpointen när inga resurser finns i databasen.
  3. Säkerställt att endast resurser som finns i databasen används för tilldelningar.
- **Status**: Åtgärdad i den nuvarande versionen. Systemet kan nu hantera resurstilldelningar korrekt med databaspersistens.

### Typkonflikt i resurstilldelningar
- **Problem**: När användare tilldelade resurser till projektfaser uppstod ett typfel eftersom frontend-koden skickade resourceId som ett heltal medan Prisma-schemat krävde en sträng.
- **Orsak**: Inkonsekvens i datamodellen mellan frontend och backend, där frontend arbetade med numeriska ID:n för vissa resurser medan databasmodellen definierade alla ID:n som UUID-strängar.
- **Lösning**: 
  1. Explicit typkonvertering i frontend-koden (gantt-view.tsx) för att säkerställa att resourceId skickas som sträng.
  2. Ytterligare säkerhetskonvertering i API-route-hanteraren för att garantera rätt datatyp oavsett vad som skickas.
  3. Förbättrad felhantering för att ge mer detaljerade felmeddelanden om typfel uppstår.
- **Status**: Åtgärdad i den nuvarande versionen.

### Problemet med fas-ID format
Under utvecklingen upptäcktes ett inkompatibilitetsproblem mellan frontend och backend gällande hur fas-ID representeras:

- **Problem**: Frontend-delen av planeringsvyn genererade temporära fas-ID med formatet `projektId-phase1`, medan databasen använder UUID för alla faser. Detta orsakade 404-fel när frontend försökte uppdatera faser med ID:n som inte fanns i databasen.

- **Orsak**: Olika delar av systemet utvecklades parallellt med olika antaganden om ID-format. Backend använder Prisma ORM som genererar UUID automatiskt, medan frontend använde ett enklare format för temporära faser.

- **Lösning**: 
  1. API-endpointen `/api/planning` uppdaterades för att returnera verkliga fas-ID från databasen istället för temporära ID:n.
  2. En ny endpoint `/api/planning/phases/create` implementerades för att skapa nya faser när temporära ID:n detekteras.
  3. Frontend-koden i Gantt-vyn uppdaterades för att detektera temporära ID:n och skapa nya faser istället för att försöka uppdatera icke-existerande.

- **Status**: Åtgärdad i den nuvarande versionen. Systemet kan nu hantera både befintliga databas-ID:n och temporära ID:n som kan förekomma vid import av projekt eller testdata.

### Minnesläcka vid långvarig användning
- **Problem**: Vid långvarig användning av planeringsvyn med många projekt och faser kunde minnesanvändningen öka märkbart.
- **Åtgärd**: Implementerad bättre rensning av referenser och optimering av event-hantering.
- **Status**: Delvis åtgärdad, fortsatt övervakning rekommenderas. 