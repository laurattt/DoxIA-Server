const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');


const Request = sequelize.define('Request', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    prompt: { 
        type: DataTypes.TEXT, 
        allowNull: false 
    },
    model: { 
        type: DataTypes.STRING, 
        defaultValue: process.env.CHAT_API_OLLAMA_MODEL, // modelo ollama por mientras (?)
        validate: {
            notEmpty: true
        }
    },
    status: { 
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'), 
        defaultValue: 'pending' 
    },
    processing_time: { 
        type: DataTypes.FLOAT 
    }
});

module.exports = Request;