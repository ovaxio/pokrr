import type { ErrorCode } from "../types";

export class GameError extends Error {
  constructor(readonly code: ErrorCode, message: string) {
    super(message);
    this.name = "GameError";
  }
}
