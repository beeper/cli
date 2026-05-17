// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { BeeperDesktopError } from './error';
import { FinalRequestOptions } from '../internal/request-options';
import { defaultParseResponse } from '../internal/parse';
import { type BaseBeeperDesktop } from '../client';
import { APIPromise } from './api-promise';
import { type APIResponseProps } from '../internal/parse';
import { maybeObj } from '../internal/utils/values';

export type PageRequestOptions = Pick<FinalRequestOptions, 'query' | 'headers' | 'body' | 'path' | 'method'>;

export abstract class AbstractPage<Item> implements AsyncIterable<Item> {
  #client: BaseBeeperDesktop;
  protected options: FinalRequestOptions;

  protected response: Response;
  protected body: unknown;

  constructor(client: BaseBeeperDesktop, response: Response, body: unknown, options: FinalRequestOptions) {
    this.#client = client;
    this.options = options;
    this.response = response;
    this.body = body;
  }

  abstract nextPageRequestOptions(): PageRequestOptions | null;

  abstract getPaginatedItems(): Item[];

  hasNextPage(): boolean {
    const items = this.getPaginatedItems();
    if (!items.length) return false;
    return this.nextPageRequestOptions() != null;
  }

  async getNextPage(): Promise<this> {
    const nextOptions = this.nextPageRequestOptions();
    if (!nextOptions) {
      throw new BeeperDesktopError(
        'No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.',
      );
    }

    return await this.#client.requestAPIList(this.constructor as any, nextOptions);
  }

  async *iterPages(): AsyncGenerator<this> {
    let page: this = this;
    yield page;
    while (page.hasNextPage()) {
      page = await page.getNextPage();
      yield page;
    }
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<Item> {
    for await (const page of this.iterPages()) {
      for (const item of page.getPaginatedItems()) {
        yield item;
      }
    }
  }
}

/**
 * This subclass of Promise will resolve to an instantiated Page once the request completes.
 *
 * It also implements AsyncIterable to allow auto-paginating iteration on an unawaited list call, eg:
 *
 *    for await (const item of client.items.list()) {
 *      console.log(item)
 *    }
 */
export class PagePromise<
    PageClass extends AbstractPage<Item>,
    Item = ReturnType<PageClass['getPaginatedItems']>[number],
  >
  extends APIPromise<PageClass>
  implements AsyncIterable<Item>
{
  constructor(
    client: BaseBeeperDesktop,
    request: Promise<APIResponseProps>,
    Page: new (...args: ConstructorParameters<typeof AbstractPage>) => PageClass,
  ) {
    super(
      client,
      request,
      async (client, props) =>
        new Page(client, props.response, await defaultParseResponse(client, props), props.options),
    );
  }

  /**
   * Allow auto-paginating iteration on an unawaited list call, eg:
   *
   *    for await (const item of client.items.list()) {
   *      console.log(item)
   *    }
   */
  async *[Symbol.asyncIterator](): AsyncGenerator<Item> {
    const page = await this;
    for await (const item of page) {
      yield item;
    }
  }
}

export interface CursorSearchResponse<Item> {
  items: Array<Item>;

  hasMore: boolean;

  oldestCursor: string | null;

  newestCursor: string | null;
}

export interface CursorSearchParams {
  cursor?: string | null;

  direction?: string | null;

  limit?: number | null;
}

export class CursorSearch<Item> extends AbstractPage<Item> implements CursorSearchResponse<Item> {
  items: Array<Item>;

  hasMore: boolean;

  oldestCursor: string | null;

  newestCursor: string | null;

  constructor(
    client: BaseBeeperDesktop,
    response: Response,
    body: CursorSearchResponse<Item>,
    options: FinalRequestOptions,
  ) {
    super(client, response, body, options);

    this.items = body.items || [];
    this.hasMore = body.hasMore || false;
    this.oldestCursor = body.oldestCursor || null;
    this.newestCursor = body.newestCursor || null;
  }

  getPaginatedItems(): Item[] {
    return this.items ?? [];
  }

  override hasNextPage(): boolean {
    if (this.hasMore === false) {
      return false;
    }

    return super.hasNextPage();
  }

  nextPageRequestOptions(): PageRequestOptions | null {
    const cursor = this.oldestCursor;
    if (!cursor) {
      return null;
    }

    return {
      ...this.options,
      query: {
        ...maybeObj(this.options.query),
        cursor,
      },
    };
  }
}

export interface CursorNoLimitResponse<Item> {
  items: Array<Item>;

  hasMore: boolean;

  oldestCursor: string | null;

  newestCursor: string | null;
}

export interface CursorNoLimitParams {
  cursor?: string | null;

  direction?: string | null;
}

export class CursorNoLimit<Item> extends AbstractPage<Item> implements CursorNoLimitResponse<Item> {
  items: Array<Item>;

  hasMore: boolean;

  oldestCursor: string | null;

  newestCursor: string | null;

  constructor(
    client: BaseBeeperDesktop,
    response: Response,
    body: CursorNoLimitResponse<Item>,
    options: FinalRequestOptions,
  ) {
    super(client, response, body, options);

    this.items = body.items || [];
    this.hasMore = body.hasMore || false;
    this.oldestCursor = body.oldestCursor || null;
    this.newestCursor = body.newestCursor || null;
  }

  getPaginatedItems(): Item[] {
    return this.items ?? [];
  }

  override hasNextPage(): boolean {
    if (this.hasMore === false) {
      return false;
    }

    return super.hasNextPage();
  }

  nextPageRequestOptions(): PageRequestOptions | null {
    const cursor = this.oldestCursor;
    if (!cursor) {
      return null;
    }

    return {
      ...this.options,
      query: {
        ...maybeObj(this.options.query),
        cursor,
      },
    };
  }
}
