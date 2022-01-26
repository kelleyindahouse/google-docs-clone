// require('dotenv').config()

const mongoose = require('mongoose')
const Document = require('./Document')
const uri = process.env.MONGODB_URI
const express = require('express')
const app = express()
const { join } = require('path')
const http = require('http');
const socketio = require('socket.io')
const session = require('express-session')
const server = require('http').createServer(app)
const io = require('socket.io')(server)
// io.on('connection', () => { /* … */ });

sessionStore = new session.MemoryStore();

app.set('socketio', io)

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

// const io = require('socket.io')(3000 {
//   cors: {
//     origin: ['https://lofi-study-room.herokuapp.com/']
//   }
// })

// mongoose.connect('mongodb://localhost:27017/lofinotes');

app.use(express.static(join(__dirname, 'client', 'build')))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.log('Error:- ' + err))


const defaultValue = ''

// listening for text changes
io.on('connection', socket => {
  socket.on('get-document', async documentId => {
    // capturing function to find document by Id
    const document = await findOrCreateDocument(documentId)
    // putting socket into a 'room' based on documentId and everyone with this socket can talk to one another
    socket.join(documentId)
    // send out data from matching document
    socket.emit('load-document', document.data)

    socket.on('send-changes', delta => {
      // broadcasts to everyone but 'us' that there are changes and 'delta' are those changes
      socket.broadcast.to(documentId).emit('receive-changes', delta)
    })
    // updating saved data on documents
    socket.on('save-document', async data => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

async function findOrCreateDocument(id) {
  if (id == null) return

  const document = await Document.findById(id)
  if (document) return document
  return await Document.create({ _id: id, data: defaultValue })
}

const PORT = process.env.PORT || 6565
server.listen(PORT, () => console.log(`Server running on ${PORT}`))