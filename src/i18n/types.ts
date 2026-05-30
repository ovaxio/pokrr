export type Locale = "fr" | "en";

export type Dict = {
  // Landing hero
  tagline: string;
  createRoom: string;
  or: string;
  joinRoomLabel: string;
  joinRoomPlaceholder: string;
  joinRoomSubmit: string;
  pageFooter: string;

  // Landing sections headings
  howToTitle: string;
  featuresTitle: string;
  faqTitle: string;

  // Landing section content
  howToSteps: ReadonlyArray<{ title: string; desc: string }>;
  features: ReadonlyArray<{ title: string; desc: string }>;
  faq: ReadonlyArray<{ q: string; a: string }>;

  // Room shell
  roomSrTitlePrefix: string;
  roomLabel: string;
  connecting: string;
  voted: string;
  resultsLabel: string;
  adminOffline: string;
  joinVote: string;
  goSpectator: string;
  share: string;
  shortcutsLabel: string;
  kicked: string;

  // AdminBar
  revealNow: string;
  revoteStory: string;
  nextStoryPlaceholder: string;
  nextStorySubmit: string;
  autoReveal: string;
  deckLabel: string;
  timerLabel: string;
  stop: string;

  // JoinModal
  joinModalAriaLabel: string;
  joinModalRoomPrefix: string;
  joinModalTitle: string;
  joinModalSubtitle: string;
  pseudoSrLabel: string;
  pseudoPlaceholder: string;
  voter: string;
  observer: string;
  enterRoom: string;

  // ShareDialog
  shareTitle: string;
  shareAriaLabel: string;
  close: string;
  roomCodeLabel: string;
  linkCopied: string;
  copyLink: string;

  // StoryHeader
  storyPlaceholder: string;
  save: string;
  cancel: string;
  noStory: string;
  editStory: string;
  setStory: string;

  // ResultsPanel
  noVotes: string;
  statMean: string;
  statMedian: string;
  statSuggestion: string;
  nonNumericDeck: string;
  copiedMd: string;
  copyMd: string;
  consensusPrefix: string;
  distribution: string;
  voteSingular: string;
  votePlural: string;
  spreadWarning: string;
  mdVoterCol: string;
  mdVoteCol: string;
  mdMean: string;
  mdMedian: string;
  mdSuggestion: string;
  mdConsensusPrefix: string;

  // PlayerList
  noPlayers: string;
  youLabel: string;
  adminBadge: string;
  viewerBadge: string;
  editNameAriaLabel: string;
  revokeAdminTitle: string;
  // "Retirer les droits admin à {{name}} ?"
  revokeAdminConfirm: string;
  promoteAdminTitle: string;
  kickTitle: string;
  // "Retirer {{name}} de la salle ?"
  kickConfirm: string;
  statusOnline: string;
  statusOffline: string;

  // CardDeck
  cardsLocked: string;
  chooseCard: string;
  clearCard: string;

  // HelpDialog
  helpDialogAriaLabel: string;
  helpDialogTitle: string;
  helpCloseAriaLabel: string;
  // "Voter (deck {{label}})"
  helpSectionVoting: string;
  helpSectionAdmin: string;
  // "Cartes {{cards}} : clic uniquement."
  helpClickOnly: string;
  helpDisabled: string;
  helpReveal: string;
  helpRevote: string;
  helpCard: string;

  // ThemeToggle
  themeSystem: string;
  themeLight: string;
  themeDark: string;
};
