// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../../core/resource';
import * as ReactionsAPI from './reactions';
import {
  BaseReactions,
  ReactionAddParams,
  ReactionAddResponse,
  ReactionDeleteParams,
  ReactionDeleteResponse,
  Reactions,
} from './reactions';

/**
 * Manage chat messages
 */
export class BaseMessages extends APIResource {
  static override readonly _key: readonly ['chats', 'messages'] = Object.freeze([
    'chats',
    'messages',
  ] as const);
}
/**
 * Manage chat messages
 */
export class Messages extends BaseMessages {
  reactions: ReactionsAPI.Reactions = new ReactionsAPI.Reactions(this._client);
}

Messages.Reactions = Reactions;
Messages.BaseReactions = BaseReactions;

export declare namespace Messages {
  export {
    Reactions as Reactions,
    BaseReactions as BaseReactions,
    type ReactionDeleteResponse as ReactionDeleteResponse,
    type ReactionAddResponse as ReactionAddResponse,
    type ReactionDeleteParams as ReactionDeleteParams,
    type ReactionAddParams as ReactionAddParams,
  };
}
