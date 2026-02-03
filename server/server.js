const express = require("express");
const cors = require('cors');
const path = require("path");
const bcrypt = require('bcrypt');

const { sequelize, user, petition, response } = require('./bbdd');

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
        if (bcrypt.compare(password, adminUser.password)) {
            res.status(200).json(
                { 
                    status: "OK",
                    message: 'User successfully authenticated',
                    data: {}
                }
            );
        }
        else {
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
