export class LlmRequestError extends Error {
  public constructor(
    message: string,
    public readonly command: string[],
    public readonly exitCode: number | null,
    public readonly stdout: string,
    public readonly stderr: string,
    public readonly duration: number
  ) {
    super(message);
  }
}
