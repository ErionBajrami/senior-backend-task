
export interface Identifiable<TId> {
  readonly id: TId;
}

export interface Repository<TEntity extends Identifiable<TId>, TId> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<void>;
}
