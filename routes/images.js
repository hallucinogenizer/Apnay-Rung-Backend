const express = require('express')
const router = express.Router()
const client = require('../utilities/clientConnect')

router.get('/item/:item_id', (req, res) => {
    const query = "SELECT image AS data FROM inventory WHERE item_id=$1"
    const values = [req.params.item_id]
    client.query(query, values)
        .then(result => {
            if (result.rowCount > 0) {
                res.contentType('jpeg')
                res.status(200)
                res.end(result.rows[0].data)
            } else {
                res.sendStatus(204)
            }
        })
        .catch(err => {
            console.log(err)
            res.sendStatus(500)
        })
})

router.get('/seller/:seller_id', (req, res) => {
    const query = "SELECT profile_picture AS data FROM sellers WHERE seller_id=$1"
    const values = [req.params.seller_id]
    client.query(query, values)
        .then(result => {
            if (result.rowCount > 0) {
                res.contentType('jpeg')
                res.status(200)
                res.end(result.rows[0].data)
            } else {
                res.sendStatus(204)
            }
        })
        .catch(err => {
            console.log(err)
            res.sendStatus(500)
        })
})

module.exports = router