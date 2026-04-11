import type { GenerationScope } from '@tailoredin/domain';
import type { PromptSection } from './PromptSection.js';
import type { ScopeRecipe } from './ScopeRecipe.js';

export class PromptRegistry {
  private readonly recipes: ReadonlyMap<GenerationScope, ScopeRecipe>;

  public constructor(recipes: ScopeRecipe[]) {
    this.recipes = new Map(recipes.map(r => [r.scope, r]));
  }

  public getRecipe(scope: GenerationScope): ScopeRecipe {
    const recipe = this.recipes.get(scope);
    if (!recipe) throw new Error(`No recipe registered for scope: ${scope}`);
    return recipe;
  }

  public getSections(): PromptSection[] {
    const seen = new Set<string>();
    const sections: PromptSection[] = [];
    for (const recipe of this.recipes.values()) {
      for (const section of recipe.sections) {
        if (!seen.has(section.name)) {
          seen.add(section.name);
          sections.push(section);
        }
      }
    }
    return sections;
  }
}
