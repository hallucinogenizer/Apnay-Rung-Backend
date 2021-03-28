var express = require('express')
var router = express.Router()
const { Client } = require('pg')
const authenticateJWT = require("../utilities/authenticateJWT")
const jwt = require('jsonwebtoken')
    //for bcrypt
const bcrypt = require('bcrypt')
const saltRounds = 10

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

router.post('/new', async(req, res) => {
    console.log(req.body)

    //generating hashed password
    try {
        let hashed_pwd = await bcrypt.hash(req.body.password, saltRounds)

        const query = `INSERT INTO customers (name,email,password,address) VALUES ('${req.body.name}', '${req.body.email}', '${hashed_pwd}', '${req.body.address}')`

        client.query(query)
            .then(resolve => {
                console.log("Insertion Successful")
                res.status(201).end()
            })
            .catch(err => {
                console.log(err)
            })
    } catch (err) {
        console.log(err)
    }
})

router.get('/verify', async(req, res) => {
    const query = `SELECT customer_id,name,password FROM customers WHERE email='${req.body.email}';`
    try {
        const result = await client.query(query)
        let userObject = {
            id: -1,
            name: '',
            typeOfUser: 'customer'
        }
        let promises = []
        for (let row of result.rows) {
            promises.push(bcrypt.compare(req.body.password, row.password))
            userObject.id = row.customer_id
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