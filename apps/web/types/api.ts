export type ApiSuccess<T> = { data: T };
export type ApiFailure = { error: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
