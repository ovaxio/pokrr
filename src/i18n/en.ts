import type { Dict } from "./types";

export const en: Dict = {
  tagline: "Minimalist planning poker: free, no ads, no account required.",
  createRoom: "Create a room",
  or: "or",
  joinRoomLabel: "Join a room",
  joinRoomPlaceholder: "Room code",
  joinRoomSubmit: "Join",
  pageFooter: "No data stored server-side. Rooms expire after 4 hours of inactivity.",

  howToTitle: "How to run a planning poker session online",
  featuresTitle: "Why pokrr?",
  faqTitle: "Frequently asked questions",

  howToSteps: [
    {
      title: "Create a room",
      desc: 'Click "Create a room". A unique code is generated instantly.',
    },
    {
      title: "Share the code",
      desc: "Send the code or QR link to your team. Everyone joins without an account.",
    },
    {
      title: "Vote on each story",
      desc: "Each person picks a card in secret. No votes are visible until reveal.",
    },
    {
      title: "Reveal simultaneously",
      desc: "The admin reveals all cards at once. The median and distribution are shown.",
    },
  ],

  features: [
    {
      title: "No account needed",
      desc: "No sign-up, no email. Create a room and start your sprint in 10 seconds.",
    },
    {
      title: "Simultaneous reveal",
      desc: "All cards flip at the same time — anchoring bias is eliminated.",
    },
    {
      title: "5 voting scales",
      desc: "Fibonacci, T-Shirt sizing, powers of 2, natural numbers, or a custom deck.",
    },
    {
      title: "Built-in timer",
      desc: "Start a per-story timer to keep sessions on track.",
    },
    {
      title: "Multi-admin",
      desc: "Multiple admins per room, one-click admin transfer.",
    },
    {
      title: "Privacy-first",
      desc: "No personal data stored server-side. Rooms expire after 4 hours of inactivity.",
    },
  ],

  faq: [
    {
      q: "What is planning poker?",
      a: "Planning poker is an agile estimation technique used by Scrum teams. Each member simultaneously votes on the complexity of a user story using cards (often the Fibonacci sequence). Simultaneous voting prevents anchoring bias.",
    },
    {
      q: "Is pokrr really free?",
      a: "Yes — no ads, no subscription, no credit card. Forever.",
    },
    {
      q: "Do I need to create an account?",
      a: "No. No sign-up, no email. Create a room in one click and share the code.",
    },
    {
      q: "How many participants can join?",
      a: "No hard limit. pokrr is designed for typical Scrum teams of 3 to 15 people.",
    },
    {
      q: "What voting scales are available?",
      a: "Fibonacci (1, 2, 3, 5, 8, 13, 21…), T-Shirt (XS, S, M, L, XL), powers of 2, natural numbers, and a customizable deck.",
    },
    {
      q: "Is my data stored?",
      a: "No. No personal data is stored server-side. Rooms expire after 4 hours of inactivity. pokrr is GDPR-friendly.",
    },
  ],

  roomSrTitlePrefix: "Planning poker — Room",
  roomLabel: "Room",
  connecting: "Connecting…",
  voted: "voted",
  resultsLabel: "Results —",
  adminOffline:
    "No admin online. The role will be transferred automatically to the longest-present voter after 15 min.",
  joinVote: "Join the vote",
  goSpectator: "Switch to spectator",
  share: "Share",
  shortcutsLabel: "Keyboard shortcuts",
  kicked: "You have been removed",

  revealNow: "Reveal now",
  revoteStory: "Re-vote this story",
  nextStoryPlaceholder: "Next story (title)…",
  nextStorySubmit: "Next story",
  autoReveal: "Auto-reveal",
  deckLabel: "Deck",
  timerLabel: "Timer",
  stop: "Stop",

  joinModalAriaLabel: "Choose a username",
  joinModalRoomPrefix: "Room",
  joinModalTitle: "Your username",
  joinModalSubtitle: "Shown to other voters. No other information is required.",
  pseudoSrLabel: "Username",
  pseudoPlaceholder: "E.g. John",
  voter: "Voter",
  observer: "Observer",
  enterRoom: "Enter the room",

  shareTitle: "Share room",
  shareAriaLabel: "Share the room",
  close: "Close",
  roomCodeLabel: "Room code",
  linkCopied: "Link copied",
  copyLink: "Copy link",

  storyPlaceholder: "Story title…",
  save: "Save",
  cancel: "Cancel",
  noStory: "No story defined",
  editStory: "Edit",
  setStory: "Set",

  noVotes: "No votes recorded.",
  statMean: "Mean",
  statMedian: "Median",
  statSuggestion: "Suggestion",
  nonNumericDeck: "Non-numeric deck → distribution only.",
  copiedMd: "Copied",
  copyMd: "Copy MD",
  consensusPrefix: "Consensus: everyone voted",
  distribution: "Distribution",
  voteSingular: "vote",
  votePlural: "votes",
  spreadWarning: "gap to discuss",
  mdVoterCol: "Voter",
  mdVoteCol: "Vote",
  mdMean: "Mean",
  mdMedian: "Median",
  mdSuggestion: "Suggestion",
  mdConsensusPrefix: "Consensus on",

  noPlayers: "Nobody in the room yet.",
  youLabel: "(you)",
  adminBadge: "admin",
  viewerBadge: "viewer",
  editNameAriaLabel: "Edit your username",
  revokeAdminTitle: "Remove admin",
  revokeAdminConfirm: "Remove admin rights from {{name}}?",
  promoteAdminTitle: "Promote to admin",
  kickTitle: "Kick",
  kickConfirm: "Remove {{name}} from the room?",
  statusOnline: "online",
  statusOffline: "offline",

  cardsLocked: "Cards locked",
  chooseCard: "Choose a card",
  clearCard: "Clear",

  helpDialogAriaLabel: "Keyboard shortcuts help",
  helpDialogTitle: "Keyboard shortcuts",
  helpCloseAriaLabel: "Close help",
  helpSectionVoting: "Vote (deck {{label}})",
  helpSectionAdmin: "Admin",
  helpClickOnly: "Cards {{cards}}: click only.",
  helpDisabled: "Disabled when a text field is focused.",
  helpReveal: "Reveal (voting phase)",
  helpRevote: "Re-vote this story (revealed phase)",
  helpCard: "Card",

  themeSystem: "system",
  themeLight: "light",
  themeDark: "dark",
};
