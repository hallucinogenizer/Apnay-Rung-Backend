const express = require('express')
const router = express.Router()

const authenticateJWT = require("../utilities/authenticateJWT")
const client = require('../utilities/clientConnect')

router.get('/all', authenticateJWT, async(req, res) => {
    let query
    let values
    let continueOrNot = false
    if (req.userObject.typeOfUser == 'seller') {
        query = "SELECT * FROM inventory WHERE seller_id = $1"
        values = [req.userObject.id]
        continueOrNot = true
    } else if (req.userObject.typeOfUser == 'admin') {
        query = "SELECT * FROM inventory"
        values = []
        continueOrNot = true
    } else if (req.userObject.typeOfUser == 'customer') {
        query = "SELECT * FROM inventory"
        values = []
        continueOrNot = true
    } else {
        res.sendStatus(401)
    }

    if (continueOrNot) {
        try {
            const result = await client.query(query, values)
            res.status(200).send(result.rows)
        } catch (err) {
            res.sendStatus(500)
            console.log(err)
        }
    }
})

router.post('/new', authenticateJWT, async(req, res) => {
    /*
        {
            title:____,
            description:____,
            image:{______}, //array of URLs
            category:_______,
            price:__________,
            stock:______
        }
    */
    if (req.userObject.typeOfUser == 'seller') {
        const query = "INSERT INTO inventory (title, description, image, category, price, stock, seller_id) VALUES ($1, $2, $3, $4, $5, $6, $7)"
        const values = [req.body.title, req.body.description, req.body.image, req.body.category, req.body.price, req.body.stock, req.userObject.id]

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


//check user type in this:
router.delete('/id/:item_id', authenticateJWT, async(req, res) => {
    if (req.userObject.typeOfUser == 'seller') {
        const query = "DELETE FROM inventory WHERE item_id=$1 AND seller_id=$2"
        const values = [req.params.item_id, req.userObject.id]
        client.query(query, values)
            .then(response => {
                if (response.rowCount == 0) {
                    res.sendStatus(204)
                } else if (response.rowCount == 1) {
                    res.sendStatus(200)
                }
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