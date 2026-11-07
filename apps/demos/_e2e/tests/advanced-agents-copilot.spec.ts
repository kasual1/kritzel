import type { Page, Route } from '@playwright/test';
import { test, expect } from '../fixtures/editor.fixture';

// The copilot page only exists in the React demo app.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'demos-react', 'The agent copilot is a React-only demo.');
});

type EditorElement = HTMLElement & {
  findObjects(predicate: (obj: any) => boolean): Promise<any[]>;
  selectObjects(objects: unknown[]): Promise<void>;
};

const waitForIdle = (page: Page) => expect(page.getByTestId('copilot-state')).toHaveAttribute('data-running', 'false', { timeout: 100_000 });

test.describe('Agent Copilot', () => {
  test('sorts the notes with the offline model and leaves a note the user is working on alone', async ({ editorPage, page }) => {
    test.setTimeout(120_000);
    await editorPage.goto('/advanced/agents/copilot');
    await editorPage.waitForReady();

    await page.getByRole('button', { name: 'Sort these notes into themes' }).click();
    await expect(page.getByTestId('copilot-state')).toHaveAttribute('data-running', 'true');
    // The user takes "Pizza night" before the copilot gets to the food notes.
    await expect(page.getByText('Moving the logistics notes.')).toBeVisible({ timeout: 30_000 });
    await page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const [pizza] = await editor.findObjects(obj => obj.__class__ === 'KritzelShape' && JSON.stringify(obj.content ?? '').includes('Pizza night'));
      await editor.selectObjects([pizza]);
    });
    await waitForIdle(page);

    const refused = page.locator('[data-testid=copilot-tool][data-status=failed]');
    await expect(refused.first()).toContainText('user-selected');
    await expect(page.getByTestId('copilot-assistant').last()).toHaveText(
      'Sorted 8 notes into 3 themes. I left “Pizza night” where it is because you\'re working on it.',
    );
    // The theme headers were created by the copilot, so they belong to its history.
    await expect(page.getByRole('button', { name: 'Undo copilot' })).toBeEnabled();
  });

  test('runs the tool-use loop against Claude with the agent\'s tools', async ({ editorPage, page }) => {
    test.setTimeout(60_000);
    const requests: any[] = [];
    // Stands in for the Messages API: observe first, then restyle a note, then answer.
    await page.route('https://api.anthropic.com/**', async (route: Route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
        return;
      }
      const body = route.request().postDataJSON();
      requests.push(body);
      let content: unknown[];
      let stop_reason: string;
      if (requests.length === 1) {
        content = [{ type: 'tool_use', id: 'toolu_1', name: 'observe_canvas', input: {} }];
        stop_reason = 'tool_use';
      } else if (requests.length === 2) {
        const snapshot = JSON.parse(body.messages.at(-1).content[0].content);
        const coffee = snapshot.objects.find((object: { text?: string }) => object.text === 'Coffee bar');
        content = [{ type: 'tool_use', id: 'toolu_2', name: 'set_style', input: { objectIds: [coffee.id], style: { fillColor: '#fde2ea' } } }];
        stop_reason = 'tool_use';
      } else {
        content = [{ type: 'text', text: 'Made the coffee note pink.' }];
        stop_reason = 'end_turn';
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ id: `msg_${requests.length}`, type: 'message', role: 'assistant', model: body.model, content, stop_reason, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } }),
      });
    });

    await editorPage.goto('/advanced/agents/copilot');
    await editorPage.waitForReady();
    await page.getByRole('button', { name: 'Claude', exact: true }).click();
    await page.getByLabel('Anthropic API key').fill('sk-ant-test');
    await page.getByLabel('Prompt').fill('Make the coffee note pink');
    await page.getByRole('button', { name: 'Send' }).click();
    await waitForIdle(page);

    await expect(page.getByTestId('copilot-assistant').last()).toHaveText('Made the coffee note pink.');
    expect(requests).toHaveLength(3);
    expect(requests[0].model).toBe('claude-opus-5-5');
    expect(requests[0].tools.map((tool: { name: string }) => tool.name)).toContain('observe_canvas');
    expect(Object.keys(requests[0].tools[0])).toEqual(['name', 'description', 'input_schema']);
    // Every tool call is answered with a result in the next user message.
    const results = requests[2].messages.at(-1).content;
    expect(results[0]).toMatchObject({ type: 'tool_result', tool_use_id: 'toolu_2' });
    expect(JSON.parse(results[0].content)).toMatchObject({ completed: true });
  });
});
