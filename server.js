const express = require("express");
const app = express()
const http = require('http');
const server = http.createServer(app)
const port = process.env.PORT || 3000

const cors = require('cors')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(cors())

const io = require("socket.io")(server, {
    cors: {
      methods: ["GET", "POST"]
    }
  });

const mongoose = require('mongoose')

const schema = mongoose.Schema;
const questionSchema = new schema({
    options: String,
    person: String
})
const cusQues = mongoose.model('possibleQuestions', questionSchema)

mongoose.connect('mongodb+srv://Dhruv:gilbert130@cluster0.rcpc7.mongodb.net/Minority?retryWrites=true&w=majority')
    .then((result) => server.listen(port))

const homeRouter = require("./routes/home")
const roomRouter = require("./routes/room")

app.use("", homeRouter)
app.use("", roomRouter)

app.get('/pawned/:smth', (req, res) => {
    const newQues = new cusQues({
        options: String(new Date()),
        person: String(`${req.params.smth}`)
    })
    newQues.save()
    res.send('Did it work owo')
})

class Room{
    constructor(users, roomName){
        this.running = false
        this.gameQuestions = []
        this.amountOfQuestions = 0
        this.finalResults = []
        this.currentQuestion = []
        this.publishedResults = false
        this.currentResponses = [[], []]
        this.currentResSocId = [[], []]
        this.users = users
        this.roomName = roomName
    }

    newGame(socket, customWords){
        if(!this.running){ 
            let questions = [["roti", "baguette"], ["Gandhi", "Hitler"], ['Pcm', "Commerce"], ['North korea', 'South korea'], ["Messi", "Ronaldo"], ["Anime", "IRL"], ["Einstein", "Siddhant"], ["Putin", "Trump"], ["Football", "Soccer"], ["Football", "Cricket"], ["Kohli", "Dhoni"], ["Death", "Taxes"], ["Mandella", "Sarri"], ["Pewds", "Mrbeast"], ["Dream", "Techno"]]
            this.gameQuestions = [...customWords]
            let len = this.gameQuestions.length
            for(let i=0; i<(10-len); i++){
                let randQues = questions[Math.floor(Math.random()*questions.length)]
                if (this.gameQuestions.includes(randQues)){
                    i--
                } else {
                    this.gameQuestions.push(randQues)
                }
            }
            this.amountOfQuestions = 0
            io.to(this.roomName).emit('NewGameServer')
            socket.broadcast.to(this.roomName).emit('remHost')

            this.ReqNewQues(socket)
            this.finalResults = []
            
            cusQues.find()
                .then((results) => {
                    let responses = []
                    results.forEach(result => {
                        responses.push(String(result.options))
                    })
                    this.gameQuestions.forEach(ques => {
                        if (!responses.includes(String(ques)) && !questions.includes(ques)){
                            const newQues = new cusQues({
                                options: String(ques),
                                person: String(JSON.stringify(this.users))
                            })
                            newQues.save()
                        }
                    })
                })
        }
    }

    updateUserName(socket, username, room){
        socket.join(this.roomName)
        if(Object.keys(this.users).includes(socket.id)){
            this.users[socket.id] = [username, this.users[socket.id][1]]
        } else {
            this.users[socket.id] = [username, 0]
        }
        if (this.running){
            socket.emit('newQuestion', this.currentQuestion, this.amountOfQuestions)
            if (this.publishedResults){
                socket.emit('results', this.currentResponses, this.amountOfQuestions)
            }
        }
        let players = []
        Object.keys(this.users).forEach(user => {
            players.push(this.users[user][0])
        })
        io.to(this.roomName).emit('setPlayerNames', players)
        if(Object.keys(this.users).length == 1){
            socket.emit('setHost')
        }
    }

    answer(socket, answer){
        if (answer == this.currentQuestion[0]){
            this.currentResponses[0].push(this.users[socket.id][0])
            this.currentResSocId[0].push(socket.id)
        } else {
            this.currentResponses[1].push(this.users[socket.id][0])
            this.currentResSocId[1].push(socket.id)
        }
        if (Object.keys(this.users).length == (this.currentResponses[0].length + this.currentResponses[1].length)){
            this.ReqResults()
        }
    }

    ReqNewQues(socket){
        let randQuestion = this.gameQuestions[Math.floor(Math.random()*this.gameQuestions.length)]
        this.amountOfQuestions++
        io.to(this.roomName).emit('newQuestion', randQuestion, this.amountOfQuestions)
        this.gameQuestions.splice(this.gameQuestions.indexOf(randQuestion), 1, )
        this.running = true
        this.currentResponses = [[], []]
        this.currentResSocId = [[], []]
        this.publishedResults = false
        this.currentQuestion = randQuestion
    }

    ReqResults(){
        io.to(this.roomName).emit('results', this.currentResponses, this.amountOfQuestions)
        if(this.currentResponses[0].length > this.currentResponses[1].length){
            this.currentResSocId[1].forEach(user => { this.users[user][1]++ })
        } else if(this.currentResponses[1].length > this.currentResponses[0].length){
            this.currentResSocId[0].forEach(user => { this.users[user][1]++ })
        }
        Object.keys(this.users).forEach(user => {
            io.to(user).emit('setScore', this.users[user][1], this.amountOfQuestions)
        })        
        this.publishedResults = true
    }

    endGame(socket){
        this.running = false
        Object.keys(this.users).forEach(user => {
            this.finalResults.push([this.users[user][0], this.users[user][1]])
        })
        this.finalResults.sort(sortFunction).reverse()
        function sortFunction(a, b) {
            if (a[1] === b[1]) {
                return 0;
            }
            else {
                return (a[1] < b[1]) ? -1 : 1;
            }
        }
        io.to(this.roomName).emit('finalResult', this.finalResults)
        Object.keys(this.users).forEach(user => {
            this.users[user][1] = 0
        })
    }

    disconnect(socket){
        delete this.users[socket.id]
        if (Object.keys(this.users).length <= 0){
            rooms.splice(rooms.indexOf(this), 1, )
        }
        let players = []
        Object.keys(this.users).forEach(user => {
            players.push(this.users[user][0])
        })
        io.to(this.roomName).emit('setPlayerNames', players)
    }
}

let rooms = []

io.on("connection", (socket)=>{
    socket.on('newGame', (customWords, roomName) => {
        rooms.forEach(room => {
            if (room.roomName == roomName){
                room.newGame(socket, customWords)
            }
        })
    })

    socket.on('updateUserName', (username, room) => {
        let exists = false
        rooms.forEach(roome => {
            if (roome.roomName == room){
                roome.updateUserName(socket, username, room)
                exists = true
            }
        })
        if(!exists){
            let user = {}
            user[socket.id] = [username, 0]
            let newRoom = new Room(user, room)
            rooms.push(newRoom)
            newRoom.updateUserName(socket, username, room)
        }
    })

    socket.on('answer', (answer, roomName) => {
        rooms.forEach(room => {
            if (room.roomName == roomName) room.answer(socket, answer)
        })
    })

    socket.on('ReqNewQues', roomName => {
        rooms.forEach(room => {
            if (room.roomName == roomName) room.ReqNewQues(socket)
        })
    })

    socket.on('ReqResults', roomName => {
        rooms.forEach(room => {
            if(room.roomName == roomName) room.ReqResults()
        })
    })

    socket.on('endGame', (roomName) => {
        rooms.forEach(room => {
            if (room.roomName == roomName) room.endGame(socket)
        })
    })

    socket.on('disconnect', () => {
        rooms.forEach(room => {
            if (Object.keys(room.users).includes(socket.id)) room.disconnect(socket)
        })
    })
})