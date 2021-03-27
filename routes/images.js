const express = require('express')
const router = express.Router()

router.get('/:img', (req, res) => {
    res.sendFile(req.params.img, { root: 'images/' })
})

module.exports = router