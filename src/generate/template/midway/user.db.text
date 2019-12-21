import { async, config, init, provide, scope, ScopeEnum } from 'midway';
import { Sequelize } from 'sequelize';

export interface IDB {
  sequelize: Sequelize;
}

@scope(ScopeEnum.Singleton)
@async()
@provide('DB')
export default class DB implements IDB {
  public sequelize: Sequelize;

  @config('mysql')
  config;

  @init()
  public connect() {
    const { database, username, password, options } = this.config;
    // https://sequelize.org/master/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor
    this.sequelize = new Sequelize(database, username, password, options);
  }
}
