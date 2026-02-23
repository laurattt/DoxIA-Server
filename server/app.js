const express = require("express");
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken')
const path = require("path");

const { sequelize, user, request, response, image, sms } = require('./bbdd');

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

////////////////////////////////
//////    END-POINTS    ////////
////////////////////////////////

// --> POST     /api/usuaris/registrar    
app.post('/api/usuaris/registrar', async (req, res) => {
    const { email, telefon, nickname } = req.body;

    try {
        let currentUser = await user.findOne({ 
            where: { email } 
        });

        if (!currentUser) { // crear usuario etc etc
            currentUser = await user.create({
                nickname,
                email,
                telefon,
                role: 'user',
                validat: false 
            });
        }

        console.log("Usuario creado: ",currentUser.nickname);

        //const codiGenerat = await querySms(telefon);  //el api_key se solicita desde la web --> http://localhost:8000/token/
        const codiGenerat = "654321"

        if (!codiGenerat) {
            return res.status(500).json({
                status: "Error",
                message: "No s'ha pogut enviar el SMS de verificació"
            });
        }

        console.log("SMS enviado: ",codiGenerat);

        await sms.create({
            user_id: currentUser.user_id,
            telefon: telefon,
            sms: codiGenerat
        });

        res.status(200).json({
            status: "OK",
            message: "Registre inicial correcte. Rebràs un SMS amb el codi.",
            data: { user_id: currentUser.user_id }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "Error", message: "Internal server error" });
    }
});

async function querySms(telefonUser) {

    const smsNumber = Math.floor(100000 + Math.random() * 900000);

    const requestBody = {
        api_token: "ZWpujLkVdNQoJcugtl87nutR5red8C8UxhJ9C0MhQVJ4PVrOOfS65H6tfqbjbybw", // token que estaba en el curl del Enric -> api_token=xxxYYYzzz&username=ams23&text=prova+de+missatge+text+SMS&receiver=666111222"
        username: "uxia2",
        receiver: telefonUser,
        text: `El teu codi de validació és: ${smsNumber}`
    };

    try {
        const response = await fetch(`http://192.168.1.16:8000/api/sendsms/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        return smsNumber;

    } catch (error) {
        console.error('SMS request error:', error);
        return null; 
    }
}

// POST         /api/usuaris/validar
app.post('/api/usuaris/validar', async (req, res) => {
    const { user_id, codi_rebut } = req.body;

    try {
        const registreSms = await sms.findOne({
            where: { user_id },
            order: [['id_sms', 'DESC']] //DESC para ultimo code encontrado
        });

        if (!registreSms || registreSms.sms != codi_rebut) {
            return res.status(401).json(
                { status: "Error", 
                  message: "Codi incorrecte" 
                });
        }

        // si el code es correcto -> activar usuario y generar api_key
        const currentUser = await user.findByPk(user_id);
        const token = generateApiKey(currentUser); 

        currentUser.validat = true;
        currentUser.api_key = token;
        await currentUser.save();

        res.status(200).json({
            status: "OK",
            message: "Mòbil validat correctament",
            data: { api_key: token }
        });

    } catch (error) {
        res.status(500).json({ status: "Error", message: "Error en la validació" });
    }
});

// --> POST   /api/admin/usuaris/login 
app.post('/api/admin/usuaris/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const adminUser = await user.findOne({
            where: { email, role: 'admin' }
        });

        if (!adminUser) {
            return res.status(401).json({
                status: "Error",
                message: "User not found or not be admin"
            });
        }

        if (password === adminUser.password) {
            adminUser.api_key = null;
            const token = generateApiKey(adminUser);
            adminUser.api_key = token;

            await adminUser.save();

            return res.status(200).json({
                status: "OK",
                message: "Admin correct login",
                data: { token }
            });

        } else {
            return res.status(401).json({
                status: "Error",
                message: "Wrong password"
            });
        }

    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({
            status: "Error",
            message: "Internal server error"
        });
    }
});


// --> GET   /api/admin/usuaris     
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


// --> POST  /api/admin/usuaris/logout
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


// --> GET  /api/admin/usuaris/testtoken
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

// --> POST /api/admin/usuaris/add
app.post('/api/admin/usuaris/add', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const { user_id, nickname, email } = req.body;

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

        const newUser = await user.create({
            user_id: parseInt(user_id),
            nickname: nickname,
            email: email,
            role: 'user',
            api_key: null,
        });
        const token = generateApiKey(newUser);
        newUser.api_key = token;
        
        await newUser.save();
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({
            status: "Error",
            message: 'Internal server error',
            data: {}
        });
    }
});

// --> POST /api/admin/usuaris/remove
app.post('/api/admin/usuaris/remove', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const { user_id } = req.body;

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

        await user.destroy({
            where: {
                user_id: parseInt(user_id),
            },
        });

    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({
            status: "Error",
            message: 'Internal server error',
            data: {}
        });
    }
})

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

// POST  /api/analitzar-imatge + queryOllama -> query ollama + prompt

const PROMPT =`Analyze the provided image.

        Return ONLY a valid JSON object with the exact following structure:

        {
        "description": "Clear and detailed description of what appears in the image",
        "tags": ["tag1", "tag2", "tag3", "tag4"]
        }

        Rules:
        - The description must be 2 to 4 sentences long.
        - The quantity of the tags must be only four without repeats 
        - Tags must be single keywords in lowercase.
        - Tags should describe objects, environment, colors, and overall context.
        - Do not include any text before or after the JSON.
        - Do not use markdown formatting.
        - Ensure the output is valid JSON.
        - The language of the answer must be Catalan`; 

async function queryOllama(base64Image, prompt) {

    const requestBody = {
        model: `qwen2.5vl:7b`,
        prompt: prompt,
        images: [base64Image],
        stream: false
    };

    try {
        const response = await fetch(`${`http://192.168.1.24:11434/api`}/generate`, { // es correcta esta ip? 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.response) {
            throw new Error('Unexpected Ollama response format');
        }

        return data.response;

    } catch (error) {
        console.error('Ollama request error:', error);
        return null;
    }
}


const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/analitzar-imatge', upload.single('photo'), async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            status: "Error",
            message: "No image uploaded"
        });
    }

    const startTime = Date.now();

    try {
        
        console.log('Enviant petició a Ollama...');
        
        // se envia request y queda en bbdddddd
        const newRequest = await request.create({
            user_id: 1, 
            prompt: PROMPT,
            model: "qwen2.5vl:7b",
            stream: false,
            status: "pending"
        });

        // imagen a base64
        const base64Image = req.file.buffer.toString('base64');

        await image.create({ //guardar imagen en bbdddd
            request_id: newRequest.request_id,
            image_base64: base64Image
        });

        newRequest.status = "processing"; // estado cambiado
        await newRequest.save();

        // analisis con ollama
        const ollamaResponse = await queryOllama(base64Image, PROMPT);

        if (!ollamaResponse) {
            newRequest.status = "failed";
            await newRequest.save();

            return res.status(500).json({
                status: "Error",
                message: "Ollama failed"
            });
        }

        // controla posibles errores (json mal formado)
        const jsonStart = ollamaResponse.indexOf('{');
        const jsonEnd = ollamaResponse.lastIndexOf('}') + 1;
        const cleanJson = ollamaResponse.slice(jsonStart, jsonEnd);
        const parsed = JSON.parse(cleanJson);

        const processingTime = (Date.now() - startTime) / 1000;

        // respuesta en bbbddddd
        await response.create({
            request_id: newRequest.request_id,
            description: parsed.description,
            tags: parsed.tags,
            model_used: "qwen2.5vl:7b",
            processing_time: processingTime
        });

        newRequest.status = "completed"; //estado completado :D
        newRequest.processing_time = processingTime;
        await newRequest.save();

        res.status(200).json({
            status: "OK",
            description: parsed.description,
            tags: parsed.tags
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            status: "Error",
            message: "Internal server error"
        });
    }
});


////////////////////////////////
//////      PRUEBAS     ////////
////////////////////////////////

// server check
app.get('/api/status', (req, res) => {
    res.status(200).json({ status: "OK", message: "Servidor funcionant correctament" });
});


// prueba postman (?)
app.get('/postmanProba', (req, res) => {
    res.send('hola postman, hola hola hola');
});

app.get('/numDosPostmanProba', (req, res) => {
    res.send('prueba num doooooos, hola');
});

app.get('/PostmanProbaNewNew', (req, res) => {
    res.send('prueba num tres (actualizado?), hola');
});


app.post('/api/postmanProba', (req, res) => {
    console.log(req.body);
    res.json({ message: 'mensaje test recibido', data: req.body });
});


async function queryOllamaProva(base64Image, prompt){
    
const requestBody = {
        model: `qwen2.5vl:7b`,
        prompt: prompt,
        images: [base64Image],
        stream: false
    };

    try {
        console.log('Enviant petició a Ollama...');
        console.log(`URL: ${`http://192.168.1.24:11434/api`}/generate`);
        //console.log('Model:', `qwen2.5vl:7b`);
        
        const response = await fetch(`${`http://192.168.1.24:11434/api`}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Depuració de la resposta
        console.log('Resposta completa d\'Ollama:', JSON.stringify(data, null, 2));
        
        // Verificar si tenim una resposta vàlida
        if (!data || !data.response) {
            throw new Error('La resposta d\'Ollama no té el format esperat');
        }

        return data.response;
    } catch (error) {
        console.error('Error detallat en la petició a Ollama:', error);
        console.error('Detalls adicionals:', {
            url: `${`http://192.168.1.24:11434/api`}/generate`,
            model: `qwen2.5vl:7b`,
            promptLength: prompt.length,
            imageLength: base64Image.length
        });
        return null;
    }
}

async function imageToBase64(imagePath) {
    try {
        const data = await fs.readFile(imagePath);
        return Buffer.from(data).toString('base64');
    } catch (error) {
        console.error(`Error al llegir o convertir la imatge ${imagePath}:`, error.message);
        return null;
    }
}    


app.post('/api/pruebaImg', async (req, res) => {
    const imagesFolderPath = path.join(__dirname, '../imgProva');
    const resultados = [];

    try {
        console.log("Leyendo carpeta:", imagesFolderPath);
        const files = await fs.readdir(imagesFolderPath);

        for (const file of files) {
            const filePath = path.join(imagesFolderPath, file);
            const stats = await fs.stat(filePath);

            if (stats.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(file)) { // verif que sea img 
                
                const base64String = await imageToBase64(filePath);

                if (base64String) {
                    console.log(`Procesando imagen: ${file}`);
                    const prompt = "Identifica quin tipus d'animal apareix a la imatge";
                    
                    const response = await queryOllamaProva(base64String, prompt);
                    
                    resultados.push({
                        fitxer: file,
                        resposta: response || "Sin respuesta de Ollama"
                    });
                }
            }
        }

        res.json({
            success: true,
            total_processades: resultados.length,
            detalls: resultados
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, error: error.message });
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
