const express = require('express')
const router = express.Router()
const authenticateJWT = require("../utilities/authenticateJWT")
const jwt = require('jsonwebtoken')
const { Client } = require('pg')
    //for bcrypt
const bcrypt = require('bcrypt')
const saltRounds = 10

//postgres

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'test',
    password: 'mynameisroh',
    port: 5432
})

client
    .connect()
    .then((res) => {
        console.log("Connected successfully")
    })
    .catch(err => {
        console.log(err)
    })

router.get('/all/customers', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == "admin") {
        const query = `SELECT customer_id,name,email,address,phone,blocked,profile_picture FROM public.customers`

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

router.get('/all/sellers', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == "admin") {
        const query = `SELECT seller_id,name,email,cnic,location,bio,weeklyartisan,blocked,profile_picture FROM public.sellers`

        client
            .query(query)
            .then(result => {
                res.status(200).json(result.rows)
            })
            .catch(err => {
                console.log(err)
                res.sendStatus()
            })
    } else {
        res.sendStatus(403)
    }
})

router.patch('/all/customers/block', authenticateJWT, (req, res) => {
    /*JSON {
        'id':0
    }*/
    // this code toggles the blocked status. Sets it to blocked if unblocked, and unblocked if blocked
    if (req.userObject.typeOfUser == "admin") {
        const query = "UPDATE public.customers SET blocked = NOT blocked WHERE customer_id=" + req.body.id
        client.query(query).then(result => {
            res.sendStatus(200)
        }).catch(err => {
            console.log(err)
            res.sendStatus(500)
        })
    }
})

router.patch('/all/sellers/block', authenticateJWT, (req, res) => {
    /*JSON {
        'id':0
    }*/
    // this code toggles the blocked status. Sets it to blocked if unblocked, and unblocked if blocked
    if (req.userObject.typeOfUser == "admin") {
        const query = "UPDATE public.sellers SET blocked = NOT blocked WHERE seller_id=" + req.body.id
        client.query(query).then(result => {
            res.sendStatus(200)
        }).catch(err => {
            console.log(err)
            res.sendStatus(500)
        })
    }
})

router.post('/new', async(req, res) => {
    console.log(req.body)

    //generating hashed password
    try {
        let hashed_pwd = await bcrypt.hash(req.body.password, saltRounds)

        const query = `INSERT INTO admins (name,email,password) VALUES ('${req.body.name}', '${req.body.email}', '${hashed_pwd}')`

        client.query(query)
            .then(resolve => {
                console.log("Insertion Successful")
                res.status(201).end()
            })
            .catch(err => {
                console.log(err)
                res.sendStatus(500)
            })
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/verify', async(req, res) => {
    const query = `SELECT admin_id,name,password FROM admins WHERE email='${req.body.email}';`
    try {
        const result = await client.query(query)
        let userObject = {
            id: -1,
            name: '',
            typeOfUser: 'admin'
        }
        let promises = []
        for (let row of result.rows) {
            promises.push(bcrypt.compare(req.body.password, row.password))
            userObject.id = row.admin_id
            userObject.name = row.name
        }
        Promise.all(promises)
            .then(resolve => {
                if (resolve.includes(true)) {
                    const accessToken = jwt.sign(userObject, process.env.ACCESS_TOKEN_SECRET)
                    res.status(200).json({ verified: true, accessToken: accessToken }).end()
                } else {
                    res.status(200).json({ verified: false }).end()
                }
            })
            .catch(err => {
                console.log(err)
            })

    } catch (err) {
        console.log(err)
    }
})

module.exports = router