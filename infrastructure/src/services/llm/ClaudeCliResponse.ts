export type ClaudeCliUsage = {
  readonly input_tokens: number;
  readonly output_tokens: number;
  readonly cache_creation_input_tokens: number;
  readonly cache_read_input_tokens: number;
  readonly server_tool_use: {
    readonly web_search_requests: number;
    readonly web_fetch_requests: number;
  };
};

export type ClaudeCliResponse = {
  readonly type: 'result';
  readonly subtype: string;
  readonly is_error: boolean;
  readonly duration_ms: number;
  readonly duration_api_ms: number;
  readonly num_turns: number;
  readonly result: string;
  readonly stop_reason: string;
  readonly session_id: string;
  readonly total_cost_usd: number;
  readonly usage: ClaudeCliUsage;
};
