/** A scalar the text ends in the middle of (or right after: a number may go on). */
const INCOMPLETE = Symbol('incomplete');

/** The text is not the start of valid JSON (or nests deeper than `MAX_DEPTH`). */
class InvalidJson extends Error {}

/** Deepest nesting read; deeper text counts as invalid instead of overflowing the stack. */
const MAX_DEPTH = 256;

/**
 * Reads JSON text that may stop anywhere, as a model streams a tool call's input: open objects and arrays are
 * closed, and a value the text has not finished (a string without its closing quote, a number that may go on, a
 * literal half written, a key without its value) is left out. Returns `undefined` when the text holds no value
 * yet or is not the start of valid JSON.
 *
 * `parsePartialJson('{"x":10,"y":2')` is `{ x: 10 }`; `parsePartialJson('{"x":10,"y":2,')` is `{ x: 10, y: 2 }`.
 */
export function parsePartialJson(text: string): unknown {
  const reader = new PartialJsonReader(text);
  try {
    reader.skipWhitespace();
    if (reader.done) {
      return undefined;
    }
    const value = reader.value();
    if (value === INCOMPLETE) {
      return undefined;
    }
    reader.skipWhitespace();
    // Anything after a complete top-level value makes it invalid.
    return reader.done ? value : undefined;
  } catch (error) {
    if (error instanceof InvalidJson) {
      return undefined;
    }
    throw error;
  }
}

class PartialJsonReader {
  private index = 0;
  private depth = 0;

  constructor(private readonly text: string) {}

  get done(): boolean {
    return this.index >= this.text.length;
  }

  skipWhitespace(): void {
    // JSON whitespace only, as JSON.parse.
    while (!this.done && JSON_WHITESPACE.has(this.text[this.index])) {
      this.index++;
    }
  }

  value(): unknown {
    const char = this.text[this.index];
    if (char === '{' || char === '[') {
      if (++this.depth > MAX_DEPTH) {
        throw new InvalidJson();
      }
      try {
        return char === '{' ? this.object() : this.array();
      } finally {
        this.depth--;
      }
    }
    if (char === '"') {
      return this.string();
    }
    if (char === '-' || (char >= '0' && char <= '9')) {
      return this.number();
    }
    for (const [literal, value] of LITERALS) {
      const rest = this.text.slice(this.index, this.index + literal.length);
      if (rest === literal) {
        this.index += literal.length;
        return value;
      }
      if (this.index + rest.length === this.text.length && literal.startsWith(rest)) {
        this.index = this.text.length;
        return INCOMPLETE;
      }
    }
    throw new InvalidJson();
  }

  private object(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    this.index++;
    this.skipWhitespace();
    if (this.text[this.index] === '}') {
      this.index++;
      return result;
    }
    while (!this.done) {
      this.skipWhitespace();
      if (this.done) {
        break;
      }
      if (this.text[this.index] !== '"') {
        throw new InvalidJson();
      }
      const key = this.string();
      this.skipWhitespace();
      if (key === INCOMPLETE || this.done) {
        break;
      }
      if (this.text[this.index] !== ':') {
        throw new InvalidJson();
      }
      this.index++;
      this.skipWhitespace();
      if (this.done) {
        break;
      }
      const value = this.value();
      if (value === INCOMPLETE) {
        break;
      }
      // An own property even for "__proto__", as JSON.parse makes it.
      Object.defineProperty(result, key as string, { value, enumerable: true, writable: true, configurable: true });
      this.skipWhitespace();
      if (this.done) {
        break;
      }
      const next = this.text[this.index++];
      if (next === '}') {
        return result;
      }
      if (next !== ',') {
        throw new InvalidJson();
      }
    }
    return result;
  }

  private array(): unknown[] {
    const result: unknown[] = [];
    this.index++;
    this.skipWhitespace();
    if (this.text[this.index] === ']') {
      this.index++;
      return result;
    }
    while (!this.done) {
      this.skipWhitespace();
      if (this.done) {
        break;
      }
      const value = this.value();
      if (value === INCOMPLETE) {
        break;
      }
      result.push(value);
      this.skipWhitespace();
      if (this.done) {
        break;
      }
      const next = this.text[this.index++];
      if (next === ']') {
        return result;
      }
      if (next !== ',') {
        throw new InvalidJson();
      }
    }
    return result;
  }

  private string(): string | typeof INCOMPLETE {
    const start = this.index;
    this.index++;
    while (!this.done) {
      const char = this.text[this.index];
      if (char === '\\') {
        this.index += 2;
        continue;
      }
      this.index++;
      if (char === '"') {
        try {
          return JSON.parse(this.text.slice(start, this.index)) as string;
        } catch {
          throw new InvalidJson();
        }
      }
    }
    this.index = this.text.length;
    return INCOMPLETE;
  }

  private number(): number | typeof INCOMPLETE {
    const match = /^-?(0|[1-9]\d*)?(\.\d*)?([eE][+-]?\d*)?/.exec(this.text.slice(this.index))!;
    this.index += match[0].length;
    // At the end of the text the model may still be writing the number.
    if (this.done) {
      return INCOMPLETE;
    }
    try {
      return JSON.parse(match[0]) as number;
    } catch {
      throw new InvalidJson();
    }
  }
}

const JSON_WHITESPACE = new Set([' ', '\t', '\n', '\r']);

const LITERALS: [string, unknown][] = [
  ['true', true],
  ['false', false],
  ['null', null],
];
