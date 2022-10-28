export interface QuarkConversion<T, D, ATQ = any, AFQ = any> {
    to_quark: (data: D, extra?: ATQ) => Promise<T>;
    from_quark: (data: T, extra?: AFQ) => Promise<D>;
}
