const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

  const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nickname: {
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true 
    },
   email: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true,
    validate: {
        isEmail: true}
    },
    telefon: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password_hash: { 
        type: DataTypes.STRING 
    },
    validat: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    },
    tos_accepted: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    },
    role: { 
        type: DataTypes.ENUM('user', 'admin'), 
        defaultValue: 'user' 
    },
    api_key: { 
        type: DataTypes.UUID, 
        defaultValue: DataTypes.UUIDV4,
        unique: true 
    }
});

module.exports = User;

