export interface IQueryBuilder<T> {
  build(dto: T): Record<string, any>;
}
