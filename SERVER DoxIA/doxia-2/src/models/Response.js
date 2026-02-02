const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');


const Response = sequelize.define('Response', {
    description: { 
        type: DataTypes.TEXT 
    },
    tags: { 
        type: DataTypes.JSON 
    },
    model_used: { 
        type: DataTypes.STRING 
    },
    processing_time: { 
        type: DataTypes.FLOAT 
    }
});

module.exports = Response;
