// Paginated Laravel shape: BusinessResource::collection(...->paginate())
// renders { data: [...], links: {...}, meta: {...} }. The list page consumes
// data + the meta page keys below (D7-02); the rest stays loosely typed.
export interface ApiListResponse<T> {
  data: T[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
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
