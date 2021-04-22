var express = require('express')
var router = express.Router()
const client = require('../utilities/clientConnect')
const authenticateJWT = require("../utilities/authenticateJWT")
const isBlocked = require('../utilities/isBlocked')

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

router.get('/all', authenticateJWT, isBlocked, async(req, res) => {
    let query = `SELECT * FROM notifications WHERE ${req.userObject.typeOfUser+'_id'}=${req.userObject.id}`
    try {
        const result = await client.query(query)
        res.status(200).json(result.rows)
    } catch (err) {
        res.sendStatus(500)
        console.log(err)
    }
})

router.delete('/id/:id', authenticateJWT, isBlocked, (req, res) => {
    const query = `DELETE FROM notifications WHERE notification_id=$1 AND ${req.userObject.typeOfUser+'_id'}=${req.userObject.id}`
    const values = [req.params.id]

    client.query(query, values)
        .then(response => {
            if (response.rowCount > 0)
                res.sendStatus(200)
            else
                res.status(204).send("Either you are trying to delete a notification that belongs to a different user, or you gave an invalid notification_id, or the notification does not exist.")
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

router.delete('/all', authenticateJWT, isBlocked, (req, res) => {
    const query = `DELETE FROM notifications WHERE ${req.userObject.typeOfUser+'_id'}=${req.userObject.id}`

    client.query(query)
        .then(response => {
            if (response.rowCount > 0)
                res.sendStatus(200)
            else
                res.status(204).send("No notifications available to delete")
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

module.exports = router