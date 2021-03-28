var express = require('express')
var router = express.Router()
const client = require('../utilities/clientConnect')
const authenticateJWT = require("../utilities/authenticateJWT")

router.post('/new', (req, res) => {
    /*
    {
        title:___,
        type:____,
        details:___,

        (only and exactly one of IDs the below)
        customer_id:____,
        seller_id:____,
        admin_id:____,
    }
    */
    let query = "INSERT INTO notifications (title,type,details,"
    let filler;
    let values = [req.body.title, req.body.type, req.body.details]
    if (req.body.hasOwnProperty('customer_id') && !req.body.hasOwnProperty('seller_id') && !req.body.hasOwnProperty('admin_id')) {
        filler = "customer_id)"
        values.push(req.body.customer_id)
    } else if (req.body.hasOwnProperty('seller_id') && !req.body.hasOwnProperty('customer_id') && !req.body.hasOwnProperty('admin_id')) {
        filler = "seller_id)"
        values.push(req.body.seller_id)
    } else if (req.body.hasOwnProperty('admin_id') && !req.body.hasOwnProperty('seller_id') && !req.body.hasOwnProperty('customer_id')) {
        filler = "admin_id)"
        values.push(req.body.seller_id)
    }

    query += filler += " VALUES ($1,$2,$3,$4)"

    client.query(query, values)
        .then(response => {
            res.sendStatus(201)
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

router.get('/all', authenticateJWT, async(req, res) => {
    let query = `SELECT * FROM notifications WHERE ${req.userObject.typeOfUser+'_id'}=${req.userObject.id}`
    try {
        const result = await client.query(query)
        res.status(200).json(result.rows)
    } catch (err) {
        res.sendStatus(500)
        console.log(err)
    }
})

module.exports = router