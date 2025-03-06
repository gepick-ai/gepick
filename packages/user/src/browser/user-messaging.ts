import { messagingService } from "@gepick/shared/browser"
import { GET_USER_API, GetUserResponseDto } from "@gepick/user/common"

export async function getUser() {
  const [err, res] = await messagingService.get<GetUserResponseDto>(GET_USER_API);

  if (res) {
    return res;
  }

  throw new Error(`Failed to get user：${err}`);
}
