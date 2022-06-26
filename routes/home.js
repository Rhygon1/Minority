const express = require('express')
const router = express.Router()
const path = require('path')

router.get('/', (req, res) => {
    res.render('home')
})

router.get('/css/home.css', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../public/css/home.css'))
})

router.get('/js/home.js', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../public/js/home.js'))
})

module.exports = router