const express = require('express')
const router = express.Router()
const path = require('path')

router.get('/:roomName', (req, res) => {
    res.render('room')
})

router.get('/css/room.css', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../public/css/room.css'))
})

router.get('/js/room.js', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../public/js/room.js'))
})

router.get('/js/option.js', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../public/js/option.js'))
})

module.exports = router