const express = require('express')
const router = express.Router()

router.get('/:roomName', (req, res) => {
    res.render('room')
})

router.get('/css/room.css', (req, res) => {
    res.sendFile(__dirname + '/public/css/room.css')
})

router.get('/js/room.js', (req, res) => {
    res.sendFile(__dirname + '/public/js/room.js')
})

module.exports = router