require('dotenv').config()
const { Client } = require('pg')

const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:mynameisroh@localhost:5432/test",
    ssl: process.env.DATABASE_URL ? true : false
})

// const client = new Client({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'test',
//     password: 'mynameisroh',
//     port: 5432
// })

client.connect()
    .then((res) => {
        console.log("Connected successfully")
    })
    .catch(err => {
        console.log(err)
    })

module.exports = client