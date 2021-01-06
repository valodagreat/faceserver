const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const Knex = require('knex');
const { response } = require('express');

const app = express();

const db = Knex({
        client: 'pg',
        connection: {
        host : '127.0.0.1',
        user : 'postgres',
        password : 'vals2s',
        database : 'smartbrain'
    }
    });

//db.select().table('users').then(data => console.log(data))

//app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json());
app.use(cors())

const dataBase = {
    users : [
        {
            id : '123',
            name : 'John',
            email : 'john@gmail.com',
            password : 'cookies',
            entries : 0,
            joined : new Date()
        },
        {
            id : '124',
            name : 'Sally',
            email : 'sally@gmail.com',
            password : 'bananas',
            entries : 0,
            joined : new Date()
        }
    ],
    /*login : [
        {
            id : '987',
            hash : ``,
            email : 'john@gmail.com'
        }
    ]*/
}

app.get('/', (req, res) => {
    
    res.json(dataBase.users)
})

app.post('/signin', (req, res) => {
    const {email , password} = req.body;
    db.select('email' , 'hash').from('login')
    .where({email : email})
    .then(data => {
        bcrypt.compare(password, data[0].hash, function(err, result) {
                if(result) {
                    return db.select('*').from('users').where({email:email})
                    .then(details => {
                        res.json(details[0])
                    }).catch( err=> res.status(400).send('unable to get users'))
                }
        });
    }).catch(err => res.status(400).send('wrong credentials'))
})

app.get('/profile/:id', (req, res)=>{
    db('users').select('*').where({id: req.params.id}).then(
        data=> {
        if(data.length){
            res.json(data[0])
        }else{
            res.status(400).send('User not found')
        }
    }
        )
})

app.put('/image', (req, res)=>{
    db('users')
    .where({id: req.body.id})
    .increment('entries', 1)
    .returning('entries')
    .then(news => res.json(news[0]))
    .catch(err => res.status(500).send('Error updating'))
})

app.post('/register', (req, res) => {
    const {name , email,password} = req.body
    if(!email||!name||!password){
        return res.status(400).json('invalid way to login')
    }
    let income;
    const mash = bcrypt.hash( password, null, null, function(err, hash) {
        // Store hash in your password DB.
        income = hash
    });
    db.transaction(trx => {
        trx.insert({
            hash : income,
            email : email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning('*')
            .insert({
                email : loginEmail[0],
                name : name,
                joined : new Date()
            }).then(user => res.json(user[0]))
        }).then(trx.commit)
        .catch(trx.rollback)
    })
        .catch(err => res.status(400).json('unable to join'))
})

/*bcrypt.hash("bacon", null, null, function(err, hash) {
    // Store hash in your password DB.
});

// Load hash from your password DB.
bcrypt.compare("bacon", hash, function(err, res) {
    // res == true
});
bcrypt.compare("veggies", hash, function(err, res) {
    // res = false
});*/

/*app.use(bodyParser.urlencoded({ extended: false }));


app.get('/profile', (req, res) => {
    
    res.send('getting profile')
})

app.post('/profile', (req, res) => {
    console.log(req.body)
    const user = {
        name: 'Emeritus',
        department: 'Civil-Engineering'
    }
    res.send(user)
})*/

app.listen(process.env.PORT || 3001, () => {
    console.log(`App is running on port ${process.env.PORT}`)
})
