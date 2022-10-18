export interface QuarkConversion<T, D> {
    to_quark: (data: D) => Promise<T>;
    from_quark: (data: T, ...args: any) => Promise<D>;
}
