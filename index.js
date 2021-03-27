const { query } = require('express')
const jwt = require('jsonwebtoken')
require('dotenv').config()

//for bcrypt
const bcrypt = require('bcrypt')
const saltRounds = 10

const express = require('express')
const app = express()
const port = 3000

const { Client } = require('pg')

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'test',
    password: 'mynameisroh',
    port: 5432
})

app.use(express.json())

function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization']
    console.log("authHeader", authHeader)
    const token = authHeader && authHeader.split(" ")[1]
    console.log("token", token)

    if (token == null) return res.sendStatus(401)
        //401 status code means authentication is not present in the header of the request
    else {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userObject) => {
            if (err) return res.sendStatus(403)
                //403 means authentication was present in header but it was wrong
            else {
                req.userObject = userObject
                next()
            }
        })
    }

}

client
    .connect()
    .then((res) => {
        console.log("Connected successfully")
    })
    .catch(err => {
        console.log(err)
    })

app.get('/admin/all/customers', authenticateJWT, (req, res) => {
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



app.post('/customer/new', async(req, res) => {
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

app.post('/customer/verify', async(req, res) => {
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

app.listen(port, () => {
    console.log("Server running on port", port)
})