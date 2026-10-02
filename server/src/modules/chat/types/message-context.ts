import { Types } from 'mongoose';

export enum MessageKind {
  TEXT = 'text',
  RESOURCE = 'resource',
  POST = 'post',
}

/**
 * Server-resolved reference to the item a message is about. `title` and
 * `subtitle` are a snapshot taken at send time (never client-supplied) so the
 * chat feed can render a card without a lookup per message.
 */
export interface MessageContext {
  refId: Types.ObjectId;
  title: string;
  subtitle?: string;
}
