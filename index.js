//importa a biblioteca express
const { json } = require('body-parser');
const express =require('express');
//importa a biblioteca SQLite3
const sqlite3 = require('sqlite3').verbose();
//cria uma instacia do aplicativo express 'app' será o servidor
const app = express();
//define a porta que o servidor irá escutar por requisições
const port = 3000;
//middleware é um software que fica no meio do caminho da requisição
app.use(express.json());

const db = new sqlite3.Database('./meubanco.db', (err) =>{
    //se err não for nulo significa que ocorreu um erro na conexão
    if (err){
        console.error('Erro ao conectar banco de dados', err.message);
        //se a conexão for bem sucedida
    }else{
        console.log('Conectado ao banco de dados SQLite');
    }
    db.run(`CREATE TABLE IF NOT EXISTS usuarios(
        id INTEGER PRIMARY KEY AUTOINCREMENT, -- 'id' é chave primaria
        nome TEXT NOT NULL, -- 'nome' é um texto e não pode ser nulo
        email TEXT UNIQUE NOT NULL -- 'email' é um texto e não pode ser nulo
        )`, (err) =>{
            if(err){
                console.error('Erro ao criar tabela', err.message);
            }else{
                console.log('Tabela usuarios pronta');
            }
        });
});

//rotas CRUD (Creat, Read, Uptade, Delete)
//POST = Creat
app.post('/usuarios', (req, res) =>{
    //CREATE: rota para criar um novo usuario
    //app.post() define que esta rota responde a requisições HTTP tipo POST
    //o caminho da rota é '/usuarios'
    //extrai 'nome' e 'email' do corpo da requisição(req.body)
    const {nome, email} = req.body;
    //validação simple para garantir que nome e email foram enviados
    if (!nome || !email){
        //se faltar algum campo, retorna erro 400(Bad Request)
        return res.status(400).json({error: 'Nome e email são obrigatórios'});
    }
    //comando SQL para inserir um novo registro na tabela 'usuarios'
    //od '?' são placeholders que serão substituidos pelos valores digitados
    const sql = `INSERT INTO usuarios (nome, email) VALUES (?, ?)`;

    db.run(sql, [nome, email], function(err){
        //se ocorrer ero pode ser email já existe retorna erro 500
        if (err) {
            console.error(err.message);
            return res.status(500).json({error: 'Erro ao inserir usuario ou email já existe'});
        }
        res.status(201).json({
            //mensagem 201  retorna criado com sucesso
            message: 'Usuário criado com sucesso!',
            id: this.lastID
        });
    });
});

//GET = Read
app.get('/usuarios', (req, res) =>{
    const sql = `SELECT * FROM usuarios`;
    db.all(sql, [], (err, rows) =>{
        if (err) {
            console.error(err.message);
            return res.status(500).json({error: 'Erro ao buscar usuários'});
        }
        res.json({
            message: 'Usuários listados com sucesso!',
            data: rows
        });
    })
});

//GET = Read com ID
app.get('/usuarios/:id', (req, res) => {
    const {id} = req.params;
    const sql = `SELECT * usuarios WHERE  id = ?`;
    db.get(sql, [id], (err, row) =>{
        if (err){
            console.error(err.message);
            return res.status(500).json({error: 'Erro ao buscar usuário'});
        }
        if(row) {
            res.json({
                message: 'Usuario encontrado!',
                data: row
            });
        }else{
            res.status(404).json({error: 'Usuário não encontrado'});
        } 
    });
});

//PUT = Update
app.put('/usuarios/:id', (req, res) =>{
    const {id} = req.params;
    const {nome, email} = req.body;
    if (!nome || !email){
        return res.status(400).json({ error: 'Nome e email são obrigatórios'});
    }
    const sql = `UPDATE usuarios SET nome = ?, email = ? WHERE id = ?`;
    //executa o comando de atualização
    db.run(sql, [nome, email, id], function(err){
        if (err){
            console.error(err.message);
            return res.status(500).json({error: 'Erro ao atuaizar usuario'});
        }
        if (this.changes > 0){
            res.status(404).json({error: 'Usuário não encontrado'});
        }
    });
});

//DELETE  = exclui
app.delete('/usuarios/:id', (req, res) =>{
    const {id} = req.params;
    const sql = `DELETE FROM usuarios WHERE id = ?`;
    db.run(sql, [id], function(err){
        if (err){
            console.error(err.message);
            return res.status(500).json({error: 'Erro ao deletar usuário'});
        }
        if (this.changes > 0) {
            res.json({message: `Usuário com ${id} deltado com sucesso`});
        }else{
            res.status(404).json({error: 'Usuário não encontrado'});
        }     
    });
});

//inicia o servidor e faz escuta da porta definida
app.listen(port,() =>{
    console.log(`Servidor rodando em http://localhost:${port}`);
});
process.on('SIGINT', () =>{
    db.close((err) => {
        if (err){
            console.error(err.message);
        }
        console.log('Conexão com o banco de daods SQLite fechada');
        process.exit(0);
    });
});