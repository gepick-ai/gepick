import { CommandHandler } from '@gepick/core/common';

export type AICommandHandlerFactory = (handler: CommandHandler) => CommandHandler;
export const AICommandHandlerFactory = Symbol('AICommandHandlerFactory');
