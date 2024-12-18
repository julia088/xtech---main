const express = require('express');
const bodyParser = require('body-parser');
const connection = require('./db');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const fs = require('fs');
const { promisify } = require('util');
const pdf = require('html-pdf');  // Instale a biblioteca 'html-pdf'
const certificadoPath = path.join(__dirname, 'img', 'certificado_1.png');

const app = express();

app.use(express.json());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static('public'));
app.use('/img', express.static(path.join(__dirname, 'img')));


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
        cb(null, path.join(__dirname, 'public', 'img')); 
    },
    filename: (req, file, cb) => {
        const userId = req.session.user.id;
        const ext = path.extname(file.originalname);
        cb(null, `profile_${userId}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Apenas imagens são permitidas!'));
    }
});

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

// Rota para enviar contato
app.post('/contato', (req, res) => {
    const { nome, email, telefone, mensagem } = req.body;

    // Verificar se todos os campos foram preenchidos
    if (!nome || !email || !telefone || !mensagem) {
        return res.json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }

    // Inserir os dados de contato no banco de dados
    connection.query(
        'INSERT INTO contato (nome, email, telefone, mensagem) VALUES (?, ?, ?, ?)', 
        [nome, email, telefone, mensagem], 
        (err, results) => {
            if (err) {
                console.error(err);
                return res.json({ success: false, message: 'Erro ao enviar a mensagem.' });
            }

            // Caso a inserção seja bem-sucedida
            res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
        }
    );
});

// Rota para cadastrar e-mail na newsletter
app.post('/newsletter', (req, res) => {
    const { email } = req.body;

    // Verificar se o campo e-mail foi preenchido
    if (!email) {
        return res.json({ success: false, message: 'O campo de e-mail é obrigatório.' });
    }

    // Verificar se o e-mail já está cadastrado na tabela newsletter
    connection.query('SELECT * FROM newsletter WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.json({ success: false, message: 'Erro ao verificar e-mail.' });
        }

        if (results.length > 0) {
            // E-mail já cadastrado
            return res.json({ success: false, message: 'Este e-mail já está cadastrado.' });
        }

        // Caso o e-mail não exista, insere na tabela newsletter
        connection.query('INSERT INTO newsletter (email) VALUES (?)', [email], (err, results) => {
            if (err) {
                console.error(err);
                return res.json({ success: false, message: 'Erro ao cadastrar e-mail.' });
            }

            // E-mail cadastrado com sucesso
            res.json({ success: true, message: 'E-mail cadastrado com sucesso!' });
        });
    });
});

//rota para atulizar o perfil do usuário
app.post('/atualizarPerfil', verificarAutenticacao, (req, res) => {
    const { nome, email, senha } = req.body;
    const userId = req.session.user.id;

    // atualiza os dados no banco de dados
    const query = 'UPDATE usuario SET nome = ?, email = ?, senha = ? WHERE id = ?';
    connection.query(query, [nome, email, senha, userId], (err) => {
        if (err) {
            console.error('Erro ao atualizar perfil:', err);
            return res.status(500).json({ message: 'Erro ao atualizar perfil' });
        }
        res.json({ message: 'Perfil atualizado com sucesso!' });
    });
});

//rota protegida - portal do aluno
app.get('/portalAluno', verificarAutenticacao, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/portalAluno.html'));
});

// Rota para atualizar a senha do usuário
app.post('/atualizarSenha', (req, res) => {
    const { email, newPassword } = req.body;

    // Usando Promises em vez de await
    connection.query('SELECT * FROM usuario WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.error(error);
            return res.json({ success: false, message: 'Erro ao verificar o usuário.' });
        }

        if (results.length > 0) {
            // Atualizar a senha no banco de dados
            connection.query('UPDATE usuario SET senha = ? WHERE email = ?', [newPassword, email], (error, results) => {
                if (error) {
                    console.error(error);
                    return res.json({ success: false, message: 'Erro ao atualizar a senha.' });
                }

                res.json({ success: true });
            });
        } else {
            res.json({ success: false, message: 'Usuário não encontrado.' });
        }
    });
});

//rota para bd
app.get('/getUserData', verificarAutenticacao, (req, res) => {
    const usuarioId = req.session.user.id;

    const query = 'SELECT nome, email, senha, profilePic FROM usuario WHERE id = ?';
    connection.query(query, [usuarioId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
        }
        res.json(results[0]);
    });
});

//rota protegida para o usuario
app.get('/user', verificarAutenticacao, (req, res) => {
    const userId = req.session.user.id;
    
    const query = 'SELECT nome, email, senha, profilePic FROM usuario WHERE id = ?';
    connection.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
        }
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    });
});

//api para inicio do cursos, através da session do usuário e id do curso
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
    console.log('Dados recebidos:', req.body); // Adicione esta linha
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

//atualizar imagem
app.post('/upload-profile-image', verificarAutenticacao, upload.single('profilePic'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo foi enviado' });
    }

    try {
        const userId = req.session.user.id;
        const imagePath = req.file.filename;

        const query = 'UPDATE usuario SET profilePic = ? WHERE id = ?';
        connection.query(query, [imagePath, userId], (err) => {
            if (err) {
                console.error('Erro ao atualizar foto de perfil no banco:', err);
                return res.status(500).json({ message: 'Erro ao atualizar foto' });
            }
            res.json({
                message: 'Imagem atualizada com sucesso!',
                filename: imagePath
            });
        });
    } catch (error) {
        console.error('Erro no upload de imagem:', error);
        res.status(500).json({ message: 'Erro no upload de imagem' });
    }
});

//rota para imprimir e baixar o certificado
  app.post('/gerar-certificado', verificarAutenticacao, (req, res) => {
    const { cursoId } = req.body;
    const usuarioId = req.session.user.id; // Obtendo o ID do usuário logado

    // Você pode criar um template HTML para o certificado e preencher os dados do aluno
    const certificadoHTML = `
        <html>
        <head>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');

                body {
                    font-family: 'Roboto', sans-serif;
                    background-color: #f4f6f9;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    text-align: center;
                }

                .container {
                    background-color: #ffffff;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    width: 100%;
                    max-width: 600px;
                    text-align: center;
                    position: relative;
                    box-sizing: border-box;
                }

                h2 {
                    color: #333;
                    font-size: 2.2rem;
                    font-weight: 700;
                    margin-bottom: 30px;
                }

                .certificado-info {
                    font-size: 1.4rem;
                    color: #333;
                    margin-bottom: 25px;
                    line-height: 1.6;
                }

                .certificado-info strong {
                    color: #4CAF50;
                    font-weight: 700;
                }

                .info-text {
                    font-size: 1.1rem;
                    color: #666;
                    margin-top: 30px;
                    line-height: 1.5;
                }

                .signature {
                    font-size: 1.2rem;
                    margin-top: 40px;
                    text-align: left;
                    font-style: italic;
                    color: #333;
                }

                .footer {
                    position: absolute;
                    bottom: 20px;
                    width: 100%;
                    text-align: center;
                    font-size: 1rem;
                    color: #999;
                }

                .logo {
                    width: 100px;
                    height: auto;
                    margin-bottom: 30px;
                }

                .date {
                    font-size: 1rem;
                    color: #666;
                    margin-top: 20px;
                }

                /* Estilo para a borda do certificado */
                .certificate-border {
                    border: 5px solid #4CAF50;
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                }

            </style>
        </head>
        <body>
            <div class="container">
                <div class="certificate-border">
                    <h2>Certificado de Conclusão</h2>
                    <div class="certificado-info">
                        <p>Certificamos que <strong>${req.session.user.nome}</strong></p>
                        <p>concluiu com sucesso o curso de <strong>${cursoId}</strong></p>
                        <p> na intituição CAPS - Centro de Aprendizado de Programação e Sistemas.</p>
                        <p class="date">Data de Conclusão: ${new Date().toLocaleDateString()}</p>
                    </div>

                    <div class="info-text">
                        <p>Este certificado é válido para fins educacionais e comprova a conclusão do curso mencionado.</p>
                    </div>
                </div>

                <!-- Rodapé com informações adicionais -->
                <div class="footer">
                    <p>Emitido pelo CAPS - Centro de Aprendizado de Programação e Sistemas</p>
                </div>
            </div>
        </body>
        </html>
    `;

    // Gerando o PDF com html-pdf
    pdf.create(certificadoHTML).toBuffer((err, buffer) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao gerar certificado.' });
        }

        // Retorna o PDF como um arquivo para download
        res.type('pdf');
        res.send(buffer);
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
