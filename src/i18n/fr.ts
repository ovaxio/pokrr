import type { Dict } from "./types";

export const fr: Dict = {
  tagline: "Estimez vos stories en équipe : gratuit, sans compte, sans pub.",
  createRoom: "Créer une salle",
  or: "ou",
  joinRoomLabel: "Rejoindre une salle",
  joinRoomPlaceholder: "Code de la salle",
  joinRoomSubmit: "Rejoindre",
  pageFooter: "Aucune donnée stockée côté serveur. Les salles expirent après 4h d'inactivité.",

  howToTitle: "Comment organiser un planning poker en ligne",
  featuresTitle: "Pourquoi pokrr ?",
  faqTitle: "Questions fréquentes",

  howToSteps: [
    {
      title: "Crée une salle",
      desc: 'Clique sur "Créer une salle". Un code unique est généré instantanément.',
    },
    {
      title: "Partage le code",
      desc: "Envoie le code ou le lien QR à ton équipe. Chaque participant rejoint sans compte.",
    },
    {
      title: "Vote sur chaque story",
      desc: "Chacun choisit sa carte en secret. Aucun vote n'est visible avant la révélation.",
    },
    {
      title: "Révèle en simultané",
      desc: "L'admin révèle toutes les cartes d'un coup. La médiane et la distribution s'affichent.",
    },
  ],

  features: [
    {
      title: "Vote simultané",
      desc: "Les cartes se révèlent toutes en même temps : le biais d'ancrage est éliminé.",
    },
    {
      title: "Sans inscription",
      desc: "Aucun compte, aucun email. Crée une salle et lance ton sprint en 10 secondes.",
    },
    {
      title: "5 échelles de vote",
      desc: "Fibonacci, T-Shirt sizing, puissances de 2, entiers naturels, ou ton deck sur mesure.",
    },
    {
      title: "Minuteur intégré",
      desc: "Lance un timer par user story pour maintenir le rythme des sessions.",
    },
    {
      title: "Multi-admin",
      desc: "Plusieurs admins par salle, transfert d'admin en un clic.",
    },
    {
      title: "RGPD-friendly",
      desc: "Aucune donnée stockée côté serveur. Les salles expirent après 4h d'inactivité.",
    },
  ],

  faq: [
    {
      q: "Qu'est-ce que le planning poker ?",
      a: "Le planning poker est une technique d'estimation agile utilisée par les équipes Scrum. Chaque membre vote simultanément sur la complexité d'une user story avec des cartes (souvent la suite de Fibonacci). Le vote simultané évite le biais d'ancrage.",
    },
    {
      q: "pokrr est-il vraiment gratuit ?",
      a: "Oui : sans pub, sans abonnement, sans carte bancaire. Pour toujours.",
    },
    {
      q: "Faut-il créer un compte ?",
      a: "Non. Aucune inscription, aucun email. Tu crées une salle en un clic et tu partages le code.",
    },
    {
      q: "Combien de participants peuvent rejoindre ?",
      a: "Pas de limite fixe. pokrr est conçu pour des équipes Scrum typiques de 3 à 15 personnes.",
    },
    {
      q: "Quelles échelles de vote sont disponibles ?",
      a: "Fibonacci (1, 2, 3, 5, 8, 13, 21…), T-Shirt (XS, S, M, L, XL), puissances de 2, entiers naturels, et un deck personnalisable.",
    },
    {
      q: "Les données sont-elles stockées ?",
      a: "Non. Aucune donnée personnelle côté serveur. Les salles expirent après 4h d'inactivité. pokrr est conforme au RGPD.",
    },
  ],

  roomSrTitlePrefix: "Planning poker — Salle",
  roomLabel: "Salle",
  connecting: "Connexion en cours…",
  voted: "ont voté",
  resultsLabel: "Résultats :",
  adminOffline:
    "Aucun admin en ligne. Le rôle passe automatiquement au plus ancien votant après 15 min.",
  joinVote: "Rejoindre le vote",
  goSpectator: "Passer en spectateur",
  share: "Partager",
  shortcutsLabel: "Raccourcis clavier",
  kicked: "Vous avez été retiré de la salle.",

  revealNow: "Révéler maintenant",
  revoteStory: "Re-voter cette story",
  nextStoryPlaceholder: "Story suivante (titre)…",
  nextStorySubmit: "Story suivante",
  autoReveal: "Auto-révéler",
  deckLabel: "Deck",
  timerLabel: "Timer",
  stop: "Stop",

  joinModalAriaLabel: "Choisir un pseudo",
  joinModalRoomPrefix: "Salle",
  joinModalTitle: "Ton pseudo",
  joinModalSubtitle: "Affiché aux autres participants. Rien d'autre n'est demandé.",
  pseudoSrLabel: "Pseudo",
  pseudoPlaceholder: "Ex. John",
  voter: "Voter",
  observer: "Observer",
  enterRoom: "Entrer dans la salle",

  shareTitle: "Partager la salle",
  shareAriaLabel: "Partager la salle",
  close: "Fermer",
  roomCodeLabel: "Code de la salle",
  linkCopied: "Lien copié",
  copyLink: "Copier le lien",

  storyPlaceholder: "Titre de la story…",
  save: "Enregistrer",
  cancel: "Annuler",
  noStory: "Aucune story définie",
  editStory: "Modifier",
  setStory: "Définir",

  noVotes: "Aucun vote enregistré.",
  statMean: "Moyenne",
  statMedian: "Médiane",
  statSuggestion: "Suggestion",
  nonNumericDeck: "Deck non-numérique → distribution uniquement.",
  copiedMd: "Copié",
  copyMd: "Copier MD",
  consensusPrefix: "Consensus : tout le monde a voté",
  distribution: "Distribution",
  voteSingular: "vote",
  votePlural: "votes",
  spreadWarning: "écart à discuter",
  mdVoterCol: "Voter",
  mdVoteCol: "Vote",
  mdMean: "Moyenne",
  mdMedian: "Médiane",
  mdSuggestion: "Suggestion",
  mdConsensusPrefix: "Consensus sur",

  noPlayers: "Personne dans la salle pour le moment.",
  youLabel: "(toi)",
  adminBadge: "admin",
  viewerBadge: "vue",
  editNameAriaLabel: "Modifier ton pseudo",
  revokeAdminTitle: "Retirer admin",
  revokeAdminConfirm: "Retirer les droits admin à {{name}} ?",
  promoteAdminTitle: "Promouvoir admin",
  kickTitle: "Kick",
  kickConfirm: "Retirer {{name}} de la salle ?",
  statusOnline: "en ligne",
  statusOffline: "hors ligne",

  cardsLocked: "Cartes verrouillées",
  chooseCard: "Choisis une carte",
  clearCard: "Effacer",

  helpDialogAriaLabel: "Aide raccourcis clavier",
  helpDialogTitle: "Raccourcis clavier",
  helpCloseAriaLabel: "Fermer l'aide",
  helpSectionVoting: "Voter (deck {{label}})",
  helpSectionAdmin: "Admin",
  helpClickOnly: "Cartes {{cards}} : clic uniquement.",
  helpDisabled: "Désactivé quand un champ texte est focus.",
  helpReveal: "Révéler (phase voting)",
  helpRevote: "Re-voter cette story (phase revealed)",
  helpCard: "Carte",

  themeSystem: "système",
  themeLight: "clair",
  themeDark: "sombre",

  blogSubtitle: "Guides sur le planning poker pour les équipes agiles.",
  blogEmpty: "Bientôt.",
  blogBackLink: "Tous les articles",
  blogCta: "Essaie pokrr avec ton équipe : gratuit, sans inscription.",
  blogCtaButton: "Créer une salle →",
};
