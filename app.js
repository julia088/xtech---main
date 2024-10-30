const express = require('express');
const bodyParser = require('body-parser');
const connection = require('./db');
const path = require('path');
const multer = require('multer'); // Importa multer

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

// Configuração do multer para salvar as fotos na pasta 'uploads'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pasta onde as fotos serão salvas
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Define o nome do arquivo
    }
});

const upload = multer({ storage }); // Inicializa o multer com a configuração de armazenamento

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/areaAluno.html'));
});

// Rota de login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const query = 'SELECT * FROM usuario WHERE email = ?';
        const [results] = await connection.promise().query(query, [email]);

        if (results.length > 0) {
            const user = results[0];
            const isPasswordValid = await bcrypt.compare(senha, user.senha);

            if (isPasswordValid) {
                return res.status(200).json({
                    message: 'Login bem-sucedido!',
                    userEmail: user.email,
                    userName: user.nome,
                    photo: user.foto
                });
            }
        }
        res.status(401).send('E-mail ou senha incorretos!');
    } catch (err) {
        console.error('Erro na consulta ao banco de dados:', err);
        res.status(500).send('Erro no servidor');
    }
});

// Rota de cadastro
app.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        const queryCheck = 'SELECT * FROM usuario WHERE nome = ? OR email = ?';
        const [results] = await connection.promise().query(queryCheck, [nome, email]);

        if (results.length > 0) {
            return res.status(400).json({ message: "Nome ou e-mail já estão cadastrados" });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);
        const profilePic = 'imagens/default.jpg';

        const queryInsert = 'INSERT INTO usuario (nome, email, senha, profile_pic) VALUES (?, ?, ?, ?)';
        await connection.promise().query(queryInsert, [nome, email, hashedPassword, profilePic]);

        res.json({ message: "Usuário cadastrado com sucesso!" });
    } catch (err) {
        console.error('Erro ao cadastrar usuário:', err);
        res.status(500).json({ message: "Erro ao cadastrar usuário" });
    }
});

// salva as informaçõs de contato
app.post('/submit-form', async (req, res) => {
    const { name, email, phone, message } = req.body;

    try {
        const sql = 'INSERT INTO contato (nome, email, telefone, mensagem) VALUES (?, ?, ?, ?)';
        await connection.promise().query(sql, [name, email, phone, message]);
        console.log('Dados inseridos no banco');
        res.send('Mensagem enviada com sucesso!');
    } catch (err) {
        console.error('Erro ao salvar contato:', err);
        res.status(500).send('Erro ao enviar mensagem.');
    }
});

app.post('/newsletter', async (req, res) => {
    const { email } = req.body;

    try {
        const sql = 'INSERT INTO newsletter (email) VALUES (?)';
        await connection.promise().query(sql, [email]);
        console.log('E-mail cadastrado com sucesso!');
        res.status(201).send('E-mail cadastrado com sucesso!');
    } catch (err) {
        console.error('Erro ao salvar o e-mail no banco:', err);
        res.status(500).send('Erro ao cadastrar e-mail.');
    }
});

// Rota para upload de foto (apenas para usuários logados)
app.post('/uploadFoto', upload.single('photo'), async (req, res) => {
    const userEmail = req.body.userEmail;
    const foto = req.file ? req.file.path : null;

    try {
        const query = 'UPDATE usuario SET foto = ? WHERE email = ?';
        await connection.promise().query(query, [foto, userEmail]);
        res.status(200).send('Foto enviada com sucesso!');
    } catch (err) {
        console.error('Erro ao atualizar a foto do usuário:', err);
        res.status(500).send('Erro ao fazer upload da foto.');
    }
});

app.get('/progresso', async (req, res) => {
    const usuarioEmail = req.session.usuario_email;

    try {
        const sql = 'SELECT curso_id, progresso FROM progresso WHERE usuario_email = ?';
        const [results] = await connection.promise().query(sql, [usuarioEmail]);
        res.json(results);
    } catch (err) {
        console.error('Erro ao buscar progresso:', err);
        res.status(500).json({ error: 'Erro ao buscar progresso' });
    }
});

app.post('/avaliacao', async (req, res) => {
    const { curso_id, rating, userEmail } = req.body;

    try {
        const query = 'INSERT INTO avaliacao (usuario_email, curso_id, rating) VALUES (?, ?, ?)';
        await connection.promise().query(query, [userEmail, curso_id, rating]);
        res.status(200).json({ message: 'Avaliação salva com sucesso' });
    } catch (err) {
        console.error('Erro ao salvar a avaliação:', err);
        res.status(500).json({ message: 'Erro ao salvar a avaliação' });
    }
});

// Rota para salvar progresso
app.post('/salvarProgresso', async (req, res) => {
    const { curso_id, progresso, userEmail } = req.body;

    try {
        const querySelect = 'SELECT * FROM progresso WHERE usuario_email = ? AND curso_id = ?';
        const [results] = await connection.promise().query(querySelect, [userEmail, curso_id]);

        if (results.length > 0) {
            const queryUpdate = 'UPDATE progresso SET progresso = ? WHERE usuario_email = ? AND curso_id = ?';
            await connection.promise().query(queryUpdate, [progresso, userEmail, curso_id]);
            res.status(200).json({ message: 'Progresso atualizado com sucesso' });
        } else {
            const queryInsert = 'INSERT INTO progresso (usuario_email, curso_id, progresso) VALUES (?, ?, ?)';
            await connection.promise().query(queryInsert, [userEmail, curso_id, progresso]);
            res.status(200).json({ message: 'Progresso salvo com sucesso' });
        }
    } catch (err) {
        console.error('Erro ao salvar progresso:', err);
        res.status(500).json({ message: 'Erro ao salvar progresso' });
    }
});

// Rota para obter dados do usuário logado
app.get('/api/user/:userEmail', async (req, res) => {
    const userEmail = req.params.userEmail;

    try {
        const query = 'SELECT * FROM usuario WHERE email = ?';
        const [results] = await connection.promise().query(query, [userEmail]);

        if (results.length > 0) {
            const user = results[0];
            res.json({
                userName: user.nome,
                userEmail: user.email,
                profilePic: user.foto
            });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado.' });
        }
    } catch (err) {
        console.error('Erro ao buscar dados do usuário:', err);
        res.status(500).json({ message: 'Erro ao buscar dados do usuário.' });
    }
});

// Rota de logout
app.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logout realizado com sucesso!' });
});

app.use('/uploads', express.static('uploads'));

app.listen(5505, () => {
    console.log('Servidor rodando na porta 5505');
});