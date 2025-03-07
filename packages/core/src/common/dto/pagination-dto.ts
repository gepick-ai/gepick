export class PaginationRequestDto {
  constructor(
    public page?: number,
    public limit?: number,
    public search?: string,
  ) {

  }
}

export class PaginationResponseDto<T> {
  constructor(
    public total: number,
    public page: number,
    public limit: number,
    public data: T[],
  ) {}
}
