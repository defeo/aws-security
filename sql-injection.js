var express = require('express'),
    mysql = require('mysql');

var app = express();
app.set('view engine', 'jade');

/* Configuration de la base de données.

   Avant de faire tourner cet exemple, il faut lancer le serveur MySQL de
   Cloud9 avec les commandes
   
       mysql-ctl install
       mysql-ctl start
*/
var db = mysql.createConnection({
     host     : process.env.IP,
     user     : process.env.C9_USER.substr(0,16),
     password : '',
     database : 'c9'
});

/* Initialisation de la base de données */
db.query("SHOW TABLES LIKE 'users'", function(err, result) {
    if(err) {
        console.log(err);
    } else if (result.length == 0) {
        db.query('CREATE TABLE users (login VARCHAR(255), password VARCHAR(255))', function(err, result) {
            if(err) {
                console.log(err);
            } else {
                db.query("INSERT INTO users VALUES ('toto', '1234'), ('titi', '4567')", function(err) {
                    if (err) console.log(err);
                });
            }
        });
    }
});


/***************************************************/

/* Page d'accueil */
app.get('/', function(req, res) {
    db.query("SELECT * FROM users", function(err, result) {
        if (err) {
            console.log(err);
            res.status(500).send("500 Erreur SQL.");
        } else {
            res.render('sql-injection.jade', { users: result });
        }
    });
});


/* Gestionnaire de login, sans échappement */
app.get('/login', function(req, res) {
    var q = "SELECT * FROM users WHERE login='" + req.query.user +
             "' AND password='" + req.query.pwd + "'";
    console.log('\nRequête SQL :  ' + q + '\n');
    
    db.query(q, function(err, result) {
        console.log('Résultats :', result);
        if (err) {
            console.log(err);
            res.status(500).send("500 Erreur SQL");
        } else if (result.length >= 1) {
            res.send('OK');
        } else {
            res.send('Utilisateur inconnu')
        }
    });
});


/* Gestionnaire login, avec requête préparée */
app.get('/login-safe', function(req, res) {
    var q = db.query("SELECT * FROM users WHERE login=? AND password=?", 
                     [ req.query.user, req.query.pwd ],
                     function(err, result) {
                        if (err) {
                            console.log(err);
                            res.status(500).send("500 Erreur SQL");
                        } else if (result.length >= 1) {
                            res.send('OK');
                        } else {
                            res.send('Utilisateur inconnu')
                        }
    });
    console.log('\nRequête SQL :  ' + q.sql + '\n');
});


app.listen(process.env.PORT);