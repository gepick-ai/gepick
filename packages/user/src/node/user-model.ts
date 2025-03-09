import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { v4 as uuidv4 } from 'uuid';
import { User } from "@gepick/user/common"

@modelOptions({ schemaOptions: { collection: 'users' } })
class UserClass extends User {
  @prop({ required: true, default: () => uuidv4() })
  public _id: string;

  @prop({ required: true })
  public override name: string;

  @prop(({ }))
  public override avatarUrl: string;

  @prop()
  public provider?: string;

  @prop()
  public providerAccountId?: string;

  @prop()
  public email?: string;
}

export const UserModel = getModelForClass(UserClass);
