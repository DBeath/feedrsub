var socketio = require('socket.io');

module.exports.listen = function (app) {
  return new SocketIO(app); 
};

function SocketIO(app) {
  this.io = socketio.listen(app);

  this.io.sockets.on('connection', function (socket) {
    console.log('Socket connected');
  });
};

SocketIO.prototype.emitMessage = function (msg) {
  this.io.sockets.emit('message', { message: msg });
  console.log('Emitted message %s', msg);
};