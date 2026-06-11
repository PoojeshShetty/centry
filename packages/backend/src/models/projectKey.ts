import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export class ProjectKey extends Model<
  InferAttributes<ProjectKey>,
  InferCreationAttributes<ProjectKey>
> {
  declare id: CreationOptional<string>;
  declare project_id: string;
  declare public_key: string;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

ProjectKey.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    public_key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    tableName: 'project_keys',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);
