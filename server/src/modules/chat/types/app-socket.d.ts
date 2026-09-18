import { DefaultEventsMap } from '@socket.io/component-emitter';
import { Socket } from 'socket.io';

export type ChatSocketData = { userId?: string };

// Only SocketData (the 4th generic, holding our own socket.data.userId) is
// narrowed here — the event maps stay DefaultEventsMap because this
// gateway's events aren't declared as a typed contract, matching the
// untyped `Socket` this replaces everywhere except `.data`.
export type AppSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  ChatSocketData
>;
