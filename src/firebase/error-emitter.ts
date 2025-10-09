
import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

interface ErrorEmitterEvents {
  'permission-error': (error: FirestorePermissionError) => void;
}

class ErrorEmitter extends EventEmitter {
  emit<E extends keyof ErrorEmitterEvents>(
    event: E,
    ...args: Parameters<ErrorEmitterEvents[E]>
  ): boolean {
    return super.emit(event, ...args);
  }

  on<E extends keyof ErrorEmitterEvents>(
    event: E,
    listener: ErrorEmitterEvents[E]
  ): this {
    return super.on(event, listener);
  }
}

export const errorEmitter = new ErrorEmitter();
