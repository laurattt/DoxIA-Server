const express = require("express");
const cors = require('cors');
const jwt = require('jsonwebtoken')
const path = require("path");

const { sequelize, user, request, response } = require('./bbdd');

const app = express();
const port = 3000;

// MIDDLEWARES
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


// servidor activado zzzzz
let httpServer;
async function startServer() {
    await bbddChecker(); // espera a conectar con la BBDD
    httpServer = app.listen(port, () => {
        console.log(`Servidor escuchando en http://0.0.0.0:${port}`);
    });

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

app.get('/numDosPostmanProba', (req, res) => {
    res.send('prueba num doooooos, hola');
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
    const { email, password } = req.body;

    try {
        const adminUser = await user.findOne({
            where: { email, role: 'admin' }
        });

        if (!adminUser) {
            return res.status(401).json({
                status: "Error",
                message: "Invalid credentials"
            });
        }
      
        adminUser.api_key = null;   // INVALIDAMOS CUALQUIER SESION PREVIA

        // GENERADOR NUEVO TOKEN
        const newToken = generateApiKey(adminUser);
        adminUser.api_key = newToken;

        await adminUser.save();

        res.status(200).json({
            status: "OK",
            message: "Login successful",
            data: { token: newToken }
        });

    } catch (error) {
        res.status(500).json({
            status: "Error",
            message: "Internal server error"
        });
    }
});


// --> /api/admin/usuaris
app.get('/api/admin/usuaris', async (req, res) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({
            status: "Error",
            message: "Missing API key",
            data: {}
        });
    }

    try {
        const adminUser = await user.findOne({
            where: { api_key: apiKey, role: 'admin' }
        });

        if (!adminUser) {
            return res.status(401).json({
                status: "Error",
                message: 'Invalid API key',
                data: {}
            });
        }

        const users = await user.findAll({ where: { role: 'user' } });

        res.status(200).json({
            status: "OK",
            message: 'Users retrieved successfully',
            data: users
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            status: "Error",
            message: 'Internal server error',
            data: {}
        });
    }
});


// --> /api/admin/usuaris/logout
app.post('/api/admin/usuaris/logout', async (req, res) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({
            status: "Error",
            message: "Missing API key",
            data: {}
        });
    }

    try {
        const adminUser = await user.findOne({
            where: { api_key: apiKey, role: 'admin' }
        });

        if (!adminUser) {
            return res.status(401).json({
                status: "Error",
                message: 'Invalid API key',
                data: {}
            });
        }

        // Invalidamos la API key
        adminUser.api_key = null;
        await adminUser.save();

        res.status(200).json({
            status: "OK",
            message: 'Logout successful',
            data: {}
        });

    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({
            status: "Error",
            message: 'Internal server error',
            data: {}
        });
    }
});


// --> /api/admin/usuaris/testtoken
app.get('/api/admin/usuaris/testtoken', async (req, res) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({
            status: "Error",
            message: "Missing API key",
            data: {}
        });
    }

    try {
        const adminUser = await user.findOne({
            where: { api_key: apiKey, role: 'admin' }
        });

        if (!adminUser) {
            return res.status(401).json({
                status: "Error",
                message: 'Invalid API key',
                data: {}
            });
        }

        res.status(200).json({
            status: "OK",
            message: 'Valid token',
            data: {
                admin_id: adminUser.id,
                email: adminUser.email
            }
        });

    } catch (error) {
        console.error('Error testing token:', error);
        res.status(500).json({
            status: "Error",
            message: 'Internal server error',
            data: {}
        });
    }
});

// generar token (zzzzzzzzzzzzzzz)
function generateApiKey(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        "CLAVE_SECRETA",
        {
            expiresIn: "1h"
        }
    );
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
