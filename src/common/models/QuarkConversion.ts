export interface QuarkConversion<T, D> {
    to_quark: (data: D) => Promise<T>;
    from_quark: (data: T) => Promise<D>;
}
