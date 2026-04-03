import type { ResumeTemplate } from '@tailoredin/domain';
import { BrilliantCvTemplate } from './BrilliantCvTemplate.js';

const registry = new Map<string, ResumeTemplate>([[BrilliantCvTemplate.id, BrilliantCvTemplate]]);

export const TemplateRegistry = {
  get(id: string): ResumeTemplate {
    const template = registry.get(id);
    if (!template) throw new Error(`Unknown template id: ${id}`);
    return template;
  },
  getAll(): ResumeTemplate[] {
    return [...registry.values()];
  },
};
