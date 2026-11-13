import type { Page, Route } from '@playwright/test';
import { test, expect, EditorPage } from '../fixtures/editor.fixture';

type EditorElement = HTMLElement & {
  findObjects(predicate: (obj: any) => boolean): Promise<any[]>;
  selectObjects(objects: unknown[]): Promise<void>;
};

const MODEL_IFRAME_CONTENT_SECURITY_POLICY =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:";

const openGenerativeUi = async (page: Page) => {
  const editorPage = new EditorPage(page);
  await editorPage.goto('/examples/generative-ui');
  await editorPage.waitForReady();
  return editorPage;
};

/** The UIs on the canvas, in the order they were added. */
const uis = (page: Page) =>
  page.evaluate(async () => {
    const editor = document.querySelector('updraw-editor') as EditorElement;
    const iframes = await editor.findObjects(obj => obj.__class__ === 'UpdrawIframeObject');
    return iframes.map(ui => ({
      id: ui.id as string,
      name: ui.name as string,
      isLoading: ui.isLoading as boolean,
      contentSecurityPolicy: ui.contentSecurityPolicy as string | undefined,
      html: ui.content.html as string,
    }));
  });

/** A server-sent events body of the given Anthropic stream events. */
const anthropicStream = (events: object[]) => events.map(event => `event: ${(event as { type: string }).type}\ndata: ${JSON.stringify(event)}\n\n`).join('');

const COUNTER = { name: 'Counter', x: 0, y: 0, width: 400, height: 300, html: '<button id="add">0</button>', css: '', script: '' };

/** Answers like Claude: the first step creates a widget, the step after its tool result ends the prompt. */
async function fakeClaude(route: Route) {
  const body = route.request().postDataJSON();
  const last = body.messages[body.messages.length - 1];
  const answered = last.content.some((block: { type: string }) => block.type === 'tool_result');
  const events = answered
    ? [
        { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
        { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Done.' } },
        { type: 'content_block_stop', index: 0 },
        { type: 'message_delta', delta: { stop_reason: 'end_turn' } },
      ]
    : [
        { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } },
        { type: 'content_block_delta', index: 0, delta: { type: 'signature_delta', signature: 'signature-1' } },
        { type: 'content_block_stop', index: 0 },
        { type: 'content_block_start', index: 1, content_block: { type: 'tool_use', id: 'toolu_1', name: 'create_iframe', input: {} } },
        { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: JSON.stringify(COUNTER) } },
        { type: 'content_block_stop', index: 1 },
        { type: 'message_delta', delta: { stop_reason: 'tool_use' } },
      ];
  await route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body: anthropicStream([...events, { type: 'message_stop' }]) });
}

test.describe('Generative UI', () => {
  test('mocked requests build a canned UI in a sandboxed widget and turn its selection into a chip', async ({ page }) => {
    const editorPage = await openGenerativeUi(page);

    await page.getByRole('button', { name: /Mock the requests/ }).click();
    await page.getByRole('button', { name: /pomodoro timer/i }).click();

    await expect
      .poll(() => uis(page))
      .toEqual([expect.objectContaining({ name: 'Pomodoro Timer', isLoading: false, contentSecurityPolicy: MODEL_IFRAME_CONTENT_SECURITY_POLICY })]);
    await editorPage.waitForChatIdle();

    await page.evaluate(async () => {
      const editor = document.querySelector('updraw-editor') as EditorElement;
      await editor.selectObjects(await editor.findObjects(obj => obj.__class__ === 'UpdrawIframeObject'));
    });
    await expect(editorPage.chatChips).toHaveCount(1);
    await expect(editorPage.chatChips).toContainText('Pomodoro Timer');
  });

  test('a key of its own builds a widget with the model and sends Claude its blocks back', async ({ page }) => {
    const requests: any[] = [];
    await page.route('https://api.anthropic.com/v1/messages', async route => {
      requests.push(route.request().postDataJSON());
      await fakeClaude(route);
    });
    const editorPage = await openGenerativeUi(page);

    await page.getByRole('button', { name: /Use a real API key/ }).click();
    await page.locator('#generative-ui-key').fill('sk-ant-test');
    await page.getByRole('button', { name: 'Connect' }).click();
    await editorPage.sendChatPrompt('A counter');

    await expect.poll(() => uis(page)).toEqual([expect.objectContaining({ name: 'Counter', isLoading: false, html: COUNTER.html })]);
    await editorPage.waitForChatIdle();

    expect(requests).toHaveLength(2);
    const [, followUp] = requests;
    expect(followUp.messages[1]).toEqual({
      role: 'assistant',
      content: [
        { type: 'thinking', thinking: '', signature: 'signature-1' },
        { type: 'tool_use', id: 'toolu_1', name: 'create_iframe', input: COUNTER },
      ],
    });
    expect(followUp.messages[2].content[0]).toMatchObject({ type: 'tool_result', tool_use_id: 'toolu_1' });
  });

  test('a rejected key ends the prompt with a notification', async ({ page }) => {
    await page.route('https://api.anthropic.com/v1/messages', route =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { message: 'invalid x-api-key' } }) }),
    );
    const editorPage = await openGenerativeUi(page);

    await page.getByRole('button', { name: /Use a real API key/ }).click();
    await page.locator('#generative-ui-key').fill('sk-ant-wrong');
    await page.getByRole('button', { name: 'Connect' }).click();
    await editorPage.sendChatPrompt('A counter');

    await expect(page.getByText('Anthropic: invalid x-api-key (401)')).toBeVisible();
    await editorPage.waitForChatIdle();
    expect(await uis(page)).toEqual([]);
  });
});
