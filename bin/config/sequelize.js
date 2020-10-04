// eslint-disable-next-line
require('dotenv').config();

module.exports = {
  autoMigrateOldSchema: true,
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  logging: process.env.DATABASE_LOGGING && console.log,
  dialectOptions: {
    ssl: true,
  },
  migrationStorage: 'sequelize',
  migrationStorageTableName: 'sequelize_migrations',
  pool: {
    max: 100,
    min: 0,
    idle: 20000,
    acquire: 0,
  },
};
