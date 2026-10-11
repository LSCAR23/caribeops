// Paginated Laravel shape: BusinessResource::collection(...->paginate())
// renders { data: [...], links: {...}, meta: {...} }. Only data + meta.total
// are consumed (D3-06); the rest stays loosely typed on purpose.
export interface ApiListResponse<T> {
  data: T[];
  meta: {
    total: number;
    [key: string]: unknown;
  };
}

// Single-resource shape: new BusinessResource(...) renders { data: {...} }.
// Added now for the imminent D3-11 detail call; unused by D3-06.
export interface ApiItemResponse<T> {
  data: T;
}

// Plain collection shape: ReviewResource::collection(...) without a
// paginator renders { data: [...] }. Added for the D3-12 reviews call.
export interface ApiCollectionResponse<T> {
  data: T[];
}
