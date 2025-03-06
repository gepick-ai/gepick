// Request<ParamsDictionary/*路径参数 */, ResBody/* 响应体*/, ReqBody* 请求体*/, ReqQuery/*查询参数 */, Locals>/*本地变量 */

import { Request, Router } from "express"
import { GET_USER_API, GetUserRequestDto, GetUserResponseDto } from "@gepick/user/common"
import { userService } from "@gepick/user/node"

export function useUserRouter(router: Router) {
  /**
   * 根据用户ID获取用户信息
   */
  interface IGetUserRequest extends Request<any, any, GetUserRequestDto> {

  }

  router.get(GET_USER_API, async (req: IGetUserRequest, res) => {
    const { id } = (req as IGetUserRequest & { user: { id: string, name: string } }).user

    const user = await userService.getUser(id)

    if (user) {
      res.send(new GetUserResponseDto({
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        chatLimit: user.chatLimit,
        chatUsed: user.chatUsed,
        omikujiLimit: user.omikujiLimit,
        omikujiUsed: user.omikujiUsed,
        wallpaperLimit: user.wallpaperLimit,
        wallpaperUsed: user.wallpaperUsed,
      }))

      return;
    }

    res.status(500).send("User not found")
  })
}
