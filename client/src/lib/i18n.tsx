import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'sv' | 'no' | 'en'

const STORAGE_KEY = 'bevervision:lang'

function readStoredLang(): Lang {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'sv' || raw === 'no' || raw === 'en') return raw
  } catch {
    // ignore
  }
  return 'sv'
}

const sv = {
  'common.cancel': 'Avbryt',
  'common.back': 'Tillbaka till start',
  'common.online': 'online',
  'common.offline': 'offline',
  'common.somethingWrong': 'Något gick fel — försök igen',
  'common.wrongPassword': 'Fel lösenord',
  'common.points': 'poäng',

  'landing.displayName': 'Visningsnamn',
  'landing.displayNamePlaceholder': 'Ditt namn',
  'landing.enterDisplayName': 'Ange ett visningsnamn',
  'landing.roomCode': 'Rumskod',
  'landing.roomCodePlaceholder': 't.ex. ABCD23',
  'landing.enterRoomCode': 'Ange en rumskod',
  'landing.roomNotFound': 'Rummet hittades inte',
  'landing.joinRoom': 'Gå med i rum',

  'hostCreate.subtitle': 'Skapa nytt rum',
  'hostCreate.password': 'Värdlösenord',
  'hostCreate.enterPassword': 'Ange värdlösenord',
  'hostCreate.creating': 'Skapar…',
  'hostCreate.create': 'Skapa rum',

  'hostPrompt.subtitle': 'Värdpanel — Rum',
  'hostPrompt.login': 'Logga in',

  'room.connecting': 'Ansluter…',
  'room.reconnecting': 'Återansluter…',
  'room.couldNotConnect': 'Kunde inte ansluta: {err}',
  'room.roomReset': 'Rummet återställdes',
  'room.scoreSaved': 'Poäng sparad',
  'room.predictionSaved': 'Gissning sparad',
  'room.roomLabel': 'Rum',
  'room.judged': 'bedömda',
  'room.votingClosed': 'Röstningen är stängd',
  'room.tabScore': 'Poäng',
  'room.tabPredictions': 'Gissningar',
  'room.loadingCountries': 'Laddar länder…',

  'host.loadingPanel': 'Laddar värdpanel…',
  'host.hostPanel': 'Värdpanel',
  'host.players': 'spelare',
  'host.popQuiz': 'Pop-quiz',
  'host.quizSent': 'Pop-quiz skickad!',
  'host.quizInProgress': 'Quiz pågår…',
  'host.quizOutOfQuestions': 'Slut på frågor',
  'host.sendQuiz': 'Skicka pop-quiz',
  'host.remaining': 'kvar',
  'host.crowdFavourite': 'Publikens favorit',
  'host.votes': 'röster',
  'host.noScoresYet': 'Inga poäng än.',
  'host.playersN': 'Spelare ({n})',
  'host.noPlayersYet': 'Inga spelare än.',
  'host.closeVoting': 'Stäng röstning',
  'host.closeVotingConfirm': 'Är du säker? Spelarna kan inte längre ändra poäng eller gissningar.',
  'host.closing': 'Stänger…',
  'host.officialResults': 'Officiella resultat',
  'host.resultsSaved': 'Resultat sparade',
  'host.readyToReveal': 'Resultaten är sparade. Redo att avslöja topplistan.',
  'host.revealLeaderboard': 'Avslöja topplistan',
  'host.revealingLeaderboard': 'Topplistan avslöjas…',
  'host.revealConfirm': 'Alla spelares skärmar går till topplistan. Är du redo?',
  'host.go': 'Kör!',
  'host.going': 'Kör…',
  'host.emergencyExit': 'Nödutgång',
  'host.resetRoom': 'Återställ rummet',
  'host.resetConfirm': 'Detta nollställer poäng, gissningar och officiella resultat. Rummets kod och spelare behålls.',
  'host.resetting': 'Återställer…',
  'host.reset': 'Återställ',
  'host.createNewInstead': 'Skapa ett nytt rum istället',

  'leaderboard.title': 'Topplistan',
  'leaderboard.fetching': 'Hämtar resultat…',
  'leaderboard.noResultsYet': 'Resultat saknas ännu',
  'leaderboard.couldNotFetch': 'Kunde inte hämta resultat',
  'leaderboard.thanks': 'Tack för att du spelade, {name}!',

  'reveal.noResults': 'Inga resultat ännu.',
  'reveal.jury': 'Jury',
  'reveal.prediction': 'Gissning',
  'reveal.quiz': 'Quiz',

  'card.clear': 'Rensa',

  'pred.top3': 'Topp 3',
  'pred.select': '— välj —',
  'pred.lastPlace': 'Sista plats',
  'pred.bonusGuesses': 'Bonusgissningar',
  'pred.swedenFinish': 'Sveriges slutplacering',
  'pred.norwayFinish': 'Norges slutplacering',

  'quiz.label': 'Pop-quiz · 5 p',
  'quiz.done': '⏱ klart',
  'quiz.noAnswer': 'Inget svar.',
  'quiz.correct': 'Rätt! +5 poäng',
  'quiz.wrong': 'Fel svar.',
  'quiz.waiting': 'Inskickad — väntar på övriga…',
  'quiz.tapAnswer': 'Tryck på ditt svar',

  'results.fillAll': 'Fyll i poäng för alla länder',
  'results.instruction': 'Ange officiella poäng per land. Platserna räknas ut automatiskt — högst poäng blir #1.',
  'results.place': 'Plats',
  'results.country': 'Land',
  'results.points': 'Poäng',
  'results.save': 'Spara resultat',
}

type Key = keyof typeof sv

const no: Record<Key, string> = {
  'common.cancel': 'Avbryt',
  'common.back': 'Tilbake til start',
  'common.online': 'online',
  'common.offline': 'offline',
  'common.somethingWrong': 'Noe gikk galt — prøv igjen',
  'common.wrongPassword': 'Feil passord',
  'common.points': 'poeng',

  'landing.displayName': 'Visningsnavn',
  'landing.displayNamePlaceholder': 'Ditt navn',
  'landing.enterDisplayName': 'Skriv inn et visningsnavn',
  'landing.roomCode': 'Romkode',
  'landing.roomCodePlaceholder': 'f.eks. ABCD23',
  'landing.enterRoomCode': 'Skriv inn en romkode',
  'landing.roomNotFound': 'Rommet ble ikke funnet',
  'landing.joinRoom': 'Bli med i rom',

  'hostCreate.subtitle': 'Opprett nytt rom',
  'hostCreate.password': 'Vertspassord',
  'hostCreate.enterPassword': 'Skriv inn vertspassord',
  'hostCreate.creating': 'Oppretter…',
  'hostCreate.create': 'Opprett rom',

  'hostPrompt.subtitle': 'Vertspanel — Rom',
  'hostPrompt.login': 'Logg inn',

  'room.connecting': 'Kobler til…',
  'room.reconnecting': 'Kobler til igjen…',
  'room.couldNotConnect': 'Kunne ikke koble til: {err}',
  'room.roomReset': 'Rommet ble tilbakestilt',
  'room.scoreSaved': 'Poeng lagret',
  'room.predictionSaved': 'Tipp lagret',
  'room.roomLabel': 'Rom',
  'room.judged': 'vurdert',
  'room.votingClosed': 'Stemmingen er stengt',
  'room.tabScore': 'Poeng',
  'room.tabPredictions': 'Tipp',
  'room.loadingCountries': 'Laster land…',

  'host.loadingPanel': 'Laster vertspanel…',
  'host.hostPanel': 'Vertspanel',
  'host.players': 'spillere',
  'host.popQuiz': 'Pop-quiz',
  'host.quizSent': 'Pop-quiz sendt!',
  'host.quizInProgress': 'Quiz pågår…',
  'host.quizOutOfQuestions': 'Tomt for spørsmål',
  'host.sendQuiz': 'Send pop-quiz',
  'host.remaining': 'igjen',
  'host.crowdFavourite': 'Publikumsfavoritt',
  'host.votes': 'stemmer',
  'host.noScoresYet': 'Ingen poeng ennå.',
  'host.playersN': 'Spillere ({n})',
  'host.noPlayersYet': 'Ingen spillere ennå.',
  'host.closeVoting': 'Steng stemming',
  'host.closeVotingConfirm': 'Er du sikker? Spillerne kan ikke lenger endre poeng eller tipp.',
  'host.closing': 'Stenger…',
  'host.officialResults': 'Offisielle resultater',
  'host.resultsSaved': 'Resultater lagret',
  'host.readyToReveal': 'Resultatene er lagret. Klar til å avsløre topplisten.',
  'host.revealLeaderboard': 'Avslør topplisten',
  'host.revealingLeaderboard': 'Topplisten avsløres…',
  'host.revealConfirm': 'Alle spillerenes skjermer går til topplisten. Er du klar?',
  'host.go': 'Kjør!',
  'host.going': 'Kjører…',
  'host.emergencyExit': 'Nødutgang',
  'host.resetRoom': 'Tilbakestill rommet',
  'host.resetConfirm': 'Dette nullstiller poeng, tipp og offisielle resultater. Romkoden og spillerne beholdes.',
  'host.resetting': 'Tilbakestiller…',
  'host.reset': 'Tilbakestill',
  'host.createNewInstead': 'Opprett et nytt rom i stedet',

  'leaderboard.title': 'Topplisten',
  'leaderboard.fetching': 'Henter resultater…',
  'leaderboard.noResultsYet': 'Resultater er ikke klare ennå',
  'leaderboard.couldNotFetch': 'Kunne ikke hente resultater',
  'leaderboard.thanks': 'Takk for at du spilte, {name}!',

  'reveal.noResults': 'Ingen resultater ennå.',
  'reveal.jury': 'Jury',
  'reveal.prediction': 'Tipp',
  'reveal.quiz': 'Quiz',

  'card.clear': 'Nullstill',

  'pred.top3': 'Topp 3',
  'pred.select': '— velg —',
  'pred.lastPlace': 'Siste plass',
  'pred.bonusGuesses': 'Bonustipp',
  'pred.swedenFinish': 'Sveriges sluttplassering',
  'pred.norwayFinish': 'Norges sluttplassering',

  'quiz.label': 'Pop-quiz · 5 p',
  'quiz.done': '⏱ ferdig',
  'quiz.noAnswer': 'Ingen svar.',
  'quiz.correct': 'Riktig! +5 poeng',
  'quiz.wrong': 'Feil svar.',
  'quiz.waiting': 'Sendt inn — venter på de andre…',
  'quiz.tapAnswer': 'Trykk på svaret ditt',

  'results.fillAll': 'Fyll inn poeng for alle land',
  'results.instruction': 'Skriv inn offisielle poeng per land. Plassene beregnes automatisk — høyest poeng blir #1.',
  'results.place': 'Plass',
  'results.country': 'Land',
  'results.points': 'Poeng',
  'results.save': 'Lagre resultater',
}

const en: Record<Key, string> = {
  'common.cancel': 'Cancel',
  'common.back': 'Back to start',
  'common.online': 'online',
  'common.offline': 'offline',
  'common.somethingWrong': 'Something went wrong — try again',
  'common.wrongPassword': 'Wrong password',
  'common.points': 'points',

  'landing.displayName': 'Display name',
  'landing.displayNamePlaceholder': 'Your name',
  'landing.enterDisplayName': 'Enter a display name',
  'landing.roomCode': 'Room code',
  'landing.roomCodePlaceholder': 'e.g. ABCD23',
  'landing.enterRoomCode': 'Enter a room code',
  'landing.roomNotFound': 'Room not found',
  'landing.joinRoom': 'Join room',

  'hostCreate.subtitle': 'Create new room',
  'hostCreate.password': 'Host password',
  'hostCreate.enterPassword': 'Enter host password',
  'hostCreate.creating': 'Creating…',
  'hostCreate.create': 'Create room',

  'hostPrompt.subtitle': 'Host panel — Room',
  'hostPrompt.login': 'Log in',

  'room.connecting': 'Connecting…',
  'room.reconnecting': 'Reconnecting…',
  'room.couldNotConnect': 'Could not connect: {err}',
  'room.roomReset': 'Room was reset',
  'room.scoreSaved': 'Score saved',
  'room.predictionSaved': 'Prediction saved',
  'room.roomLabel': 'Room',
  'room.judged': 'judged',
  'room.votingClosed': 'Voting is closed',
  'room.tabScore': 'Scores',
  'room.tabPredictions': 'Predictions',
  'room.loadingCountries': 'Loading countries…',

  'host.loadingPanel': 'Loading host panel…',
  'host.hostPanel': 'Host panel',
  'host.players': 'players',
  'host.popQuiz': 'Pop quiz',
  'host.quizSent': 'Pop quiz sent!',
  'host.quizInProgress': 'Quiz in progress…',
  'host.quizOutOfQuestions': 'Out of questions',
  'host.sendQuiz': 'Send pop quiz',
  'host.remaining': 'left',
  'host.crowdFavourite': 'Crowd favourite',
  'host.votes': 'votes',
  'host.noScoresYet': 'No scores yet.',
  'host.playersN': 'Players ({n})',
  'host.noPlayersYet': 'No players yet.',
  'host.closeVoting': 'Close voting',
  'host.closeVotingConfirm': 'Are you sure? Players can no longer change scores or predictions.',
  'host.closing': 'Closing…',
  'host.officialResults': 'Official results',
  'host.resultsSaved': 'Results saved',
  'host.readyToReveal': 'Results saved. Ready to reveal the leaderboard.',
  'host.revealLeaderboard': 'Reveal leaderboard',
  'host.revealingLeaderboard': 'Revealing leaderboard…',
  'host.revealConfirm': 'All players’ screens go to the leaderboard. Ready?',
  'host.go': 'Go!',
  'host.going': 'Going…',
  'host.emergencyExit': 'Emergency exit',
  'host.resetRoom': 'Reset room',
  'host.resetConfirm': 'This clears scores, predictions and official results. The room code and players are kept.',
  'host.resetting': 'Resetting…',
  'host.reset': 'Reset',
  'host.createNewInstead': 'Create a new room instead',

  'leaderboard.title': 'Leaderboard',
  'leaderboard.fetching': 'Fetching results…',
  'leaderboard.noResultsYet': 'No results yet',
  'leaderboard.couldNotFetch': 'Could not fetch results',
  'leaderboard.thanks': 'Thanks for playing, {name}!',

  'reveal.noResults': 'No results yet.',
  'reveal.jury': 'Jury',
  'reveal.prediction': 'Prediction',
  'reveal.quiz': 'Quiz',

  'card.clear': 'Clear',

  'pred.top3': 'Top 3',
  'pred.select': '— choose —',
  'pred.lastPlace': 'Last place',
  'pred.bonusGuesses': 'Bonus predictions',
  'pred.swedenFinish': 'Sweden’s final position',
  'pred.norwayFinish': 'Norway’s final position',

  'quiz.label': 'Pop quiz · 5 pts',
  'quiz.done': '⏱ done',
  'quiz.noAnswer': 'No answer.',
  'quiz.correct': 'Correct! +5 points',
  'quiz.wrong': 'Wrong answer.',
  'quiz.waiting': 'Submitted — waiting for the others…',
  'quiz.tapAnswer': 'Tap your answer',

  'results.fillAll': 'Fill in points for every country',
  'results.instruction': 'Enter official points per country. Positions are computed automatically — highest points becomes #1.',
  'results.place': 'Place',
  'results.country': 'Country',
  'results.points': 'Points',
  'results.save': 'Save results',
}

const dictionaries: Record<Lang, Record<Key, string>> = { sv, no, en }

interface LangCtx {
  lang: Lang
  setLang: (next: Lang) => void
  t: (key: Key, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LangCtx | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readStoredLang())

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
    setLangState(next)
  }, [])

  const t = useCallback(
    (key: Key, params?: Record<string, string | number>): string => {
      const value = dictionaries[lang][key] ?? dictionaries.sv[key] ?? key
      if (!params) return value
      return Object.entries(params).reduce(
        (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
        value,
      )
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useT() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useT must be used inside <LanguageProvider>')
  return ctx
}
