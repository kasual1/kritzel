import { parsePartialJson } from './partial-json.helper';

describe('parsePartialJson', () => {
  it('reads complete JSON like JSON.parse', () => {
    const values = [{ a: 1, b: [true, false, null], c: { d: 'e "quoted" \\n' } }, [1, -2.5, 3e2], 'text', true, null];
    for (const value of values) {
      expect(parsePartialJson(JSON.stringify(value))).toEqual(value);
      expect(parsePartialJson(JSON.stringify(value, null, 2))).toEqual(value);
    }
  });

  it('keeps every member a cut-off object has finished', () => {
    const json = JSON.stringify({ name: 'Counter', x: 10, y: -20.5, width: 320, height: 240, html: '<button>+</button>' });
    const seen: unknown[] = [];
    for (let length = 0; length <= json.length; length++) {
      const value = parsePartialJson(json.slice(0, length));
      expect(value === undefined || (typeof value === 'object' && value !== null)).toBe(true);
      seen.push(value);
    }
    expect(seen[1]).toEqual({});
    expect(parsePartialJson('{"name":"Coun')).toEqual({});
    expect(parsePartialJson('{"name":"Counter"')).toEqual({ name: 'Counter' });
    expect(parsePartialJson('{"name":"Counter","x":1')).toEqual({ name: 'Counter' });
    expect(parsePartialJson('{"name":"Counter","x":10,')).toEqual({ name: 'Counter', x: 10 });
    expect(parsePartialJson('{"name":"Counter","x":10,"y"')).toEqual({ name: 'Counter', x: 10 });
    expect(parsePartialJson('{"name":"Counter","x":10,"y":')).toEqual({ name: 'Counter', x: 10 });
    expect(parsePartialJson('{"name":"Counter","x":10,"y":-20.5 ')).toEqual({ name: 'Counter', x: 10, y: -20.5 });
    expect(parsePartialJson('{"html":"<p>Hel')).toEqual({});
    expect(seen[json.length]).toEqual(JSON.parse(json));
  });

  it('leaves out values the text has not finished', () => {
    expect(parsePartialJson('{"a":tr')).toEqual({});
    expect(parsePartialJson('{"a":true')).toEqual({ a: true });
    expect(parsePartialJson('{"a":"x\\')).toEqual({});
    expect(parsePartialJson('{"a":"x\\"')).toEqual({});
    expect(parsePartialJson('{"a":1.')).toEqual({});
    expect(parsePartialJson('{"a":[1,2')).toEqual({ a: [1] });
    expect(parsePartialJson('{"a":[1,2,')).toEqual({ a: [1, 2] });
    expect(parsePartialJson('{"a":{"b":1,"c":"')).toEqual({ a: { b: 1 } });
    expect(parsePartialJson('12')).toBeUndefined();
    expect(parsePartialJson('"tex')).toBeUndefined();
  });

  it('answers undefined for empty text and text that is not JSON', () => {
    for (const text of ['', '   ', '{"a" 1}', '{a:1}', '{"a":1}}', '[1 2]', '{"a":01}', '{"a":1.e5}', '{"a":-}', '{"a":nope}', 'x']) {
      expect({ text, value: parsePartialJson(text) }).toEqual({ text, value: undefined });
    }
  });

  it('reads like JSON.parse: only JSON whitespace, "__proto__" as an own key, deep nesting as invalid', () => {
    expect(parsePartialJson('{"a":1,\u00a0"b":2}')).toBeUndefined();
    const value = parsePartialJson('{"__proto__":{"x":5},"y":1}') as Record<string, unknown>;
    expect(Object.keys(value)).toEqual(['__proto__', 'y']);
    expect((value as { x?: number }).x).toBeUndefined();
    expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
    expect(parsePartialJson('{"a":' + '['.repeat(5000))).toBeUndefined();
    expect(parsePartialJson(JSON.stringify(Array(1000).fill({})))).toHaveLength(1000);
    expect(parsePartialJson('[[[[1]]]]')).toEqual([[[[1]]]]);
  });
});
