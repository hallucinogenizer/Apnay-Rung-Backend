const { Client } = require('pg')


const client = new Client({
    user: 'unlhlizkgygdgn',
    host: 'ec2-54-235-108-217.compute-1.amazonaws.com',
    database: 'd47b4r79iv2qgm',
    password: '8e3851f849805eceb68ad6f3b06c2ee1178e17cb8f4346c0b92afc215ae0c3e0',
    port: 5432
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