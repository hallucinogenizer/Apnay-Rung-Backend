const { query } = require('express')
const jwt = require('jsonwebtoken')

require('dotenv').config()

//for bcrypt
const bcrypt = require('bcrypt')
const saltRounds = 10

//routes
const customer = require('./routes/customer')


//utilities
const authenticateJWT = require('./utilities/authenticateJWT')

//expressJS
const express = require('express')
const app = express()
const port = 3000

//postgres
const { Client } = require('pg')

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'test',
    password: 'mynameisroh',
    port: 5432
})

//middleware
app.use(express.json())

client
    .connect()
    .then((res) => {
        console.log("Connected successfully")
    })
    .catch(err => {
        console.log(err)
    })


app.listen(port, () => {
    console.log("Server running on port", port)
})