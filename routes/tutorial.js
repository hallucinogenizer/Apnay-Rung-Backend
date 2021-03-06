var express = require('express')
var router = express.Router()
const client = require('../utilities/clientConnect')
const authenticateJWT = require("../utilities/authenticateJWT")
const isBlocked = require('../utilities/isBlocked')
const { hasAllFields, constraints } = require('../utilities/hasAllFields')
router.post('/new', authenticateJWT, (req, res) => {
    /*{
        title:'___',
        content:'____'
    }*/
    if (req.userObject.typeOfUser == "admin") {
        if (req.body.hasOwnProperty('title') || req.body.hasOwnProperty('content')) {
            const query = "INSERT INTO tutorials (title,content,description) VALUES ($1,$2,$3)"
            const values = [req.body.title, req.body.content, req.body.description]
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

router.get('/all', authenticateJWT, isBlocked, (req, res) => {
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

router.get('/id/:id', authenticateJWT, isBlocked, (req, res) => {
    if (req.userObject.typeOfUser == "admin" || req.userObject.typeOfUser == "seller") {
        const query = "SELECT * FROM tutorials WHERE tutorial_id=$1"
        const values = [req.params.id]
        client.query(query, values)
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

router.delete('/id/:id', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == 'admin') {
        const query = "DELETE FROM tutorials WHERE tutorial_id=$1"
        const values = [req.params.id]
        client.query(query, values)
            .then(response => {
                if (response.rowCount > 0) {
                    res.sendStatus(200)
                } else {
                    res.sendStatus(204)
                }
            })
            .catch(err => {
                res.sendStatus(500)
                console.log(err)
            })
    } else {
        res.sendStatus(403)
    }
})

router.patch('/id/:id', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == 'admin') {
        const valid_input = hasAllFields({
            "title": ["string", -1, "notempty"],
            "content": ["string", -1, "notempty"],
            "description": ["string", 200, ""]
        }, req.body)
        if (valid_input !== true) {
            res.status(400).send(valid_input)
        } else {
            const query = "UPDATE tutorials SET title=$1, content=$2, description=$3 WHERE tutorial_id=$4"
            const values = [req.body.title, req.body.content, req.body.description, req.params.id]
            client.query(query, values)
                .then(response => {
                    if (response.rowCount > 0) {
                        res.sendStatus(200)
                    } else {
                        res.sendStatus(204)
                    }
                })
                .catch(err => {
                    res.sendStatus(500)
                    console.log(err)
                })
        }
    } else {
        res.sendStatus(403)
    }
})

module.exports = router