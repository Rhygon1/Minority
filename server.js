const express = require("express");
const app = express()
const http = require('http');
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)
const port = process.env.PORT || 3000
const mongoose = require('mongoose')

const schema = mongoose.Schema;
const questionSchema = new schema({
    options: String
})
const cusQues = mongoose.model('possibleQuestions', questionSchema)

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/home.html')
})

app.get('/:roomName', (req, res) => {
    res.sendFile(__dirname + '/public/room.html')
})

mongoose.connect('mongodb+srv://Dhruv:gilbert130@cluster0.rcpc7.mongodb.net/Minority?retryWrites=true&w=majority')
    .then((result) => server.listen(port))

let questions = [["roti", "baguette"], ["Gandhi", "Hitler"], ['Pcm', "Commerce"], ['North korea', 'South korea'], ["Messi", "Ronaldo"], ["Anime", "IRL"], ["Einstein", "Siddhant"], ["Putin", "Trump"], ["Football", "Soccer"], ["Football", "Cricket"], ["Kohli", "Dhoni"], ["Death", "Taxes"], ["Mandella", "Sarri"], ["Pewds", "Mrbeast"], ["Dream", "Techno"]]

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

            let randQuestion = this.gameQuestions[Math.floor(Math.random()*this.gameQuestions.length)]
            this.amountOfQuestions++
            io.to(this.roomName).emit('newQuestion', randQuestion)
            this.gameQuestions.splice(this.gameQuestions.indexOf(randQuestion), 1, )
            this.running = true
            this.currentResponses = [[], []]
            this.currentResSocId = [[], []]
            this.publishedResults = false
            this.currentQuestion = randQuestion
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
                                options: String(ques)
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
            socket.emit('newQuestion', this.currentQuestion)
            if (this.publishedResults){
                socket.emit('results', this.currentResponses)
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
            io.to(this.roomName).emit('results', this.currentResponses, this.amountOfQuestions)
            if(this.currentResponses[0].length > this.currentResponses[1].length){
                this.currentResSocId[1].forEach(user => { io.to(user).emit('incScore'); this.users[user][1]++ })
            } else if(this.currentResponses[1].length > this.currentResponses[0].length){
                this.currentResSocId[0].forEach(user => { io.to(user).emit('incScore'); this.users[user][1]++ })
            }
            this.publishedResults = true
        }
    }

    ReqNewQues(socket){
        let randQuestion = this.gameQuestions[Math.floor(Math.random()*this.gameQuestions.length)]
        this.amountOfQuestions++
        io.to(this.roomName).emit('newQuestion', randQuestion)
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
            this.currentResSocId[1].forEach(user => { io.to(user).emit('incScore'); this.users[user][1]++ })
        } else if(this.currentResponses[1].length > this.currentResponses[0].length){
            this.currentResSocId[0].forEach(user => { io.to(user).emit('incScore'); this.users[user][1]++ })
        }
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