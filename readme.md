# Servler

Authenticated service API with generic actions and persistent content types

```js
import servler from 'servler'

servler({

  contentTypes: {
  },

  actions: {
    ping(data, context) {
      return { message: 'pong', data }
    }
  },

  // Optional
  webSocketServer(io, context) {

    io.on('connection', socket => {

      console.log('a user connected')

      socket.on('disconnect', () => {
        console.log('user disconnected')
      })

      socket.on('chat message', msg => {
        console.log(`message: ${msg}`)
        io.emit('chat message', msg)
      })
    })
  }
}

}).catch(console.error)
```

## Develop this library

Install dependencies

```sh
yarn
```

Develop: Watch files; Recompile and type check on changes

```sh
yarn dev
```

While the above is running, run tests (and watch/retest) in another terminal window:

```sh
yarn test
```

Build

```sh
yarn build
```

Publish to NPM

```sh
npm run release
```
