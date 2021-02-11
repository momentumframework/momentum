/**
 * Base class that represents the result of a controller action
 */
export abstract class ActionResult {}

/**
 * Represents a result of a controller action with a status code
 */
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

/**
 * Represents a result of a controller with content
 */
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

/**
 * Represents a controller action result with a redirect
 */
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

/**
 * Create a @see StatusCodeResult
 */
export function statusCode(statusCode: number) {
  return new StatusCodeResult(statusCode);
}

/**
 * Create a @see RedirectResult
 */
export function redirect(location: string, statusCode: 301 | 302 = 302) {
  return new RedirectResult(location, statusCode);
}

/**
 * Create a @see ContentResult
 */
export function content(content: string, statusCode = 200) {
  return new ContentResult(content, statusCode);
}
