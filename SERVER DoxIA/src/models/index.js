
const User = require('./Users');
const Request = require('./Request');
const Image = require('./Image');
const Response = require('./Response');

// relaciones entre la bbdd
User.hasMany(Request, { foreignKey: 'user_id' });
Request.belongsTo(User, { foreignKey: 'user_id' });

Request.hasMany(Image, { foreignKey: 'request_id' });
Image.belongsTo(Request, { foreignKey: 'request_id' });

Request.hasOne(Response, { foreignKey: 'request_id' });
Response.belongsTo(Request, { foreignKey: 'request_id' });


module.exports = {
    User,
    Request,
    Image,
    Response
};