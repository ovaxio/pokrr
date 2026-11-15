import type { Locale } from "@/i18n/types";

type ChangelogEntry = {
  date: string;
  text: Record<Locale, { title: string; body: string }>;
};

// Du plus récent au plus ancien : la page affiche ce tableau sans le trier (ordre vérifié par tests/unit/content/changelog.test.ts).
export const changelog: readonly ChangelogEntry[] = [
  {
    date: "2026-11-11",
    text: {
      fr: {
        title: "Réactions",
        body: "Chaque participant peut lancer un emoji, un avion ou une boulette en papier sur la carte d'un autre joueur. L'admin peut désactiver les réactions pour la salle.",
      },
      en: {
        title: "Reactions",
        body: "Anyone in the room can throw an emoji, a paper plane or a paper ball at another player's card. The admin can turn reactions off for the room.",
      },
    },
  },
  {
    date: "2026-09-29",
    text: {
      fr: {
        title: "Révélation par l'admin par défaut",
        body: "Les votes ne se révèlent plus tout seuls quand tout le monde a voté : l'admin choisit le moment. La case « Auto-révéler » rétablit la révélation automatique.",
      },
      en: {
        title: "Admin reveals by default",
        body: "Votes no longer reveal themselves once everyone has voted: the admin picks the moment. The \"Auto-reveal\" checkbox turns automatic reveal back on.",
      },
    },
  },
  {
    date: "2026-08-05",
    text: {
      fr: {
        title: "Deck Fibonacci + ½",
        body: "La suite de Fibonacci classique avec une carte ½ en plus, pour les toutes petites stories.",
      },
      en: {
        title: "Fibonacci + ½ deck",
        body: "The classic Fibonacci sequence plus a ½ card, for very small stories.",
      },
    },
  },
  {
    date: "2026-05-30",
    text: {
      fr: {
        title: "Version anglaise",
        body: "Tout le site, salles comprises, existe en anglais. Un bouton en haut de page change de langue.",
      },
      en: {
        title: "English version",
        body: "The whole site, rooms included, is available in English. A button at the top of the page switches language.",
      },
    },
  },
  {
    date: "2026-05-29",
    text: {
      fr: {
        title: "Aperçu du lien de salle",
        body: "Partagé dans un outil de chat, le lien d'une salle s'affiche avec une image qui montre le code de la salle et invite à la rejoindre.",
      },
      en: {
        title: "Room link preview",
        body: "Shared in a chat app, a room link shows an image with the room code and an invitation to join.",
      },
    },
  },
  {
    date: "2026-05-27",
    text: {
      fr: {
        title: "Plusieurs admins et mode spectateur",
        body: "Un admin peut nommer d'autres admins ou leur retirer le rôle. Qui veut suivre sans voter rejoint en spectateur et ne compte pas dans les votes.",
      },
      en: {
        title: "Multiple admins and spectator mode",
        body: "An admin can make other players admins or remove the role. People who only want to follow join as spectators and don't count in the votes.",
      },
    },
  },
  {
    date: "2026-05-16",
    text: {
      fr: {
        title: "Minuteur, cinq decks, export Markdown",
        body: "Un minuteur par story pour garder le rythme, cinq decks au choix (Fibonacci, Fibonacci modifiée, T-shirt, puissances de 2, heures) et des résultats à copier en Markdown dans un ticket ou un compte-rendu.",
      },
      en: {
        title: "Timer, five decks, Markdown export",
        body: "A per-story timer to keep the pace, five decks to choose from (Fibonacci, modified Fibonacci, T-shirt, powers of 2, hours) and results you can copy as Markdown into a ticket or meeting notes.",
      },
    },
  },
  {
    date: "2026-05-15",
    text: {
      fr: {
        title: "Changer de pseudo dans la salle",
        body: "Un clic sur son propre nom dans la liste des joueurs permet de le modifier, sans quitter la salle.",
      },
      en: {
        title: "Rename yourself in the room",
        body: "Click your own name in the player list to change it without leaving the room.",
      },
    },
  },
  {
    date: "2026-05-15",
    text: {
      fr: {
        title: "Thème clair ou sombre",
        body: "Clair, sombre ou aligné sur le système, au choix, et retenu par le navigateur.",
      },
      en: {
        title: "Light or dark theme",
        body: "Light, dark or following your system setting, remembered by your browser.",
      },
    },
  },
  {
    date: "2026-05-15",
    text: {
      fr: {
        title: "Relais automatique de l'admin",
        body: "Si plus aucun admin n'est en ligne, le rôle passe au plus ancien votant présent : la session peut continuer.",
      },
      en: {
        title: "Automatic admin handover",
        body: "If no admin is online anymore, the role passes to the earliest voter still in the room, so the session can go on.",
      },
    },
  },
  {
    date: "2026-05-15",
    text: {
      fr: {
        title: "Lancement de pokrr",
        body: "Des salles sans inscription, partagées par lien ou QR code, utilisables sur ordinateur comme sur téléphone. Les votes restent cachés jusqu'à la révélation, puis moyenne, médiane et répartition s'affichent. Raccourcis clavier pour voter et révéler.",
      },
      en: {
        title: "pokrr launches",
        body: "Rooms with no sign-up, shared by link or QR code, usable on desktop and mobile. Votes stay hidden until the reveal, then the mean, median and distribution appear. Keyboard shortcuts to vote and reveal.",
      },
    },
  },
];
