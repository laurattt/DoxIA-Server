const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
    'uxiaG2',
    'uxiaG2User',
    '1234',
    {
        host: 'localhost',
        dialect: 'mysql',
        logging: true,
        define: {
            timestamps: false,
            freezeTableName: true
        }
    }
);

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
        allowNull: true,
        defaultValue: 'userNick'
    
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isEmail: true }
    },
    telefon: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '604556677'
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'passwordHash'
    },
    validat: {
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
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'users'
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
        defaultValue: 'qwen2.5vl:7b'
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
}, {
    tableName: 'requests'
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
}, {
    tableName: 'responses'
});

// -------------------------------------------

const image = sequelize.define('Image', {
    image_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    request_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    image_base64: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'images'
});

// -------------------------------------------

const sms = sequelize.define('sms',{
    id_sms: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    sms: {
        type: DataTypes.INTEGER
    },
    telefon: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'sms'
});


////////////////////////////////
//////    RELACIONES     ///////
////////////////////////////////

user.hasMany(request, { foreignKey: 'user_id' });
request.belongsTo(user, { foreignKey: 'user_id' });

request.hasOne(response, { foreignKey: 'request_id' });
response.belongsTo(request, { foreignKey: 'request_id' });

request.hasOne(image, { foreignKey: 'request_id' });
image.belongsTo(request, { foreignKey: 'request_id' });

module.exports = { sequelize, user, request, response, image };
