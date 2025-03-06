import { UserModel } from "@gepick/user/node"
import { isNil, omitBy } from 'lodash-es';

export class UserService {
  /**
   * 创建用户
   */
  async createUser(params: {
    name: string
    avatarUrl: string
    email?: string
    provider?: string
    providerAccountId?: string
  }) {
    const user = await UserModel.create(params);

    return this.getUser(user.id);
  }

  /**
   * 根据id获取用户
   */
  async getUser(id: string) {
    const user = await UserModel.findById(id).exec();

    if (!user) {
      return null;
    }

    return user;
  }

  /**
   * 更新用户
   */
  async updateUser(params: { id: string, name?: string, avatarUrl?: string, provider?: string, providerAccountId?: string }) {
    const user = await UserModel.findById(params.id).exec();

    if (!user) {
      throw new Error("User not found");
    }

    const conditions = omitBy(params, isNil);

    await UserModel.updateOne(conditions).exec();
  }

  /**
   * 删除用户
   */
  async deleteUser(id: string) {
    await UserModel.deleteOne({ id }).exec();
  }

  /**
   * 根据provider查找用户
   */
  async findUserByProvider(params: {
    provider: string
    providerAccountId: string
  }) {
    const user = await UserModel.findOne(params).exec();

    if (!user) {
      return null;
    }

    return user;
  }

  async findUserByEmail(email: string) {
    const user = await UserModel.findOne({ email }).exec();

    if (!user) {
      return null;
    }

    return user;
  }
}

export class QuotaService {
  async getChatQuota(userId: string) {
    const user = await UserModel.findById(userId).exec();

    if (!user) {
      throw new Error("user not found");
    }

    return {
      chatLimit: user.chatLimit,
      chatUsed: user.chatUsed,
    }
  }

  async updateChatQuota(userId: string, input: { chatLimit?: number, chatUsed?: number }) {
    const conditions = omitBy(input, isNil);

    await UserModel.updateOne({ _id: userId }, conditions).exec();
  }

  async getOmikujiQuota(userId: string) {
    const user = await UserModel.findById(userId).exec();

    if (!user) {
      throw new Error("user not found");
    }

    return {
      omikujiLimit: user.omikujiLimit,
      omikujiUsed: user.omikujiUsed,
    }
  }

  async updateOmikujiQuota(userId: string, input: { omikujiLimit?: number, omikujiUsed?: number }) {
    const conditions = omitBy(input, isNil);

    await UserModel.updateOne({ _id: userId }, conditions).exec();
  }

  async getWallpaperQuota(userId: string) {
    const user = await UserModel.findById(userId).exec();

    if (!user) {
      throw new Error("user not found");
    }

    return {
      wallpaperLimit: user.wallpaperLimit,
      wallpaperUsed: user.wallpaperUsed,
    }
  }

  async updateWallpaperQuota(userId: string, input: { wallpaperLimit?: number, wallpaperUsed?: number }) {
    const conditions = omitBy(input, isNil);

    await UserModel.updateOne({ _id: userId }, conditions).exec();
  }
}

export const userService = new UserService();
export const quotaService = new QuotaService();
