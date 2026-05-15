export interface QuizQuestion {
  id: number
  prompt: string
  options: string[]
  correctIndex: number
}

/**
 * Pop-quiz pool. Order = trigger order; the server walks this array sequentially
 * per room and persists progress in `rooms.quiz_index`.
 *
 * Owner: edit this list before the party. Each question must have 2–4 options.
 * `id` is stable and used as the DB key for answers — don't reuse ids if you
 * shuffle the list mid-sprint.
 */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    prompt: 'Vilket land vann Eurovision Song Contest 2022 med låten "Stefania"?',
    options: ['Polen', 'Ukraina', 'Moldavien', 'Tjeckien'],
    correctIndex: 1,
  },
  {
    id: 2,
    prompt: 'Vilken artist vann Eurovision 2023 för Sverige med låten "Tattoo"?',
    options: ['Måns Zelmerlöw', 'Loreen', 'Zara Larsson', 'Carola'],
    correctIndex: 1,
  },
  {
    id: 3,
    prompt: 'Vilket land blev det första före detta sovjetlandet att vinna Eurovision?',
    options: ['Estland', 'Lettland', 'Ukraina', 'Ryssland'],
    correctIndex: 0,
  },
  {
    id: 4,
    prompt: 'Vilket land vann den allra första Eurovision Song Contest år 1956?',
    options: ['Frankrike', 'Schweiz', 'Italien', 'Tyskland'],
    correctIndex: 1,
  },
  {
    id: 5,
    prompt: 'Vilken grupp vann Eurovision 1974 och blev senare världsberömd?',
    options: ['Roxette', 'Ace of Base', 'ABBA', 'A-ha'],
    correctIndex: 2,
  },
  {
    id: 6,
    prompt: 'Vad är det maximala antalet poäng ett land kan ge till ett annat i Eurovision?',
    options: ['10', '15', '12', '20'],
    correctIndex: 2,
  },
  {
    id: 7,
    prompt: 'Vilken norsk artist vann Eurovision 2009 med dåtidens rekordpoäng?',
    options: ['KEiiNO', 'Tix', 'Alexander Rybak', 'Subwoolfer'],
    correctIndex: 2,
  },
  {
    id: 8,
    prompt: 'Vilket land vann Eurovision 2021 med rockbandet Måneskin?',
    options: ['Finland', 'Italien', 'Spanien', 'Norge'],
    correctIndex: 1,
  },
  {
    id: 9,
    prompt: 'Vilket land har vunnit Eurovision flest gånger (fram till 2026)?',
    options: ['Sverige', 'Irland', 'Storbritannien', 'Frankrike'],
    correctIndex: 1,
  },
  {
    id: 10,
    prompt: 'Vilken artist har deltagit flest gånger i Eurovision som huvudartist?',
    options: ['Johnny Logan', 'Lys Assia', 'Valentina Monetta', 'Elisabeth Andreassen'],
    correctIndex: 2,
  },
  {
    id: 11,
    prompt: 'Vilken Eurovision-vinnare fick den högsta procentandelen möjliga poäng under det moderna röstningssystemet?',
    options: ['Salvador Sobral', 'Loreen ("Tattoo")', 'Alexander Rybak', 'Kalush Orchestra'],
    correctIndex: 2,
  },
  {
    id: 12,
    prompt: 'Vad heter traditionen där länder live delar ut sina högsta poäng?',
    options: ['Jury Reveal', 'The 12 Points Ceremony', 'Grand Vote', 'Douze Points'],
    correctIndex: 3,
  },
  {
    id: 13,
    prompt:
      'Vilket Eurovision-bidrag var det första vinnande bidraget som framfördes helt på ett annat språk än engelska eller franska efter att språkregeln avskaffades?',
    options: ['"Molitva" av Serbien', '"Amar pelos dois" av Portugal', '"1944" av Ukraina', '"Zitti e buoni" av Italien'],
    correctIndex: 0,
  },
  {
    id: 14,
    prompt: 'Vilken artist vann Eurovision 2014 för Österrike med "Rise Like a Phoenix"?',
    options: ['Verka Serduchka', 'Conchita Wurst', 'Dana International', 'Netta'],
    correctIndex: 1,
  },
  {
    id: 15,
    prompt: 'Vilket land drog sig ur Eurovision efter att ha vunnit 1974 på grund av kostnader och politiska frågor?',
    options: ['Luxemburg', 'Monaco', 'Grekland', 'Italien'],
    correctIndex: 2,
  },
  {
    id: 16,
    prompt: 'Vilken stad som varit värd för Eurovision hade minst befolkning vid tiden för tävlingen?',
    options: ['Malmö', 'Millstreet', 'Harrogate', 'Turin'],
    correctIndex: 1,
  },
  {
    id: 17,
    prompt: 'Vilket år infördes det nuvarande röstningssystemet där jury- och tittarröster delas upp separat i finalen?',
    options: ['2009', '2013', '2016', '2019'],
    correctIndex: 2,
  },
  {
    id: 18,
    prompt: 'Vilken Eurovision-låt innehåller raden "Waterloo — knowing my fate is to be with you"?',
    options: ['Euphoria', 'Fairytale', 'Waterloo', 'Heroes'],
    correctIndex: 2,
  },
  {
    id: 19,
    prompt: 'Vilket land utanför Europa deltar regelbundet i Eurovision?',
    options: ['Kanada', 'Marocko', 'Australien', 'Brasilien'],
    correctIndex: 2,
  },
  {
    id: 20,
    prompt: 'Vilket land vann Eurovision trots att det fick noll poäng från tittarrösterna i finalen?',
    options: ['Österrike', 'Schweiz', 'Belgien', 'Tyskland'],
    correctIndex: 1,
  },
  {
    id: 21,
    prompt: 'Vad heter Eurovision-sloganen som introducerades 2002?',
    options: ['Europe Sings', 'Celebrate Diversity', 'United by Music', 'Sound of Europe'],
    correctIndex: 2,
  },
  {
    id: 22,
    prompt: 'Vilket land är känt för att ha fått "nul points" flera gånger i Eurovisionhistorien?',
    options: ['Luxemburg', 'Norge', 'Portugal', 'Serbien'],
    correctIndex: 1,
  },
  {
    id: 23,
    prompt: 'Vilket år var det första då de flesta deltagande länder använde telefonröstning för att utse vinnaren?',
    options: ['1995', '1997', '1999', '2001'],
    correctIndex: 1,
  },
  {
    id: 24,
    prompt: 'Vilket Eurovision-bidrag diskvalificerades 1969 för att det överskred den tillåtna låtlängden?',
    options: ['"La, la, la"', '"Vivo cantando"', '"Toutes les amours de l\'été"', '"Die Sommermelodie"'],
    correctIndex: 3,
  },
  {
    id: 25,
    prompt: 'Vilken artist vann Eurovision med låten "Euphoria"?',
    options: ['Helena Paparizou', 'Sertab Erener', 'Loreen', 'Ruslana'],
    correctIndex: 2,
  },
  {
    id: 26,
    prompt: 'Vad var huvudsyftet med införandet av semifinaler år 2004?',
    options: [
      'Att korta ner låtarna',
      'Att minska produktionskostnaderna',
      'Att hantera för många deltagarländer',
      'Att återinföra språkregler',
    ],
    correctIndex: 2,
  },
  {
    id: 27,
    prompt: 'Vilket land var värd för Eurovision 2024?',
    options: ['Sverige', 'Storbritannien', 'Italien', 'Ukraina'],
    correctIndex: 0,
  },
  {
    id: 28,
    prompt: 'Vilket språk var man tidigare tvungen att sjunga på innan reglerna ändrades 1999?',
    options: ['Engelska', 'Franska', 'Landets officiella språk', 'Latin'],
    correctIndex: 2,
  },
  {
    id: 29,
    prompt: 'Hur många deltagande TV-bolag krävs minst för att Eurovision ska kunna genomföras?',
    options: ['5', '10', '15', '20'],
    correctIndex: 0,
  },
  {
    id: 30,
    prompt: 'Vilket av följande länder har aldrig vunnit Eurovision (fram till 2026)?',
    options: ['Island', 'Portugal', 'Finland', 'Österrike'],
    correctIndex: 0,
  },
]
