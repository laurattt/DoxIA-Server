const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');


const sequelize = new Sequelize(
    'uxia2',
    'uxia2User',
    '4321',
    {
        host: 'localhost',
        dialect: 'mysql', 
        define: {
            timestamps: false
        },
        logging: true
    }
)


////////////////////////////
//////    TABLAS     ///////
////////////////////////////

const user = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
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
        type: DataTypes.STRING,
        allowNull: false
    },
    validat: { //verficaaar
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    },
    role: { 
        type: DataTypes.ENUM('user', 'admin'), 
        defaultValue: 'user', 
        allowNull: false
    },
    api_key: { 
        type: DataTypes.STRING, 
        unique: true 
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt:{
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});


// -------------------------------------------

const request = sequelize.define('Request', {
    request_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    prompt: { 
        type: DataTypes.TEXT, 
        allowNull: false 
    },
    model: { 
        type: DataTypes.STRING, 
        defaultValue: 'qwen2.5vl:7b' // modelo ollama por mientras (?)
    },
    stream: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status: { 
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'), 
        defaultValue: 'pending' 
    },
    processing_time: { 
        type: DataTypes.FLOAT 
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

// -------------------------------------------

const response = sequelize.define('Response', {
    response_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    request_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
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
    },
     createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

// -------------------------------------

const image = sequelize.define('Image', {
    image_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    request_id: {
        type:DataTypes.INTEGER,
        allowNull: false
    },
    image_base64: { 
        type: DataTypes.STRING, 
        allowNull: false 
    }
});


////////////////////////////////
//////    RELACIONES     ///////
////////////////////////////////

user.hasMany(request, { foreignKey: 'user_id' });
request.belongsTo(user, { foreignKey: 'user_id' });

request.hasOne(response, {foreignKey: 'request_id' });
response.belongsTo(request,{ foreignKey: 'request_id' });

request.hasOne(image, { foreignKey: 'request_id' });
image.belongsTo(request, { foreignKey: 'request_id' });



module.exports = { sequelize, user, request, response, image };

