const mongoose = require('mongoose')
const Document = require('./Document')
const uri = process.env.MONGODB_URI;

// mongoose.connect('mongodb://localhost:27017/lofinotes');

mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.log('Error:- ' + err))

const io = require("socket.io")(3001, {
  cors: {
    origin: "https://lofi-study-room.herokuapp.com/",
    methods: ["GET", "POST"]
  }
})

const defaultValue = ''

// listening for text changes
io.on("connection", socket => {
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

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));