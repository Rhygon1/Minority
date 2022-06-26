const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.render('home')
})

router.get('/css/home.css', (req, res) => {
    res.sendFile(__dirname + '/public/css/home.css')
})

router.get('/js/home.js', (req, res) => {
    res.sendFile(__dirname + '/public/js/home.js')
})

module.exports = router