export type DomainErrorCode =
  | 'INVALID_VALUE'
  | 'INVALID_RANGE'
  | 'NOT_FOUND'
  | 'CONFLICT';

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly messageKey: string;
  readonly details: Readonly<Record<string, string>> | undefined;

  constructor(
    code: DomainErrorCode,
    messageKey: string,
    details?: Readonly<Record<string, string>>,
  ) {
    super(messageKey);
    this.name = 'DomainError';
    this.code = code;
    this.messageKey = messageKey;
    this.details = details;
  }
}
