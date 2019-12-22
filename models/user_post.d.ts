import { Model, BuildOptions } from 'sequelize';
export interface IUserPostAttributes {
  id: number,
  userId: number,
  title: string,
  content?: string,
  createdAt: Date,
  updatedAt: Date,
}
export interface IUserPostModel extends IUserPostAttributes, Model {}
export type IUserPostModelStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): IUserPostModel;
};