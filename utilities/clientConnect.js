const { Client } = require('pg')


const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'test',
    password: 'mynameisroh',
    port: 5432
})

client.connect()
    .then((res) => {
        console.log("Connected successfully")
    })
    .catch(err => {
        console.log(err)
    })

module.exports = client