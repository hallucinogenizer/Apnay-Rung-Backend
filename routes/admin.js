const express = require('express')
const router = express.Router()
const authenticateJWT = require("../utilities/authenticateJWT")

router.get('/admin/all/customers', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == "admin") {
        const query = `SELECT * FROM public.customers`

        client
            .query(query)
            .then(result => {
                res.status(200).json(result.rows)
            })
            .catch(err => {
                console.log(err)
            })
    } else {
        res.sendStatus(403)
    }
})