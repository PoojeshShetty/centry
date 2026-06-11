import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export class Project extends Model<InferAttributes<Project>, InferCreationAttributes<Project>> {
  declare id: CreationOptional<string>;
  declare account_id: string;
  declare name: string;
  declare application_url: string;
  declare description: CreationOptional<string | null>;
  declare environment: string;
  declare archived_at: CreationOptional<Date | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    account_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    application_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    environment: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    archived_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    tableName: 'projects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);
