const express = require("express");
const cors = require('cors');
const path = require("path");
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const { sequelize, user, request, response } = require('./bbdd');

const app = express();
const port = 3000;

// MIDDLEWARES
app.use(cors()); 

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


// servidor activado zzzzz

async function startServer() {
    await bbddChecker(); // espera a conectar con la BBDD
    httpServer = app.listen(port, () => {
        console.log(`Servidor escuchando en http://0.0.0.0:${port}`);
    });

    await generateHash('admin123'); // prueba con contraseña admin123
}

startServer();

// checker data
async function bbddChecker() {
  try {
    await sequelize.authenticate();
    console.log('bbdddddd conectadaaaaaaaa :) ');
  } catch (error) {
    console.error('Errooooooor al conectar a bbdd:', error);
  }
}

// prueba postman (?)
app.get('/postmanProba', (req, res) => {
    res.send('hola postman, hola hola hola');
});

app.post('/api/postmanProba', (req, res) => {
    console.log(req.body);
    res.json({ message: 'mensaje test recibido', data: req.body });
});


////////////////////////////////
//////    END-POINTS    ////////
////////////////////////////////


// --> /api/admin/usuaris/login
app.post('/api/admin/usuaris/login', async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;

    try {
        const adminUser = await user.findOne({ where: { email, role: 'admin' }});

        if (!adminUser) {
            return res.status(401).json(
                { 
                    status: "Error",
                    message: 'Invalid credentials',
                    data: {}
                }
            );
        }

        // checker pwd
        const isMatch = await bcrypt.compare(password, adminUser.password);

        if (isMatch) {
            
            // generar token si no existeix
            if (!adminUser.api_key) {
                const apiKey = generateApiKey();
                adminUser.api_key = apiKey;
                await adminUser.save();
            }
            res.status(200).json(
                { 
                    status: "OK",
                    message: 'User successfully authenticated',
                    data: {token: adminUser.api_key }
                }
            );
        } else {
            res.status(401).json(
                { 
                    status: "Error",
                    message: 'Invalid credentials',
                    data: {}
                }
            );
        }

    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json(
            { 
                status: "Error",
                message: 'Internal server error' 
            });
    }
});

// --> /api/admin/usuaris
app.get('/api/admin/usuaris', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    try {
        const adminUser = await user.findOne({ where: { api_key: apiKey, role: 'admin' }});
        if (!adminUser) {
            return res.status(401).json(
                {
                    status: "Error",
                    message: 'Invalid API key',
                    data: {}
                }
            );
        }
        const users = await user.findAll({ where: { role: 'user' }});
        res.status(200).json(
            {
                status: "OK",
                message: 'Users retrieved successfully',
                data: users
            }
        );
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json(
            {
                status: "Error",
                message: 'Internal server error',
                data: {}    
            }
        );
    }
});

// --> /api/admin/usuaris/logout
app.post('/api/admin/usuaris/logout', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    try {
        const adminUser = await user.findOne({ where: { api_key: apiKey, role: 'admin' }});
        if (!adminUser) {
            return res.status(401).json(
                {
                    status: "Error",
                    message: 'Invalid API key',
                    data: {}
                }
            );
        }

        // reset api_key
        adminUser.api_key = null;
        await adminUser.save();

        res.status(200).json(
            {
                status: "OK",
                message: 'User successfully logged out',
                data: {}
            }
        );
    } catch (error) {
        console.error('Error during admin logout:', error);
        res.status(500).json(
            {
                status: "Error",
                message: 'Internal server error',
                data: {}
            }
        );
    }
});

// --> /api/admin/usuaris/testtoken
app.post('/api/admin/usuaris/testtoken', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    try {
        const adminUser = await user.findOne({ where: { api_key: apiKey, role: 'admin' }});
        if (!adminUser) {
            return res.status(401).json(
                {
                    status: "Error",
                    message: 'Invalid API key',
                    data: {}
                }
            );
        }
        res.status(200).json(
            {
                status: "OK",
                message: 'API key is valid',
                data: {}
            }
        );
    } catch (error) {
        console.error('Error during token test:', error);
        res.status(500).json(
            {
                status: "Error",
                message: 'Internal server error',
                data: {}
            }
        );
    }
});


// hash hash hash 
async function generateHash(password) {
    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);
        console.log(`Hash para la contraseña "${password}":`);
        console.log(hash);
    } catch (error) {
        console.error('Error generando hash:', error);
    }
}

function generateApiKey() {
    // 20 caracters base64url (A-Z, a-z, 0-9, -, _)
    // 20 caracters => 120 bits => 15 bytes
    
    return crypto.randomBytes(15).toString('base64url');
}

// apagar server correctttt
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
function shutDown() {
    console.log('Received kill signal, shutting down gracefully');
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
}
