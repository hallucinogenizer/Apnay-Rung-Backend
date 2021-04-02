const express = require('express')
const router = express.Router()

const authenticateJWT = require("../utilities/authenticateJWT")
const client = require('../utilities/clientConnect')

router.get('/all', authenticateJWT, async(req, res) => {
    let query
    let values
    if (req.userObject.typeOfUser == 'seller') {
        query = "SELECT * FROM inventory WHERE seller_id = $1"
        values = [req.userObject.id]
    } else if (req.userObject.typeOfUser == 'admin') {
        query = "SELECT * FROM inventory"
        values = []
    }
    try {
        const result = await client.query(query, values)
        res.status(200).send(result.rows)
    } catch (err) {
        res.sendStatus(500)
        console.log(err)
    }
})

router.post('/new', authenticateJWT, async(req, res) => {
    /*
        {
            title:____,
            description:____,
            image:{______}, //array of URLs
            category:_______,
            price:__________
        }
    */
    if (req.userObject.typeOfUser == 'seller') {
        const query = "INSERT INTO inventory (title, description, image, category, price, seller_id) VALUES ($1, $2, $3, $4, $5, $6)"
        const values = [req.body.title, req.body.description, req.body.image, req.body.category, req.body.price, req.userObject.id]

        client.query(query, values)
            .then(response => {
                res.sendStatus(200)
            })
            .catch(err => {
                res.sendStatus(500)
                console.log(err)
            })
    }
})

module.exports = router