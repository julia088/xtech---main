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
        const sql = 'INSERT INTO contato (nome, email, telefone, mensagem) VALUES (?, ?, ?, ?)';
        const values = [name, email, phone, message];
            
        connection.query(sql, values, (err, result) => {
            if (err) throw err;
            console.log('Dados inseridos no banco');
            res.send('Formulário enviado com sucesso!');
            });
});

app.post('/newsletter', (req, res) => {
    const { email } = req.body;

    const sql = 'INSERT INTO newsletter (email) VALUES (?)';
    
    connection.query(sql, [email], (err, result) => {
        if (err) {
            console.error('Erro ao salvar o e-mail no banco:', err);
            return res.status(500).send('Erro ao cadastrar e-mail.');
        }
        console.log('E-mail cadastrado com sucesso!');
        res.send('Cadastro realizado com sucesso!');
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

app.get('/progresso', (req, res) => {
    const usuarioId = req.session.usuario_id; // Assumindo que você armazena o id do usuário na sessão
    const sql = `SELECT curso_id, progresso FROM progresso WHERE usuario_id = ?`;

    db.query(sql, [usuarioId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar progresso' });
        }
        res.json(results);
    });
});

app.post('/avaliacao', (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    const { curso_id, rating } = req.body;
    const usuario_id = req.session.user.id; // Obtém o ID do usuário logado da sessão

    // Salvar a avaliação no banco de dados
    const query = 'INSERT INTO avaliacao (usuario_id, curso_id, rating) VALUES (?, ?, ?)';
    connection.query(query, [usuario_id, curso_id, rating], (error, results) => {
        if (error) {
            console.error('Erro ao salvar a avaliação:', error);
            return res.status(500).json({ message: 'Erro ao salvar a avaliação' });
        }
        res.status(200).json({ message: 'Avaliação salva com sucesso' });
    });
});

// Rota para salvar progresso
app.post('/salvarProgresso', (req, res) => {
    const { curso_id, progresso } = req.body;
    const usuario_id = req.session.user.id; // Obtém o ID do usuário logado da sessão

    // Verificar se o progresso já existe
    const querySelect = 'SELECT * FROM progresso WHERE usuario_id = ? AND curso_id = ?';
    connection.query(querySelect, [usuario_id, curso_id], (error, results) => {
        if (error) {
            console.error('Erro ao verificar progresso:', error);
            return res.status(500).json({ message: 'Erro ao verificar progresso' });
        }

        if (results.length > 0) {
            // Atualizar o progresso existente
            const queryUpdate = 'UPDATE progresso SET progresso = ? WHERE usuario_id = ? AND curso_id = ?';
            connection.query(queryUpdate, [progresso, usuario_id, curso_id], (error, results) => {
                if (error) {
                    console.error('Erro ao atualizar progresso:', error);
                    return res.status(500).json({ message: 'Erro ao atualizar progresso' });
                }

                // Atualiza o progresso na sessão
                if (!req.session.progresso) {
                    req.session.progresso = {};
                }
                req.session.progresso[curso_id] = progresso; // Atualiza o progresso na sessão

                res.status(200).json({ message: 'Progresso atualizado com sucesso', progresso: req.session.progresso });
            });
        } else {
            // Inserir novo progresso
            const queryInsert = 'INSERT INTO progresso (usuario_id, curso_id, progresso) VALUES (?, ?, ?)';
            connection.query(queryInsert, [usuario_id, curso_id, progresso], (error, results) => {
                if (error) {
                    console.error('Erro ao salvar progresso:', error);
                    return res.status(500).json({ message: 'Erro ao salvar progresso' });
                }
                // Salva o progresso na sessão
                if (!req.session.progresso) {
                    req.session.progresso = {};
                }
                req.session.progresso[curso_id] = progresso; // Atualiza o progresso na sessão

                res.status(200).json({ message: 'Progresso salvo com sucesso', progresso: req.session.progresso });
            });
        }
    });
});

// Rota para obter dados do usuário logado
app.get('/api/user', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    // Retorna os dados do usuário que estão armazenados na sessão
    res.json({
        userId: req.session.user.id,
        userName: req.session.user.name,
        userEmail: req.session.user.email,
        profilePic: req.session.profilePic
    });
});

// Rota de logout
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao encerrar sessão.' });
        }
        res.status(200).json({ message: 'Logout realizado com sucesso!' });
    });
});

app.use('/uploads', express.static('uploads'));

app.listen(5505, () => {
    console.log('Servidor rodando na porta 5505');
});