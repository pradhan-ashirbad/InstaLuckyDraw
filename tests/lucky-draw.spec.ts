import { test, expect, type Page } from "@playwright/test";
import * as XLSX from "xlsx";
import { readFile } from "node:fs/promises";

type Participant = {
  "Customer Id": string;
  Name: string;
  District: string;
  "Coupon Number": string;
  "Count of Total Coupons": number;
};
const participant = (id: number, count = 3): Participant => ({
  "Customer Id": `D${id}`,
  Name: `Partner ${id}`,
  District: "Mumbai",
  "Coupon Number": `C${id}`,
  "Count of Total Coupons": count,
});
const tab = async (page: Page, name: string) => {
  await page.getByRole("tab", { name, exact: true }).click();
};
async function upload(
  page: Page,
  rows: Participant[],
  format: "xlsx" | "csv" = "csv",
) {
  await tab(page, "Data Upload");
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Participants");
  const buffer =
    format === "xlsx"
      ? XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
      : Buffer.from(XLSX.utils.sheet_to_csv(sheet));
  await page.locator("#file").setInputFiles({
    name: `participants.${format}`,
    mimeType:
      format === "csv"
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  });
  await expect(page.getByRole("status")).toContainText(
    `${rows.length} coupons imported`,
  );
}
async function downloadWorkbook(page: Page, button: string) {
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: new RegExp(`^${button}`) }).click();
  const download = await promise;
  const path = await download.path();
  expect(path).toBeTruthy();
  return XLSX.read(await readFile(path!), { type: "buffer" });
}
async function singleWinnerCategories(page: Page) {
  await tab(page, "Manage Prizes");
  for (let i = 0; i < 5; i++) {
    await page
      .getByRole("button", { name: "Edit prize", exact: true })
      .nth(i)
      .click();
    await page.locator('input[id^="count-"]').fill("1");
    await page.getByRole("button", { name: "Save prize", exact: true }).click();
  }
}
async function assertNoOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // Network images are optional; app fallbacks are exercised without depending on third-party hosts.
  await page.route(/^https:\/\/(?!127\.0\.0\.1|localhost)/, (route) =>
    route.abort(),
  );
  (page as Page & { appErrors: string[] }).appErrors = errors;
});
test.afterEach(async ({ page }) => {
  expect((page as Page & { appErrors: string[] }).appErrors).toEqual([]);
});

test("navigation, empty states, upload validation and template", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: /Someone’s lucky moment/ }),
  ).toContainText("starts right here.");
  for (const name of [
    "Data Upload",
    "Data View",
    "Top Dealers",
    "Prize Gallery",
    "Manage Prizes",
    "Results",
    "Live draw",
  ]) {
    await tab(page, name);
    await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await assertNoOverflow(page);
  }
  await page
    .getByRole("button", { name: "Upload participants", exact: true })
    .click();
  await page.getByRole("tab", { name: "Data Upload", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Data View", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(
    page.getByRole("tab", { name: "Data Upload", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  const template = await downloadWorkbook(page, "Download template");
  expect(
    XLSX.utils.sheet_to_json(template.Sheets.Participants)[0],
  ).toMatchObject({ Name: "Example Dealer", "Coupon Number": "C001" });
  await page.locator("#file").setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Name,Incorrect Header\nSomeone,C1"),
  });
  await expect(page.getByRole("tabpanel").getByRole("alert")).toContainText(
    "Row 2 needs a Name and Coupon Number",
  );
  await page.locator("#file").setInputFiles({
    name: "empty.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Name,Coupon Number\n"),
  });
  await expect(page.getByRole("tabpanel").getByRole("alert")).toContainText(
    "This file is empty",
  );
  await upload(page, [participant(1)], "xlsx");
  await page.getByRole("button", { name: "Go to live draw" }).click();
  await expect(
    page.getByRole("button", { name: "Draw winner", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Sound on" }).click();
  await expect(page.getByRole("button", { name: "Sound off" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await assertNoOverflow(page);
});

test("data filtering, pagination, leaderboard and Excel view export", async ({
  page,
}) => {
  await upload(
    page,
    Array.from({ length: 60 }, (_, i) => participant(i + 1, i + 1)),
  );
  await tab(page, "Data View");
  await expect(page.locator("tbody tr")).toHaveCount(50);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(10);
  await page.getByRole("button", { name: "Prev", exact: true }).click();
  await page.locator("#ipp").selectOption("25");
  await expect(page.locator("tbody tr")).toHaveCount(25);
  await page.locator("#col").selectOption("Name");
  await page.locator("#search").fill("Partner 60");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  const exported = await downloadWorkbook(page, "Export View");
  expect(XLSX.utils.sheet_to_json(exported.Sheets["Filtered Data"])).toEqual([
    participant(60, 60),
  ]);
  await page.locator("#search").fill("No matching partner");
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await tab(page, "Top Dealers");
  await expect(page.getByText("Partner 60", { exact: true })).toBeVisible();
  await expect(page.getByText("60 Coupons", { exact: true })).toBeVisible();
  await assertNoOverflow(page);
});

test("prize CRUD, order, preset and custom theme persistence", async ({
  page,
}) => {
  await tab(page, "Manage Prizes");
  await page.getByRole("button", { name: "Midnight Navy" }).click();
  await expect(
    page.getByRole("button", { name: "Midnight Navy" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload({ waitUntil: "domcontentloaded" });
  await tab(page, "Manage Prizes");
  await expect(
    page.getByRole("button", { name: "Midnight Navy" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByTitle("Pick a custom color").fill("#ad79e3");
  await expect(page.locator(".event-app")).toHaveCSS(
    "--event-accent",
    "#ad79e3",
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".event-app")).toHaveCSS(
    "--event-accent",
    "#ad79e3",
  );
  await tab(page, "Manage Prizes");
  await page.getByRole("button", { name: "Add New Prize Category" }).click();
  await page.locator("#new-name").fill("Celebration hamper");
  await page.locator("#new-count").fill("2");
  await page.locator("#new-desc").fill("A special thank you");
  await page.getByRole("button", { name: "Save new prize" }).click();
  await expect(page.locator(".management-row")).toHaveCount(6);
  await page.getByRole("button", { name: "Move prize up" }).last().click();
  await expect(page.locator(".management-row").nth(4)).toContainText(
    "Celebration hamper",
  );
  await page
    .getByRole("button", { name: "Edit prize", exact: true })
    .nth(4)
    .click();
  await page.locator('input[id^="name-"]').fill("Partner hamper");
  await page.getByRole("button", { name: "Save prize", exact: true }).click();
  await expect(page.locator(".management-row").nth(4)).toContainText(
    "Partner hamper",
  );
  await page
    .getByRole("button", { name: "Delete prize", exact: true })
    .nth(4)
    .click();
  await expect(page.locator(".management-row")).toHaveCount(5);
  await assertNoOverflow(page);
});

test("complete live draw, envelope countdown and reveal, eligibility, exports and reset", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  // A deterministic selection checks exact business-rule outcomes; animation still runs in real time.
  await page.evaluate(() => {
    Math.random = () => 0;
  });
  const rows = [
    participant(1, 1),
    {
      ...participant(1, 1),
      Name: "Alternate name for D1",
      "Coupon Number": "C1-B",
    },
    participant(2, 1),
    { ...participant(22, 1), Name: "Partner 2" },
    participant(3, 1),
    participant(4, 1),
    { ...participant(5), Name: 'Premium "Partner", Five' },
    participant(6),
    participant(7),
  ];
  await upload(page, rows);
  await singleWinnerCategories(page);
  await tab(page, "Live draw");
  await page.getByRole("button", { name: "Sound on" }).click();
  const expected = [
    "Partner 1",
    "Partner 2",
    "Partner 3",
    'Premium "Partner", Five',
    "Partner 6",
  ];
  for (let i = 0; i < expected.length; i++) {
    const previousWinners = page
      .locator(".event-metric")
      .last()
      .locator("strong");
    await expect(previousWinners).toHaveText(String(i));
    await page
      .getByRole("button", { name: "Draw winner", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /The excitement is building/ }),
    ).toBeDisabled();
    await expect(
      page.getByRole("tab", { name: "Data Upload", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Reset all draws", exact: true }),
    ).toBeDisabled();
    await expect(page.locator(".gala-envelope")).toBeVisible();
    await expect(page.locator(".gala-drawing")).toContainText(
      "Your moment is waiting.",
    );
    await expect(page.locator(".gala-candidate, .name-reel")).toHaveCount(0);
    await expect(page.locator(".gala-drawing")).not.toContainText(expected[i]);
    for (const beat of ["3", "2", "1"]) {
      await expect(page.locator(".gala-countdown")).toHaveText(beat);
      await expect(page.locator(".winner-name")).toHaveCount(0);
      await expect(previousWinners).toHaveText(String(i));
    }
    await expect(page.locator(".phase-opening .gala-and-winner")).toHaveText(
      "And the winner is…",
    );
    // The letter rises clear of the pocket before the envelope fades away.
    await expect
      .poll(() =>
        page.locator(".envelope-letter").evaluate((letter) => {
          const back = letter.parentElement!.querySelector(".envelope-back")!;
          return (
            back.getBoundingClientRect().top -
            letter.getBoundingClientRect().top
          );
        }),
      )
      .toBeGreaterThan(55);
    await expect(page.locator(".phase-revealing")).toBeVisible();
    await expect(page.locator(".winner-name")).toHaveText(expected[i]);
    await expect(previousWinners).toHaveText(String(i + 1));
    await expect(page.locator(".winner-ticket")).toContainText(
      i < 3 ? `C${i + 1}` : i === 3 ? "C5" : "C6",
    );
    if (i === 0)
      await page.screenshot({
        path: testInfo.outputPath("winner-reveal.png"),
        fullPage: true,
      });
    await assertNoOverflow(page);
    await page
      .getByRole("button", {
        name: i === 4 ? "Complete event" : "Next category",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: /Congratulations to/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View & export results" }).click();
  const excel = await downloadWorkbook(page, "Export to Excel");
  expect(excel.SheetNames).toEqual(["Winners", "Summary"]);
  expect(XLSX.utils.sheet_to_json(excel.Sheets.Winners)).toHaveLength(5);
  const detailed = await downloadWorkbook(page, "Detailed Excel Report");
  expect(
    XLSX.utils.sheet_to_json(detailed.Sheets["Detailed Winners Report"])[3],
  ).toMatchObject({ District: "Mumbai", "Count of Total Coupons": 3 });
  const csv = await downloadWorkbook(page, "Export to CSV");
  expect(
    XLSX.utils.sheet_to_json(csv.Sheets[csv.SheetNames[0]])[3],
  ).toMatchObject({ "Winner Name": expected[3] });
  await tab(page, "Live draw");
  await page
    .getByRole("button", { name: "Reset all draws", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep results", exact: true }).click();
  await expect(page.locator(".event-metric").last()).toContainText("5");
  await page
    .getByRole("button", { name: "Reset all draws", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Reset all draws", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Draw winner", exact: true }),
  ).toBeEnabled();
  await expect(
    page.locator(".event-metric").last().locator("strong"),
  ).toHaveText("0");
});

test("reduced motion, exhausted pool, and full-screen interaction", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await upload(page, [participant(1)]);
  await tab(page, "Live draw");
  await page.getByRole("button", { name: "Full screen", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Exit full screen", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Exit full screen", exact: true })
    .click();
  await page.getByRole("button", { name: "Sound on" }).click();
  await page.getByRole("button", { name: "Draw winner", exact: true }).click();
  await expect(
    page.getByText("Selecting your next winner…", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".gala-envelope")).toHaveCount(0);
  await expect(page.locator(".winner-name")).toHaveText("Partner 1");
  await expect(
    page.getByRole("button", { name: "Draw next winner", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText(/No eligible coupons remain for this prize/),
  ).toBeVisible();
  await assertNoOverflow(page);
});

test("bundled audio and mute control preserve the live draw timeline", async ({
  page,
}) => {
  await upload(page, [participant(1)]);
  await tab(page, "Live draw");
  const trackResponse = page.waitForResponse((response) =>
    response.url().includes("/sounds/kbc.mp3"),
  );
  await page.getByRole("button", { name: "Draw winner", exact: true }).click();
  expect((await trackResponse).status()).toBeLessThan(400);
  await expect(page.locator(".is-drawing.phase-preparing")).toBeVisible();
  await page.getByRole("button", { name: "Sound on" }).click();
  await expect(page.getByRole("button", { name: "Sound off" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.locator(".winner-name")).toHaveText("Partner 1");
  await expect(
    page.locator(".event-metric").last().locator("strong"),
  ).toHaveText("1");
});

test("repeated draws in one category exclude prior winners", async ({
  page,
}) => {
  await page.evaluate(() => {
    Math.random = () => 0;
  });
  await upload(page, [participant(1), participant(2)]);
  await tab(page, "Live draw");
  await page.getByRole("button", { name: "Sound on" }).click();
  await page.getByRole("button", { name: "Draw winner", exact: true }).click();
  await expect(page.locator(".winner-name")).toHaveText("Partner 1");
  await page
    .getByRole("button", { name: "Draw next winner", exact: true })
    .click();
  await expect(page.locator(".winner-name")).toHaveText("Partner 2");
  await expect(page.locator(".winner-feed-row")).toHaveCount(2);
  await expect(
    page.locator(".event-metric").last().locator("strong"),
  ).toHaveText("2");
  await expect(
    page.getByRole("button", { name: "Draw next winner", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".prize-spotlight h3")).toHaveText("MICROWAVE");
});
