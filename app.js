var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs');

    var cfenv = require('cfenv');

app.set('view engine', 'ejs');
app.set('views', 'views');   
app.use(express.static('public')); 


var appEnv = cfenv.getAppEnv();

var host = process.env.VCAP_APP_HOST || process.env.HOST || appEnv.url || 'localhost';
var port = process.env.VCAP_APP_PORT || process.env.PORT || appEnv.port || 8888 ;

var onlineuser = [];

// Chargement de la page 
app.get('/', function (req, res) {
  res.render('material', {host: host, port: port});
});

io.sockets.on('connection', function (socket, pseudo) {

    // Dès qu'on nous donne un pseudo, on le stocke en variable de session 
    // et on informe les autres personnes
    socket.on('new_client', function(pseudo) {

        onlineuser.push(pseudo);

        pseudo = ent.encode(pseudo);
        socket.pseudo = pseudo;
        socket.broadcast.emit('new_client', pseudo);

        socket.emit('update', onlineuser);
    });

    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur 
    // et on le transmet aux autres personnes
    socket.on('message', function (message) {
        message = ent.encode(message);
        socket.broadcast.emit('message', {pseudo: socket.pseudo, message: message});
    }); 

    socket.on('keydown', function() {
       
        socket.broadcast.emit('handle_keydown', socket.pseudo);
    });

    socket.on('keyup', function() {
       
        socket.broadcast.emit('handle_keyup');
    });

    /*
    socket.on('disconnect', function (indexUser) {

        onlineuser.splice(indexUser, 1);
        socket.emit('update', onlineuser);
        console.log('user disconnected');
    });
    */

 });



server.listen(port, appEnv.bind, function() {
    console.log("En écoute sur "+ host);
});
