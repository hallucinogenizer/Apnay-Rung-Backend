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

router.put('/new', async(req, res) => {
    //generating hashed password
    try {
        let hashed_pwd = await bcrypt.hash(req.body.password, saltRounds)

        const query = `INSERT INTO sellers (name,email,password,location,cnic,cnic_image,sec_questions) VALUES ('${req.body.name}', '${req.body.email}', '${hashed_pwd}','${req.body.location}' ,'${req.body.cnic}', '${req.body.cnic_image}', '${JSON.stringify(req.body.sec_questions)}')`
        console.log(query)
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

router.post('/verify', async(req, res) => {
    const query = `SELECT seller_id,name,password FROM sellers WHERE email='${req.body.email}';`
    try {
        const result = await client.query(query)
        let userObject = {
            id: -1,
            name: '',
            typeOfUser: 'seller'
        }
        let promises = []
        for (let row of result.rows) {
            promises.push(bcrypt.compare(req.body.password, row.password))
            userObject.id = row.seller_id
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