const express = require('express')
const router = express.Router()
const path = require('path')

router.get('/:roomName', (req, res) => {
    res.render('room')
})

module.exports = router