let http = require('http');
let fs = require('fs');
let url = require("url");


let server = http.createServer(function(req, res) {
    // Le path de la request
    let pathname = url.parse(req.url).pathname;

    console.log("Request for " + pathname + " received.");

    if(pathname == "/") {
        res.writeHead(200, {"Content-Type": "text/html"});
        html = fs.readFileSync("./index.html", "utf8");
        res.write(html);
    } else if (pathname == "/app.js") {
        res.writeHead(200, {"Content-Type": "text/javascript"});
        script = fs.readFileSync("app.js", "utf8");
        res.write(script);
    } else if (pathname == "/domToJson.js") {
        res.writeHead(200, {"Content-Type": "text/javascript"});
        script = fs.readFileSync("domToJson.js", "utf8");
        res.write(script);
    } else if (pathname == "/style.css"){
        res.writeHead(200, {"Content-Type":"text/css"});
        style = fs.readFileSync("style.css", "utf8");
        res.write(style);
    }
    res.end();
});

// Chargement de socket.io
let io = require('socket.io').listen(server);

// Nombre de joueurs
let numberPlayer = 0;

// Connexion d'un client
io.sockets.on('connection', function(socket) {
    // Quand un client se connecte, on le log
    console.log('Un client est connecté !');
    numberPlayer++;

    // Si il y a deux joueurs on lance le jeu
    if(numberPlayer == 2){
        // Envoi à tout le monde
        io.emit("startGame");
    }

    // Dès que l'on reçoit un message et son objet, on le broadcast aux autres //

    socket.on("sendGrid", function(grid){
        socket.broadcast.emit("gridPlayer2", grid);
    });

    socket.on("sendScore", function(score){
        socket.broadcast.emit("scorePlayer2", score);
    });

    socket.on("sendMiniGrid", function(minigrid){
        socket.broadcast.emit("miniGridPlayer2", minigrid);
    });

    // Quand un client se déconnecte, on le log
    socket.on('disconnect', function() {
        console.log("Un client s'est déconnecté !");
        numberPlayer--;
    });
});

server.listen(8080);
