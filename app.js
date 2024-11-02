const express = require('express');
const bodyParser = require('body-parser');
const connection = require('./db');
const path = require('path');
const multer = require('multer');
const session = require('express-session');

const app = express();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static('public'));

// Configuração da sessão
app.use(session({
    secret: 'seuSegredoAqui',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'img')); // Pasta onde a imagem será armazenada
    },
    filename: (req, file, cb) => {
        const userId = req.session.user.id;
        const ext = path.extname(file.originalname);
        cb(null, `profile_${userId}${ext}`); // Nome do arquivo (ex: profile_1.jpg)
    }
});

const upload = multer({ storage: storage });

// middleware para verificar autenticação em rotas protegidas
function verificarAutenticacao(req, res, next) {
    if (req.session.user) {
        next(); // usuário autenticado, segue para a rota
    } else {
        res.redirect('/'); // redireciona para a página inicial se não estiver autenticado
    }
}

// rota inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/areaAluno.html'));
});

// rota de login
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    const query = 'SELECT * FROM usuario WHERE email = ? AND senha = ?';
    connection.query(query, [email, senha], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            req.session.user = { 
                id: 
                 results[0].id,nome:
                 results[0].nome, senha: 
                 results[0].senha, email:
                 results[0].email };
            console.log('Usuário logado:', req.session.user);
            return res.redirect('/portalAluno');
        } else {
            res.status(401).send('E-mail ou senha incorretos!');
        }
    });
});

// rota de cadastro
app.post('/cadastro', (req, res) => {
    const { nome, email, senha, profilePic } = req.body;

    const checkUserQuery = 'SELECT * FROM usuario WHERE email = ?';
    connection.query(checkUserQuery, [email], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            return res.status(409).send('Usuário já existe');
        }

        const insertUserQuery = 'INSERT INTO usuario (nome, email, senha, profilePic) VALUES (?, ?, ?, ?)';
        connection.query(insertUserQuery, [nome, email, senha, profilePic], (err, results) => {
            if (err) throw err;

            req.session.user = { id: results.insertId, email };
            console.log('Usuário registrado:', req.session.user);
            res.redirect('/portalAluno');
        });
    });
});

//rota protegida - portal do aluno
app.get('/portalAluno', verificarAutenticacao, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/portalAluno.html'));
});

app.post('/atualizarFoto', verificarAutenticacao, (req, res) => {
    const usuarioId = req.session.user.id;
    const profilePic = req.body.profilePic; // O caminho ou a URL da nova foto

    const query = 'UPDATE usuario SET profilePic = ? WHERE id = ?';
    connection.query(query, [profilePic, usuarioId], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar foto:', err);
            return res.status(500).json({ message: 'Erro ao atualizar foto' });
        }
        res.status(200).json({ message: 'Foto atualizada com sucesso!' });
    });
});

app.get('/getUserData', verificarAutenticacao, (req, res) => {
    const usuarioId = req.session.user.id;

    const query = 'SELECT nome, email, telefone, foto FROM usuario WHERE id = ?';
    connection.query(query, [usuarioId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
        }
        res.json(results[0]);
    });
});


app.get('/user', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ message: 'Usuário não autenticado' });
    }
});

app.post('/api/iniciar-curso', async (req, res) => {
    try {
        const { usuarioId, cursoId } = req.body;

        // Verifique se o progresso já existe para o usuário e o curso
        const [resultado] = await db.execute(
            'SELECT id FROM progresso WHERE usuario_id = ? AND curso_id = ?',
            [usuarioId, cursoId]
        );

        if (resultado.length === 0) {
            // Se não existe, insere um novo registro com progresso inicial de 0%
            await db.execute(
                'INSERT INTO progresso (usuario_id, curso_id, progresso) VALUES (?, ?, ?)',
                [usuarioId, cursoId, 0]
            );
        }

        res.status(200).send('Curso iniciado com sucesso');
    } catch (error) {
        console.error('Erro ao iniciar o curso:', error);
        res.status(500).send('Erro ao iniciar o curso');
    }
});

//busca informações sobre o curso pelo id
app.get('/api/curso/:id', (req, res) => {
    const cursoId = req.params.id;
    
    const query = 'SELECT * FROM curso WHERE id = ?';
    connection.query(query, [cursoId], (error, results) => {
        if (error) {
            return res.status(500).send('Erro ao buscar o curso');
        }
        if (results.length > 0) {
            res.json(results[0]); // Retorna o curso encontrado
        } else {
            res.status(404).send('Curso não encontrado');
        }
    });
});

// rota para salvar formulário de contato
app.post('/submit-form', (req, res) => {
    const { nome, email, telefone, mensagem } = req.body;

    const sql = 'INSERT INTO contato (nome, email, telefone, mensagem) VALUES (?, ?, ?, ?)';
    connection.query(sql, [nome, email, telefone, mensagem], (err, result) => {
        if (err) throw err;
        console.log('Dados inseridos no banco');
        res.send('Formulário enviado com sucesso!');
    });
});

// rota para progresso (proteção incluída)
app.get('/progresso', verificarAutenticacao, (req, res) => {
    const usuarioId = req.session.user.id;
    const sql = 'SELECT curso_id, progresso FROM progresso WHERE usuario_id = ?';

    connection.query(sql, [usuarioId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar progresso' });
        }
        res.json(results);
    });
});

// rota para avaliação
app.post('/avaliacao', verificarAutenticacao, (req, res) => {
    const { curso_id, rating } = req.body;
    const usuario_id = req.session.user.id;

    // Validação do rating e curso_id
    if (!curso_id || !rating) {
        return res.status(400).json({ message: 'Curso ID e rating são obrigatórios.' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating deve estar entre 1 e 5.' });
    }

    const querySelect = 'SELECT * FROM avaliacao WHERE usuario_id = ? AND curso_id = ?';
    connection.query(querySelect, [usuario_id, curso_id], (error, results) => {
        if (error) {
            console.error('Erro ao verificar avaliação:', error);
            return res.status(500).json({ message: 'Erro ao verificar avaliação.' });
        }

        const query = results.length > 0
            ? 'UPDATE avaliacao SET rating = ? WHERE usuario_id = ? AND curso_id = ?'
            : 'INSERT INTO avaliacao (usuario_id, curso_id, rating) VALUES (?, ?, ?)';

        const params = results.length > 0
            ? [rating, usuario_id, curso_id]
            : [usuario_id, curso_id, rating];

        connection.query(query, params, (error) => {
            if (error) {
                console.error('Erro ao salvar a avaliação:', error);
                return res.status(500).json({ message: 'Erro ao salvar a avaliação.' });
            }
            res.status(200).json({ message: results.length > 0 ? 'Avaliação atualizada com sucesso.' : 'Avaliação salva com sucesso.' });
        });
    });
});

// rota para salvar progresso do curso
app.post('/salvarProgresso', verificarAutenticacao, (req, res) => {
    const { curso_id, progresso } = req.body;
    const usuario_id = req.session.user.id;

    const querySelect = 'SELECT progresso FROM progresso WHERE usuario_id = ? AND curso_id = ?';
    connection.query(querySelect, [usuario_id, curso_id], (error, results) => {
        if (error) {
            console.error('Erro ao verificar progresso:', error);
            return res.status(500).json({ message: 'Erro ao verificar progresso' });
        }

        const currentProgress = results.length > 0 ? results[0].progresso : 0;

        // Somente atualizar se o novo progresso for maior que o atual
        if (progresso > currentProgress) {
            if (results.length > 0) {
                const queryUpdate = 'UPDATE progresso SET progresso = ? WHERE usuario_id = ? AND curso_id = ?';
                connection.query(queryUpdate, [progresso, usuario_id, curso_id], (error) => {
                    if (error) {
                        console.error('Erro ao atualizar progresso:', error);
                        return res.status(500).json({ message: 'Erro ao atualizar progresso' });
                    }
                    res.status(200).json({ message: 'Progresso atualizado com sucesso' });
                });
            } else {
                const queryInsert = 'INSERT INTO progresso (usuario_id, curso_id, progresso) VALUES (?, ?, ?)';
                connection.query(queryInsert, [usuario_id, curso_id, progresso], (error) => {
                    if (error) {
                        console.error('Erro ao salvar progresso:', error);
                        return res.status(500).json({ message: 'Erro ao salvar progresso' });
                    }
                    res.status(200).json({ message: 'Progresso salvo com sucesso' });
                });
            }
        } else {
            res.status(200).json({ message: 'Progresso já está atualizado' });
        }
    });
});

// rota de logout
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao encerrar sessão.' });
        }
        res.status(200).json({ message: 'Logout realizado com sucesso!' });
    });
});

app.use('/uploads', express.static('uploads'));

// inicializar o servidor
app.listen(5505, () => {
    console.log('Servidor rodando na porta 5505');
});