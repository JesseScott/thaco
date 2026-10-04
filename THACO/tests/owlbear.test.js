import { test, expect } from '@playwright/test';

// Embeds the app in a fake Owlbear host page that speaks just enough of the
// SDK message protocol (OBR_READY handshake, OBR_NOTIFICATION_SHOW) to let the
// real SDK run, and records every notification the app shows.
const HOST_PATH = '/obr-host.html';

function hostPage(origin) {
  const obrref = Buffer.from(`${origin} test-room`).toString('base64');
  return `<!doctype html>
<iframe id="app" src="/?obrref=${encodeURIComponent(obrref)}" style="width:380px;height:460px;border:0"></iframe>
<script>
  window.shown = [];
  window.heights = [];
  const frame = document.getElementById('app');
  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message && message.id === 'OBR_ACTION_SET_HEIGHT') {
      window.heights.push(message.data.height);
      frame.contentWindow.postMessage(
        { id: 'OBR_ACTION_SET_HEIGHT_RESPONSE' + message.nonce, data: {} },
        location.origin
      );
      return;
    }
    if (!message || message.id !== 'OBR_NOTIFICATION_SHOW') return;
    window.shown.push(message.data.message);
    frame.contentWindow.postMessage(
      { id: 'OBR_NOTIFICATION_SHOW_RESPONSE' + message.nonce, data: { id: 'n' + window.shown.length } },
      location.origin
    );
  });
  frame.addEventListener('load', () => {
    frame.contentWindow.postMessage(
      { id: 'OBR_READY', data: { ref: 'test-ref', userId: 'test-user' } },
      location.origin
    );
  });
</script>`;
}

async function openInOwlbear(page, baseURL) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const origin = new URL(baseURL).origin;
  await page.route(`**${HOST_PATH}`, (route) =>
    route.fulfill({ contentType: 'text/html', body: hostPage(origin) })
  );
  await page.goto(HOST_PATH);
  const app = page.frameLocator('#app');
  await expect(app.locator('#roll-btn')).toBeVisible();
  // Give the handshake a moment so the notifier is marked ready.
  await page.waitForTimeout(200);
  return {
    app,
    errors,
    shown: () => page.evaluate(() => window.shown),
    heights: () => page.evaluate(() => window.heights),
  };
}

test('rolling inside Owlbear shows a HIT/MISS notification', async ({ page, baseURL }) => {
  const { app, errors, shown } = await openInOwlbear(page, baseURL);

  await app.locator('#roll-btn').click();

  await expect.poll(shown).toHaveLength(1);
  const [message] = await shown();
  expect(message).toMatch(/^Rolled \d+: (HIT|MISS)$/);
  expect(errors).toEqual([]);
});

test('rolling in hit AC mode shows the AC calculation notification', async ({ page, baseURL }) => {
  const { app, errors, shown } = await openInOwlbear(page, baseURL);

  await app.locator('#mode-toggle').check();
  await app.locator('#roll-btn').click();

  await expect.poll(shown).toHaveLength(1);
  const [message] = await shown();
  expect(message).toMatch(/^Rolled \d+ for AC calculation$/);
  expect(errors).toEqual([]);
});

test('deleting the last entry inside Owlbear shows a notification', async ({ page, baseURL }) => {
  const { app, errors, shown } = await openInOwlbear(page, baseURL);

  await app.locator('#entry-accordion summary').click();
  await app.locator('#delete-entry-btn').click();

  await expect.poll(shown).toEqual(['Cannot delete the last entry']);
  expect(errors).toEqual([]);
});

test('rolling outside Owlbear works without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');

  await page.click('#roll-btn');

  await expect(page.locator('#roll-output')).not.toHaveClass(/empty/);
  expect(errors).toEqual([]);
});

test('the popover height is sized to the content', async ({ page, baseURL }) => {
  const { app, errors, heights } = await openInOwlbear(page, baseURL);

  await expect.poll(async () => (await heights()).length).toBeGreaterThan(0);
  const collapsed = (await heights()).at(-1);
  const contentHeight = await app.locator('#app').evaluate((el) => el.offsetHeight);
  expect(collapsed).toBe(contentHeight);
  expect(collapsed).toBeGreaterThan(250);
  expect(collapsed).toBeLessThan(400);
  expect(errors).toEqual([]);
});

test('opening the profile accordion grows the popover and closing shrinks it', async ({ page, baseURL }) => {
  const { app, heights } = await openInOwlbear(page, baseURL);
  await expect.poll(async () => (await heights()).length).toBeGreaterThan(0);
  const collapsed = (await heights()).at(-1);

  await app.locator('#entry-accordion summary').click();
  await expect.poll(async () => (await heights()).at(-1)).toBeGreaterThan(collapsed);

  await app.locator('#entry-accordion summary').click();
  await expect.poll(async () => (await heights()).at(-1)).toBe(collapsed);
});
