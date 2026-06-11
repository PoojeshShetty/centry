'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('logs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
      },
      timestamp: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      level: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      severity_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      trace_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      span_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      attributes: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      received_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('logs', ['project_id', 'timestamp'], {
      name: 'logs_project_id_timestamp_idx',
      order: { timestamp: 'DESC' },
    });

    await queryInterface.addIndex('logs', ['project_id', 'level'], {
      name: 'logs_project_id_level_idx',
    });

    await queryInterface.sequelize.query(
      `CREATE INDEX logs_body_fts_idx ON logs USING GIN (to_tsvector('english', body))`,
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('logs');
  },
};
