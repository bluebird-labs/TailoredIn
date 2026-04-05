export class EntityNotFoundError extends Error {
  public readonly entityType: string;
  public readonly entityId: string;

  public constructor(entityType: string, entityId: string) {
    super(`${entityType} not found: ${entityId}`);
    this.name = 'EntityNotFoundError';
    this.entityType = entityType;
    this.entityId = entityId;
  }
}
