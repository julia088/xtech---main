const express = require('express');
const bodyParser = require('body-parser');
const connection = require('./db');
const path = require('path');
const session = require('express-session');
const multer = require('multer'); // Importa multer

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(session({
    secret: 'seuSegredoAqui',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/areaAluno.html'));
});

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

// Rota de login
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    const query = 'SELECT * FROM usuario WHERE email = ? AND senha = ?';
    connection.query(query, [email, senha], (err, results) => {
        if (err) {
            console.error('Erro na consulta ao banco de dados:', err);
            return res.status(500).send('Erro no servidor');
        }

        if (results.length > 0) {
            const user = results[0];

            // Salva as informações do usuário na sessão
            req.session.user = {
              id: user.id,
              username: user.nome,
              photo: user.foto // Aqui a foto já teria sido salva no upload posterior
            };

            return res.status(200).send('Login bem-sucedido!');
        } else {
            return res.status(401).send('E-mail ou senha incorretos!');
        }
    });
});

// Rota de cadastro
app.post('/cadastro', (req, res) => {
    const { nome, email, senha } = req.body;
    const query = 'INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)';

    connection.query(query, [nome, email, senha], (err, result) => {
        if (err) {
            console.error('Erro ao inserir no banco de dados: ' + err.stack);
            return res.status(500).send('Erro ao cadastrar o usuário.');
        }
        res.status(201).send('Cadastro realizado com sucesso!');
    });
});

     // salva as informaçõs de contato
app.post('/submit-form', (req, res) => {
        const { name, email, phone, message } = req.body;
           
        const sql = 'INSERT INTO contatos (nome, email, telefone, mensagem) VALUES (?, ?, ?, ?)';
        const values = [name, email, phone, message];
            
        db.query(sql, values, (err, result) => {
            if (err) throw err;
            console.log('Dados inseridos no banco');
            res.send('Formulário enviado com sucesso!');
            });
});

// Rota para upload de foto (apenas para usuários logados)
app.post('/uploadFoto', upload.single('photo'), (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Você precisa estar logado para fazer upload de uma foto.');
    }
//
    const userId = req.session.user.id;
    const foto = req.file ? req.file.path : null;

    // Atualiza o campo 'foto' do usuário no banco de dados
    const query = 'UPDATE usuario SET foto = ? WHERE id = ?';
    connection.query(query, [foto, userId], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar a foto do usuário: ' + err.stack);
            return res.status(500).send('Erro ao fazer upload da foto.');
        }

        // Atualiza a sessão com o novo caminho da foto
        req.session.user.photo = foto;

        res.status(200).send('Foto enviada com sucesso!');
    });
});

// Rota para obter progresso do curso (GET)
app.get('/obterProgresso', (req, res) => {
    const { cursoId } = req.query;
    const usuarioEmail = req.session.usuarioEmail; // Usuário logado na sessão

    if (!usuarioEmail) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const query = 'SELECT progresso FROM progresso WHERE usuario_email = ? AND curso_id = ?';
    db.query(query, [usuarioEmail, cursoId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro ao obter progresso' });
        
        const progresso = result[0]?.progresso || 0;
        res.json({ progresso });
    });
});


// Rota para salvar progresso do curso (POST)
app.post('/salvarProgresso', (req, res) => {
    const { cursoId, progresso } = req.body;
    const usuarioEmail = req.session.usuarioEmail; // Usuário logado na sessão

    if (!usuarioEmail) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const query = 'INSERT INTO progresso (usuario_email, curso_id, progresso) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE progresso = ?';
    db.query(query, [usuarioEmail, cursoId, progresso, progresso], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao salvar progresso' });
        res.json({ message: 'Progresso salvo com sucesso' });
    });
});

// Rota para obter dados do usuário logado
app.get('/api/user', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    // Retorna os dados do usuário que estão armazenados na sessão
    res.json({
        userId: req.session.userId,
        userName: req.session.userName,
        userEmail: req.session.userEmail,
        profilePic: req.session.profilePic
    });
});

// Rota de logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logout realizado com sucesso' });
});

app.use('/uploads', express.static('uploads'));

app.listen(5505, () => {
    console.log('Servidor rodando na porta 5505');
});