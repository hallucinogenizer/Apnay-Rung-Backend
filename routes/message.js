var express = require('express')
var router = express.Router()
const client = require('../utilities/clientConnect')
const authenticateJWT = require("../utilities/authenticateJWT")


router.get('/all', authenticateJWT, async(req, res) => {
    if (req.userObject.typeOfUser == "admin") {
        try {
            const result = await client.query("SELECT * FROM messages")
            res.status(200).json(result.rows)
        } catch (err) {
            res.sendStatus(500)
            console.log(err)
        }
    } else {
        res.sendStatus(401)
            //401 is unauthorized
    }
})

router.post('/new', authenticateJWT, (req, res) => {
    /* {
        subject:'',
        'content':''
    } */

    if (req.userObject.typeOfUser == "customer") {
        if (req.body.hasOwnProperty('subject') && req.body.hasOwnProperty('content')) {
            const query = `INSERT INTO messages (subject,content,customer_id,timestamp) VALUES ($1,$2,$3,NOW())`
            const values = [`'${req.body.subject}'`, `'${req.body.content}'`, req.userObject.id]
            client.query(query, values).then(response => {
                res.sendStatus(201)
            }).catch(err => {
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

router.delete('/:message_id', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == 'admin') {
        const query = "DELETE FROM messages WHERE message_id=$1"
        const values = [req.params.message_id]
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

module.exports = router
    //new message create

//ctrl + shift + c for status codes list in vs code via Status() plugin