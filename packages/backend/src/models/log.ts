import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export class Log extends Model<InferAttributes<Log>, InferCreationAttributes<Log>> {
  declare id: CreationOptional<string>;
  declare project_id: string;
  declare timestamp: number;
  declare level: string;
  declare severity_number: number;
  declare body: string;
  declare trace_id: CreationOptional<string | null>;
  declare span_id: CreationOptional<string | null>;
  declare attributes: CreationOptional<Record<string, unknown>>;
  declare received_at: CreationOptional<Date>;
}

Log.init(
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
    timestamp: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    level: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    severity_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    trace_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    span_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    attributes: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    received_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'logs',
    timestamps: false,
  },
);
