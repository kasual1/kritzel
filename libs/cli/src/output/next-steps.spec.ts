import { nextSteps } from './next-steps';

describe('generation next steps', () => {
  test.each([
    ['angular', 'editor', ['src/app/kritzel-canvas/kritzel-canvas.component.ts']],
    ['angular', 'engine', ['src/app/kritzel-canvas/kritzel-canvas.component.ts']],
    ['react', 'editor', ['src/components/kritzel-canvas/KritzelCanvas.tsx']],
    ['react', 'engine', ['src/components/kritzel-canvas/KritzelCanvas.tsx']],
    ['vue', 'editor', ['src/components/kritzel-canvas/KritzelCanvas.vue']],
    ['vue', 'engine', ['src/components/kritzel-canvas/KritzelCanvas.vue']],
  ] as const)('%s %s instructions use its generated path and framework package', (framework, component, files) => {
    const output = nextSteps(framework, component, [...files]);
    expect(output).toContain(files[0]);
    expect(output).toContain(`https://kritzel.io/docs/${framework}/`);
    expect(output).toContain('distinct editorId');
  });

  test('prints Angular registration and standalone component instructions', () => {
    const output = nextSteps('angular', 'editor', [
      'src/app/kritzel-canvas/kritzel-canvas.component.ts',
      'src/app/kritzel-canvas/kritzel-canvas.component.html',
      'src/app/kritzel-canvas/kritzel-canvas.component.scss',
    ]);

    expect(output).toContain("provideKritzel from '@kritzel/angular-editor'");
    expect(output).toContain("KritzelCanvasComponent from './kritzel-canvas/kritzel-canvas.component'");
    expect(output).toContain('<kritzel-canvas />');
    expect(output).toContain('NgModule');
  });

  test.each(['angular', 'react', 'vue'] as const)('engine instructions never select the editor wrapper (%s)', framework => {
    const output = nextSteps(framework, 'engine', []);

    expect(output).toContain(`@kritzel/${framework}-engine`);
    expect(output).toContain('has no built-in UI');
    expect(output).toContain('tool registration');
    expect(output).not.toContain(`@kritzel/${framework}-editor`);
  });

  test('prints an installation-only example when no component was generated', () => {
    expect(nextSteps('react', 'editor', [])).toContain("@kritzel/react-editor");
    expect(nextSteps('vue', 'editor', [])).toContain('@isReady');
  });
});
