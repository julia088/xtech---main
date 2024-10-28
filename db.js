const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jujuBA007.',
    database: 'bancoEmail'
});

connection.connect((err) => {
    if(err) {
        console.error('Erro ao conectar ao banco de dados: ' + err.stack);
        return;
    }
   
    console.log('Conectado ao bando de dados MySQL.');
});
module.exports = connection;