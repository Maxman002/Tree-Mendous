# Notes on the Steckbriefe (Project Fact Sheets) – European Green Capital Heilbronn 2027

Source: `Steckbriefe_10-2026.pdf` (City of Heilbronn, October 2026, 39 pages). An English version is in `Steckbriefe_10-2026_EN.pdf`.

## What the document is

The PDF contains 37 fact sheets ("Steckbriefe") for the projects and events the City of Heilbronn plans for its year as **European Green Capital 2027**. Every fact sheet has the same structure, which maps nicely onto a data model for our app:

| Field in the PDF | Possible field in our data |
|---|---|
| Number + title | `id`, `title` |
| Subtitle + description | `summary`, `description` |
| Bullet points | `highlights[]` |
| "Added value – Environment and sustainability" | `environmentalImpact` |
| "Added value – General" | `socialImpact` |
| Project duration | `duration` / `permanent: true/false` |
| Planned period within 2027 | `startDate`, `endDate` |
| Budget | `budgetEUR` |
| Coordination | `responsibleOffice` |
| Photos / visualisations | `images[]` (credits must be kept) |

Important caveat: **the PDF has no coordinates**. Locations are given as place names (streets, squares, parks), so we need to geocode them ourselves (e.g. OpenStreetMap / Nominatim) or set the points by hand.

---

## Overview: projects that are interesting for the webapp

Rated by how well they fit a map: ★★★ = fixed physical place and directly about heat, greenery, noise or mobility; ★★ = clear location or event venue; ★ = city-wide programme without one specific place (better as a list or info layer).

### Physical changes to the city (best fit for the map)

**01 Wellbeing Oasis at the Robert Mayer Monument** ★★★
- Where: Marktplatz (market square), around the Robert Mayer Monument, next to the town hall
- What: partial unsealing, trees, shrubs and perennials in two green beds whose borders serve as seating
- Why it matters for us: the sheet says Heilbronn is a nationwide **heat hotspot**, and the measure is meant to cool the market square. This is a good "before/after" point for a heat layer
- Permanent, built in 2027, €333,200, Parks and Green Spaces Office

**02 Mobile Greenery in the City Centre** ★★★
- Where: several spots that change over time: main station (Hauptbahnhof), Kiliansplatz, around the town hall, Friedrich-Ebert Bridge, theatre, Wollhaus, Allee and other squares
- What: mobile trees, plants, furniture and play elements that "wander" from site to site, aimed at **sealed and overheated** spots
- Why it matters: it is explicitly about making **heat hotspots visible**. A timeline or "where is the green right now" feature would fit well
- Jan–Dec 2027, €1,219,800, Parks and Green Spaces Office

**03 Redesign of the Bleichinsel Bridge** ★★★
- Where: Bleichinselbrücke, which links Neckarbogen, Europaplatz and the Bildungscampus (Campuspark to Neckaruferpark)
- What: permanent planting instead of planters, continuous cycle lanes in both directions, unsealing
- Why it matters: greenery, biodiversity and the cycling network at once, and part of the inner-city "Green Ring"
- Permanent, €621,700, Parks and Green Spaces Office + Roads Office

**04 City Centre Cycling Ring** ★★★
- Where: a ring route around the city centre, including Rollwagstraße and Gymnasiumstraße
- What: continuous cycle route with uniform, branded road markings
- Why it matters: it can be drawn as a **line/route layer**, and the sheet names **less noise, CO₂ and air pollution** as benefits
- Jan–Dec 2027, €635,000, Roads Office

**05 Traffic Trial on the Friedrich-Ebert Bridge** ★★★
- Where: Friedrich-Ebert-Brücke and Gerberstraße (expected to see about half as much car traffic)
- What: the bridge is closed to cars for 1–3 months in summer 2027, buses keep using one lane, the other lane becomes seating and greenery
- Why it matters: the sheet expects a **noticeable reduction in noise and emissions**. This is ideal for our **noise layer** and a before/during comparison
- 10 months, €250,000, Parks and Green Spaces Office + Roads Office

**07 Urban Art (silo mural)** ★★
- Where: beweka silos on Hafenstraße (south side)
- What: a huge mural by an international artist on industrial silos, a new landmark and photo spot
- From July 2027, €100,000, Office for Schools, Culture and Sport

**08 Transformation of the Vineyards** ★★
- Where: "Weinbergarena", with a discovery trail in the southern part near Gaffenberg. Symposium at Hochschule Heilbronn
- What: living labs (biodiversity-friendly wine growing, alternative crops), flowering areas, a **vineyard discovery trail** open all year
- Why it matters: a trail can become a route layer, and climate adaptation in agriculture is a strong story
- Permanent, from autumn 2026, €178,500, Parks and Green Spaces Office

**09 Staging the Turmstraße Construction Site** ★★★
- Where: Turmstraße (construction from spring 2027) and Zehentgasse (afterwards, after about 1.5 years)
- What: the street is redesigned with more greenery and less traffic, and the construction site becomes a "model construction site" with tours, before/after visualisations and digital applications
- Why it matters: the sheet itself mentions **"before–after" visualisations and digital applications**, which is exactly what our app could provide. Topics include unsealing, water storage and heat reduction
- Mar–Dec 2027, paid from the budget of sheet 29, Department of Strategy and Future Affairs

**31 Rooftop Walk at the Wollhaus (WOW-Haus)** ★★★
- Where: Wollhaus, city centre
- What: a 4–6 week walkable route over the roofs, designed with MVRDV (known for the Rotterdam Rooftop Walk). It shows greening, water retention and energy generation on roofs
- May/June 2027, €900,000, Building Management

**32 Exhibition "Heilbronn – European Green Capital"** ★★★
- Where: ground floor of the WOW-Haus (Wollhaus)
- What: the central visitor exhibition. It includes a **"Map of Actions"**, a "Model of the Future" and a "Wall of Wishes"
- Why it matters: they already plan a "Map of Actions" station. Our webapp could be pitched as the digital, city-wide version of it
- €700,000, Department of Strategy and Future Affairs + Economic Development Unit

**37 Involving the City Districts** ★★★
- Where: all districts. Named projects:
  - Neckartalschule Böckingen (climate-neutral, 100% renewable energy)
  - Kita Kreuzgrund (Böckingen), Kita Lotte Lemke (Horkheim)
  - Bahnbogen Süd (Böckingen)
  - Nordumfahrung (northern bypass, Frankenbach)
  - Solarpark Hammelsberg (Biberach)
  - Windpark Stöckach (Kirchhausen)
- Highlight: **every district unseals about 10 m²** (e.g. a parking space) and adds a bench and perennials
- Why it matters: it gives us a lot of concrete points outside the centre. The "10 m² per district" spots are a natural map layer
- Permanent, budget spread across other projects, Department of Strategy and Future Affairs

### Events with a fixed venue and date (good for a map + calendar)

| # | Project | Where | When (2027) | Budget |
|---|---|---|---|---|
| 06 | Theatre as a Hub (info point, LED and green façade) | Theater Heilbronn | from summer 2026, all of 2027 | €103,200 |
| 10 | Water Show (fountains, laser, video mapping, ~500,000 visitors expected) | Hagenbuchersee, Untere Neckarstraße, experimenta façade | June–October | €480k + €190k stage |
| 11 | Light Art Festival LiKuHN (15–20 installations, ~3 h route) | Bahnhofsvorstadt → Bildungscampus → Neckarbogen → Stadtgarten → pedestrian zone | 10 days, mid-February | €650,000 |
| 12 | Festival of Cultures | Kiliansplatz and Deutschhof | 2 days, summer | ~€100–120k |
| 13 | Neckar Nature Games (canoe, SUP, rowing, swimming) | along the Neckar from Wertwiesenpark to Hagenbuchersee, incl. Götzenturmpark | one weekend, summer | €60,000 |
| 14 | Sports Exchange (swap and repair sports gear) | e.g. leisure meadow at the Frankenstadion | one day, spring/summer | €30,000 |
| 15 | City Forest programme (Forest Night on 24 Sept, tree planting, clean-up days) | Stadtwald Ost, Waldheide | all year | municipal budget |
| 16 | Vineyards as a place to experience (Dinner in the Vineyards, wine days) | Wartberg and vineyards | summer | fees + €20,000 |
| 17 | Vegan Days (~50 exhibitors, ≥10,000 visitors) | city centre (alongside the triathlon) | 11–13 June | – |
| 33 | Opening Ceremony | Stadttheater + Marktplatz (livestream) | 15 January | €218,000 |
| 34 | Winter Market | Marktplatz | 14–17 January | covered by sheet 33 |
| 35 | European Green Capital 2029 Award Ceremony | Heilbronn (several days) | 5–8 October | €162,000 |

### Programmes without one fixed location (better as an info/list layer)

- **18 Funding for the independent arts scene**: +€100,000 project funding
- **19 Day-care centres annual programme**: 115 Kitas, ~6,000 children. Could become a layer of Kita locations
- **20 BildungsNetz Heilbronn**: an existing online database of school learning offers (possibly a data source)
- **21 Sustainability Pilots (NaLos)**: school projects from year 8, €15,000
- **22 Activities in the cultural institutions**: museums (exhibition "H2Oho!" in the Museum im Deutschhof until 14 March 2027), city library ("Green Island"), music school, city archive, Literaturhaus. Each one has an address, so they could become points
- **23 Neighbourhood centres programme**: neighbourhood gardens, plant swaps (e.g. Quartierszentrum Böckingen), **small climate forest at the Wollhaus**
- **24 Citizens' Budget**: up to 50 small citizen projects × €1,000 (rounds in Q1 and Q3). Funded projects could be shown on the map later
- **25 Activation and participation offers**: Stadtradeln (21 days, >2,000 people), greening competition, **tree sponsorships (goal: >50 new sponsors)**, Sustainability and Mobility Day on 18 Sept 2027. A good match for a "get involved" feature
- **26 European action weeks**: Green Week (June), Mobility Week (Sept), Week for Waste Reduction (Nov)
- **27 Volunteer management**: "Du machst Heilbronn.", organised through **heilbronn.now**
- **28 Staging the urban space**: floor markings, signposts and a uniform design across the city. Our app could link to these physical markers (e.g. QR codes)
- **29 Information and communication**: website, social media and a **central events calendar** (€1,105,000). This is a likely data source or partner for our app
- **30 Congresses and conferences**: RadKONGRESS BW, POLIS Leadership Summit, EU Cities Forum and others
- **36 "Green Badge Heilbronn" for businesses**: light-green and dark-green badges for shops, restaurants and hotels. **A map of businesses with the badge** would fit our app really well

### Ideas for the webapp from reading the PDF

- **Heat layer + green measures:** sheets 01, 02, 03, 09 and 37 are all justified with heat reduction or unsealing. Showing them on top of a heat map would connect "problem" and "solution" directly.
- **Noise and traffic layer:** sheets 04 and 05 explicitly promise less noise and emissions. The Friedrich-Ebert Bridge trial is a perfect case study.
- **Timeline / "what's happening now" filter:** almost every project has a 2027 time window, from the Opening in January to the award ceremony in October.
- **Routes:** Cycling Ring (04), Light Art Festival route (11), vineyard discovery trail (08), Neckar Nature Games stretch (13).
- **Participation:** tree sponsorships, Citizens' Budget, volunteering and the Sustainability Pilots could be shown as "how can I help?" call-to-actions.
- **Data we still need:** coordinates for every location, district boundaries, and actual heat and noise data (not part of this PDF).

---

## Projects sorted by topic

Some projects fit more than one topic. They are listed under their main topic, with secondary topics in brackets.

### 🌳 Greening, unsealing and heat reduction
- 01 Wellbeing Oasis at the Robert Mayer Monument
- 02 Mobile Greenery in the City Centre
- 03 Redesign of the Bleichinsel Bridge *(also mobility)*
- 09 Staging the Turmstraße Construction Site *(also participation)*
- 37 Involving the City Districts: 10 m² unsealing per district *(also energy)*

### 🚲 Mobility and traffic (incl. noise and emissions)
- 04 City Centre Cycling Ring
- 05 Traffic Trial on the Friedrich-Ebert Bridge
- 26 European Action Weeks: European Mobility Week *(also participation)*
- 25 Activation and Participation Offers: Stadtradeln

### 🦋 Nature, biodiversity and landscape
- 08 Transformation of the Vineyards
- 15 Heilbronn City Forest
- 16 Vineyards as a Place to Experience *(also events)*
- 13 Neckar Nature Games *(also sport and events)*

### ⚡ Energy, buildings and infrastructure
- 31 Rooftop Walk at the Wollhaus *(roof greening, water retention, solar)*
- 37 Involving the City Districts: Solarpark Hammelsberg, Windpark Stöckach, climate-neutral Neckartalschule
- 06 Theatre as a Hub *(LED and green façade)*

### ♻️ Circular economy and sustainable consumption
- 14 Heilbronn Sports Exchange
- 17 Vegan Days
- 36 "Green Badge Heilbronn" for Businesses
- 26 European Action Weeks: Week for Waste Reduction

### 🎭 Culture, art and big events
- 07 Urban Art (silo mural)
- 10 Water Show at Lake Hagenbuchersee
- 11 Light Art Festival (LiKuHN)
- 12 Festival of Cultures
- 18 Funding for the Independent Arts Scene
- 22 Activities in the Cultural Institutions
- 33 Opening Ceremony
- 34 Winter Market for the Opening
- 35 European Green Capital 2029 Award Ceremony

### 🎓 Education (children, schools, adults)
- 19 Annual Programme for Day-Care Centres
- 20 BildungsNetz Heilbronn
- 21 Heilbronn Sustainability Pilots (NaLos)
- 23 Programme in the Neighbourhood Centres
- 32 Exhibition "Heilbronn – European Green Capital"

### 🤝 Citizen participation and community
- 24 Citizens' Budget
- 25 Activation and Participation Offers (tree sponsorships, greening competition, Stadtradeln)
- 27 Volunteer Management ("Du machst Heilbronn.")
- 26 European Action Weeks

### 📣 Communication, visibility and networking
- 28 Staging the Urban Space
- 29 Information and Communication Measures (central events calendar)
- 30 Congresses and Conferences in the Title Year
