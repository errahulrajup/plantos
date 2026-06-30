/**
 * Manages Master Recipes (the WHAT).
 * Recipes define materials, quantities, parameters (e.g., 90°C), and phase requirements,
 * completely independent of the physical workflow timing.
 */
export class RecipeEngine {
  private loadedRecipes: Map<string, any> = new Map();

  public loadRecipe(recipeDefinition: any) {
    console.log(`[RecipeEngine] Loaded Recipe: ${recipeDefinition.name}`);
    this.loadedRecipes.set(recipeDefinition.id, recipeDefinition);
  }

  public getTargetParameter(recipeId: string, parameterCode: string): any {
    const recipe = this.loadedRecipes.get(recipeId);
    if (!recipe) throw new Error(`Recipe ${recipeId} not found`);
    return recipe.parameters[parameterCode];
  }

  public getBOM(recipeId: string): any {
    const recipe = this.loadedRecipes.get(recipeId);
    return recipe?.materials || [];
  }
}
