import { expect, test, type Browser } from "@playwright/test";

// Pas d'assertion CSP ici : ce spec tourne sur `npm run dev`, où style-src contient
// 'unsafe-inline'. La conformité CSP se vérifie sur un build de prod.
test.describe("Réactions projectiles : barre armée, objets en papier, spectateurs", () => {
  test("spectatrice qui lance et reçoit des objets, armer, lancer d'affilée, désarmer, raccourcis, interrupteur admin", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const alice = await openClient(browser);
    const bob = await openClient(browser);
    const carol = await openClient(browser);

    await alice.page.goto("/");
    await alice.page.getByRole("button", { name: /créer une salle/i }).click();
    await expect(alice.page).toHaveURL(/\/room\//);
    const roomCode = alice.page.url().split("/room/")[1];

    // Alice reste spectatrice (créatrice, donc admin) jusqu'à l'étape 5.
    await alice.joinAs("Alice");
    await bob.page.goto(`/room/${roomCode}`);
    await bob.joinAs("Bob");
    await carol.page.goto(`/room/${roomCode}`);
    await carol.joinAs("Carol");

    const bar = alice.page.getByRole("group", { name: "Emoji à lancer" });
    const bobBar = bob.page.getByRole("group", { name: "Emoji à lancer" });
    const throwBtn = (name: string, what = "👏") =>
      alice.page.getByRole("button", { name: `Lancer ${what} à ${name}` });
    const anyThrow = alice.page.getByRole("button", { name: /^Lancer/ });

    // (1) la spectatrice voit la barre de 12 boutons, rien de pressé, aucun bouton de lancer
    await expect(bar).toBeVisible({ timeout: 10_000 });
    await expect(bar.getByRole("button")).toHaveCount(12);
    await expect(bar.locator('button[aria-pressed="true"]')).toHaveCount(0);
    await expect(anyThrow).toHaveCount(0);

    // (2) armer l'avion : bouton de lancer sur Bob, pas sur soi
    const plane = bar.getByRole("button", { name: "un avion en papier" });
    await plane.click();
    await expect(plane).toHaveAttribute("aria-pressed", "true");
    await expect(throwBtn("Bob", "un avion en papier")).toBeVisible();
    await expect(throwBtn("Alice", "un avion en papier")).toHaveCount(0);

    // (3) la spectatrice lance l'avion sur Bob : aria-disabled immédiat, SVG et annonce chez Bob
    await throwBtn("Bob", "un avion en papier").click();
    await expect(throwBtn("Bob", "un avion en papier")).toHaveAttribute("aria-disabled", "true");
    await expect(bob.page.locator('[data-projectile="plane"] svg').first()).toBeVisible({ timeout: 2_000 });
    await expect(bob.page.getByText("Alice t'a envoyé un avion en papier")).toBeAttached();

    // (4) Bob lance une boulette sur la carte spectatrice d'Alice
    const ball = bobBar.getByRole("button", { name: "une boulette de papier" });
    await ball.click();
    await expect(ball).toHaveAttribute("aria-pressed", "true");
    await bob.page.getByRole("button", { name: "Lancer une boulette de papier à Alice" }).click();
    await expect(alice.page.locator('[data-projectile="ball"] svg').first()).toBeVisible({ timeout: 2_000 });
    // Le vol d'une boulette dure au plus environ 2 s (1693 à 1984 ms mesurés) : après 2,1 s le
    // sprite de Bob est fini et sa dernière annonce date de plus de 2 s (limite d'une annonce
    // toutes les 2 s par client), ce que l'étape « Alice t'a envoyé 👏 » exige.
    await bob.page.waitForTimeout(2_100);
    await expect(bob.page.locator("[data-projectile]")).toHaveCount(0, { timeout: 5_000 });

    // (5) désarmer l'avion, puis rejoindre le vote
    await plane.click();
    await expect(plane).toHaveAttribute("aria-pressed", "false");
    await expect(anyThrow).toHaveCount(0);
    await alice.page.getByRole("button", { name: /rejoindre le vote/i }).click();
    await expect(alice.page.getByRole("radio", { name: "Vote 5", exact: true })).toBeVisible({ timeout: 10_000 });

    // (6) armer 👏
    const clap = bar.getByRole("button", { name: "👏" });
    await clap.click();
    await expect(clap).toHaveAttribute("aria-pressed", "true");

    // (7) lancer sur Bob : aria-disabled immédiat, sprite et annonce chez Bob
    await throwBtn("Bob").click();
    await expect(throwBtn("Bob")).toHaveAttribute("aria-disabled", "true");
    await expect(bob.page.locator("[data-projectile]").first()).toBeVisible({ timeout: 2_000 });
    await expect(bob.page.getByText("Alice t'a envoyé 👏")).toBeAttached();

    // (8) fin du cooldown, lancer sur Carol sans toucher la barre. On attend 2,1 s depuis le
    // premier lancer : l'annonce aria-live est limitée à une toutes les 2 s par client.
    await expect(throwBtn("Carol")).not.toHaveAttribute("aria-disabled", "true", { timeout: 3_000 });
    await alice.page.waitForTimeout(900);
    await throwBtn("Carol").click();
    await expect(carol.page.getByText("Alice t'a envoyé 👏")).toBeAttached({ timeout: 3_000 });

    // (9) touche chiffre avec le focus dans la barre : pas de vote
    await expect(throwBtn("Carol")).not.toHaveAttribute("aria-disabled", "true", { timeout: 3_000 });
    await bar.getByRole("button", { name: "🔥" }).focus();
    await alice.page.keyboard.press("5");
    await expect(alice.page.getByRole("radio", { name: "Vote 5", exact: true })).not.toBeChecked();

    // (10) désarmer : plus de bouton de lancer, un clic à l'ancienne position ne lance rien
    const box = await throwBtn("Bob").boundingBox();
    expect(box).not.toBeNull();
    await clap.click();
    await expect(clap).toHaveAttribute("aria-pressed", "false");
    await expect(anyThrow).toHaveCount(0);
    // Attendre la fin du vol précédent pour que le compte de référence soit 0.
    await expect(bob.page.locator("[data-projectile]")).toHaveCount(0, { timeout: 4_000 });
    await alice.page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await alice.page.waitForTimeout(1_500);
    await expect(bob.page.locator("[data-projectile]")).toHaveCount(0);

    // (11) interrupteur admin : la barre de Bob disparaît
    await expect(bobBar).toBeVisible();
    // click et non uncheck : la case est pilotée par l'état serveur (aller-retour WebSocket).
    await alice.page.getByRole("checkbox", { name: "Réactions" }).click();
    await expect(bobBar).toBeHidden({ timeout: 5_000 });

    await alice.context.close();
    await bob.context.close();
    await carol.context.close();
  });
});

async function openClient(browser: Browser) {
  const context = await browser.newContext({ locale: "fr-FR" });
  const page = await context.newPage();
  return {
    context,
    page,
    async joinAs(name: string) {
      const input = page.getByRole("textbox", { name: "Pseudo" });
      await expect(input).toBeVisible({ timeout: 10_000 });
      await input.fill(name);
      await page.getByRole("button", { name: /entrer/i }).click();
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible({ timeout: 10_000 });
    },
  };
}
