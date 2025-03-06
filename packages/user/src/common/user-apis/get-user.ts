import { User } from "@gepick/user/common"

export const GET_USER_API = '/user'

export class GetUserRequestDto {
  constructor(
    public id: string,
    public name: string,
  ) {}
}

export class GetUserResponseDto {
  constructor(
    public user: User,
  ) {}
}
