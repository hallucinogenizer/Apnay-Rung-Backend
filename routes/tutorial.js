var express = require('express')
var router = express.Router()
const client = require('../utilities/clientConnect')
const authenticateJWT = require("../utilities/authenticateJWT")
const jwt = require('jsonwebtoken')

router.post('/new', authenticateJWT, (req, res) => {
    /*{
        title:'___',
        content:'____'
    }*/
    if (req.userObject.typeOfUser == "admin") {
        if (req.body.hasOwnProperty('title') || req.body.hasOwnProperty('content')) {
            const query = "INSERT INTO tutorials (title,content) VALUES ($1,$2)"
            const values = [req.body.title, req.body.content]
            client.query(query, values)
                .then(result => {
                    res.sendStatus(201)
                })
                .catch(err => {
                    res.sendStatus(500)
                    console.log(err)
                })
        } else {
            res.sendStatus(400)
        }
    } else {
        res.sendStatus(401)
    }
})

router.get('/all', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == "admin" || req.userObject.typeOfUser == "seller") {
        const query = "SELECT * FROM tutorials WHERE true"
        client.query(query)
            .then(result => {
                res.status(200).json(result.rows)
            })
            .catch(err => {
                res.sendStatus(500)
                console.log(err)
            })
    } else {
        res.sendStatus(401)
    }
})

module.exports = router