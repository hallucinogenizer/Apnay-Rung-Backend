var express = require('express')
var router = express.Router()
const client = require('../utilities/clientConnect')
const authenticateJWT = require("../utilities/authenticateJWT")
const jwt = require('jsonwebtoken')

router.post('/new', authenticateJWT, (req, res) => {
    /* 
    {
        items:{[item_id,quantity,price],[1,2,500],[]},
        totalamount:0,
        delivery_status:'processing',
        name:'Rohan',
        email:'rohan@yahoo.com',
        phone:'=+923025474222',
        billing_address:'Street House Area City Province',
        shipping_address:'Street House Area City Province'
    }
    */
    if (req.userObject.typeOfUser == "seller") {
        const query = "INSERT INTO orders (timestamp,customer_id,delivery_status,review,totalamount,cancelled,items,name,email,phone,b_address,s_address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)"
        const values = ['NOW()', req.userObject.id, req.body.delivery_status, "", req.body.totalamount, false, req.body.items, req.body.name, req.body.email, req.body.phone, req.body.b_address, req.body.s_address]

        client.query(query, values)
            .then(response => {
                res.sendStatus(201)
            }).catch(err => {
                res.sendStatus(500)
            })
    } else {
        console.log(req.userObject.typeOfUser)
        res.sendStatus(401)
    }
})

module.exports = router