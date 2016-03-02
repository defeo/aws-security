var express = require('express');
var session = require('express-session');
var bodyP = require('body-parser');
var crypto = require('crypto');
var sse = require('sse-nodejs');
var evt = require('events');
var app = express();

var store = new session.MemoryStore();
/* On utilise une variable globale en guise de base de données, pour
 * simplifier le code.
 * On crée un compte par défaut pour faciliter la démo. */
var users = { hacker : { name: 'hacker', pwd: 'pwn3d', credit: 1000, } };

app.use(bodyP.urlencoded({ extended: false }))
    .use(session({
	secret: 'holy hand grenade',
	resave: false,
	saveUninitialized: false,
	store: store,
    }))
    .use(function(req, res, next) {
	// Pour le serveur à événements
	if (req.method == 'POST')
	    events.emit('post');
	next();
    })
    .use(function(req, res, next) {
	// Garbage collection aggressive pour éviter les leaks
	var mem = process.memoryUsage();
	if (mem.heapUsed > 5e8) {
	    store.clear();
	    users = { hacker : { name: 'hacker', pwd: 'pwn3d', credit: 1000, } };
	}
	next();
    })
    .set('view engine', 'jade')

/* Route principale:
 *
 * En GET:
 * - Si la session est vide, propose un formulaire de login ;
 * - Sinon affiche la situation de compte.
 *
 * En POST
 * - Si les données de connexion correspondent à un utilisateur, 
 *   connecte l'utilisateur et rédirige ;
 * - Si les données de connexion ne correspondent à aucun utilisateur
 *   existant, crée l'utilisateur et réridirge ;
 * - Sinon donne un erreur.
 */
app.all('/', function(req, res) {
    var user;
    if (req.method == 'POST' && req.body.username && req.body.pwd) {
	user = users[req.body.username];
	if (!user) {
	    username = req.body.username;
	    user = users[username] = {
		name: username,
		pwd: req.body.pwd,
		credit: 1000,
	    };
	    req.session.username = username;
	    res.redirect('/');
	} else if (user.pwd == req.body.pwd) {
	    req.session.username = user.name;
	    res.redirect('/');
	} else {
	    res.status(401).send('Unauthorized');
	}
    } else {
	user = users[req.session.username];
	res.render('csrf-demo.jade', { user: user, users: users,
				       confirm: undefined !== req.query.confirm });
    }
});

/* Route pour le transfert d'argent. Récupère l'utilisateur de la
 * session courante et transfère la quantité d'argent indiquée au
 * compte destinataire. */
app.post('/transfer', function(req, res) {
    if (req.session.username) {
	var from = users[req.session.username];
	var to = users[req.body.to];
	var amount = parseInt(req.body.amount);
	if (to && amount > 0 && amount < from.credit) {
	    to.credit += amount;
	    from.credit -= amount;
	    res.redirect('/');
	} else {
	    res.status(400).send('Bad request');
	}
    } else {
	res.status(401).send('Unauthorized');
    }
});

/* Même logique que la route précédente, mais demande une confirmation
 * avec un nonce avant d'opérer le transfert. */
app.post('/transfer-w-confirm', function(req, res) {
    if (req.session.username) {
	var from = users[req.session.username];
	var to = users[req.body.to];
	var amount = parseInt(req.body.amount);
	if (to && amount > 0 && amount < from.credit) {
	    if (req.body.nonce &&
		req.body.nonce == req.session.nonce) {
		to.credit += amount;
		from.credit -= amount;
		res.redirect('/?confirm');
	    } else {
		var nonce = req.session.nonce = crypto.randomBytes(16).toString('base64');
		res.render('csrf-confirmation.jade', { nonce: nonce, to: to, amount: amount });
	    }
	} else {
	    res.status(400).send('Bad request');
	}
    } else {
	res.status(401).send('Unauthorized');
    }
});

/* Serveur à évènements, pour rafraichir les pages */
var events = new evt.EventEmitter();
app.get('/evts', function(req, res) {
    var client = sse(res, { padding: false });
    var cb = function() {
	// Retarder pour éviter des race conditions dans Chrome
	setTimeout(function() { client.sendEvent('post', ''); }, 200);
    };
    events.on('post', cb);
    client.disconnect(function () {
	events.removeListener('post', cb);
    });
});

app.listen(process.env.PORT || 8080);
