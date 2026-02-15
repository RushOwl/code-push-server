import {Sequelize, DataTypes, Model, Optional} from 'sequelize';

type AccountAttributes = {
  id: string
  email: string
  gitHubId: string
}

type AccountCreationAttributes = Optional<AccountAttributes, 'id'>;

export class Account extends Model<AccountAttributes, AccountCreationAttributes> {
  declare id: number;
  declare email: string;
  declare githubId: string;
}

export const initAccountModel = (sequelize: Sequelize) => {
      Account.init({
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        gitHubId: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
      }, {
        modelName: 'Account',
        sequelize,
      });
}
