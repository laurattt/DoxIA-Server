const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Image = sequelize.define('Image', {
    image_base64: { 
        type: DataTypes.STRING, 
        allowNull: false 
    }
});

module.exports = Image;