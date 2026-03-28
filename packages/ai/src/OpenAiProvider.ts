import OpenAI from 'openai';
import type { IAiProvider } from './AiProvider.js';

export class OpenAiProvider extends OpenAI implements IAiProvider {}
