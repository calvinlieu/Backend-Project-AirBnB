'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Reviews extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Reviews.belongsTo(
        models.User,
        { foreignKey: 'reviewId' }
      );
      
      Reviews.belongsTo(
        models.Spot,
        { foreignKey: 'spotId' }
      );
    }
  }
  Reviews.init({
    review:{
      type: DataTypes.TEXT,
      allowNull: false,
    },
    stars:{
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    spotId:{
      type: DataTypes.INTEGER,
      allowNull: false,
      
    },
    userId:{
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'Reviews',
  });
  return Reviews;
};