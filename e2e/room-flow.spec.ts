import { expect, test, type Browser, type Page } from "@playwright/test";

test.describe("Room flow — 3 voters happy path", () => {
  test("create / join / vote / auto-reveal / next story", async ({ browser }) => {
    test.setTimeout(60_000);

    const alice = await openClient(browser);
    const bob = await openClient(browser);
    const carol = await openClient(browser);

    // 1. Alice crée une room depuis la home.
    await alice.page.goto("/");
    await alice.page.getByRole("button", { name: /créer une salle/i }).click();
    await expect(alice.page).toHaveURL(/\/room\//);

    const roomUrl = alice.page.url();
    const roomCode = roomUrl.split("/room/")[1];
    expect(roomCode).toMatch(/^[2-9A-HJ-NP-Z]{10}$/);

    // 2. Alice rentre son pseudo via la JoinModal.
    await alice.joinAs("Alice");

    // 3. Bob et Carol rejoignent en collant le lien.
    await bob.page.goto(`/room/${roomCode}`);
    await bob.joinAs("Bob");

    await carol.page.goto(`/room/${roomCode}`);
    await carol.joinAs("Carol");

    // 4. Les 3 voters sont visibles côté Alice.
    await expect(alice.page.getByText("Alice", { exact: false })).toBeVisible();
    await expect(alice.page.getByText("Bob", { exact: false })).toBeVisible();
    await expect(alice.page.getByText("Carol", { exact: false })).toBeVisible();

    // 5. Alice (admin) définit la story.
    await alice.page.getByRole("button", { name: /définir|modifier/i }).click();
    await alice.page.getByPlaceholder(/titre de la story/i).fill("Refacto auth middleware");
    await alice.page.getByRole("button", { name: /enregistrer/i }).click();
    await expect(alice.page.getByRole("heading", { name: /refacto auth middleware/i })).toBeVisible();

    // 6. Chaque voter sélectionne une carte.
    await alice.page.getByRole("radio", { name: "Vote 5", exact: true }).click();
    await bob.page.getByRole("radio", { name: "Vote 8", exact: true }).click();
    await carol.page.getByRole("radio", { name: "Vote 13", exact: true }).click();

    // 7. Auto-reveal déclenche quand tous ont voté.
    await expect(alice.page.getByText(/résultats/i)).toBeVisible({ timeout: 5_000 });
    await expect(bob.page.getByText(/résultats/i)).toBeVisible({ timeout: 5_000 });

    // 8. Moyenne (5+8+13)/3 = 8.7 affichée.
    await expect(alice.page.getByText("8.7", { exact: false })).toBeVisible();

    // 9. Alice passe à la story suivante.
    await alice.page.getByPlaceholder(/story suivante/i).fill("Migration DB Postgres 17");
    await alice.page.getByRole("button", { name: /story suivante/i }).click();

    // 10. Les 3 voient la nouvelle story + deck réactivé.
    await expect(alice.page.getByRole("heading", { name: /migration db postgres 17/i })).toBeVisible();
    await expect(bob.page.getByRole("heading", { name: /migration db postgres 17/i })).toBeVisible();
    await expect(carol.page.getByRole("heading", { name: /migration db postgres 17/i })).toBeVisible();

    // Les cartes sont à nouveau sélectionnables (pas le badge "verrouillées").
    await expect(alice.page.getByText(/cartes verrouillées/i)).not.toBeVisible();

    // Cleanup
    await alice.context.close();
    await bob.context.close();
    await carol.context.close();
  });
});

// Helper : un client avec son contexte browser isolé (localStorage séparé).
async function openClient(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  return {
    context,
    page,
    async joinAs(name: string) {
      const input = page.getByRole("textbox", { name: "Pseudo" });
      await expect(input).toBeVisible({ timeout: 10_000 });
      await input.fill(name);
      await page.getByRole("button", { name: /entrer/i }).click();
      // Le pseudo apparaît dans la player list après ws join.
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible({ timeout: 10_000 });
    },
  };
}

// Type guard pour Page (réutilisable si on étend).
export type RoomClient = { context: Awaited<ReturnType<Browser["newContext"]>>; page: Page };
