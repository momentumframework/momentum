export class ActionResult {}

export class StatusCodeResult extends ActionResult {
  readonly #statusCode: number;
  constructor(statusCode: number) {
    super();
    this.#statusCode = statusCode;
  }
  get statusCode() {
    return this.#statusCode;
  }
}

export class ContentResult extends StatusCodeResult {
  readonly #content: string;
  constructor(content: string, statusCode = 200) {
    super(statusCode);
    this.#content = content;
  }
  get content() {
    return this.#content;
  }
}

export class RedirectResult extends StatusCodeResult {
  readonly #location: string;
  constructor(location: string, statusCode: 301 | 302 = 302) {
    super(statusCode);
    this.#location = location;
  }
  get location() {
    return this.#location;
  }
}

export function statusCode(statusCode: number) {
  return new StatusCodeResult(statusCode);
}
export function redirect(location: string, statusCode: 301 | 302 = 302) {
  return new RedirectResult(location, statusCode);
}
export function content(content: string, statusCode = 200) {
  return new ContentResult(content, statusCode);
}
