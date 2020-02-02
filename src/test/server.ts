import servler from '../index'

const webSocketServer = (io, context) => {

  io.on('connection', socket => {

    console.log('a user connected');

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

    socket.on('chat message', msg => {
      console.log(`message: ${msg}`);
      io.emit('chat message', msg);
    });
  });
}

servler({

  contentTypes: {
  },

  actions: {
    ping(data, context) {
      return { message: 'pong', data }
    }
  },

  webSocketServer

}).catch(console.error)
