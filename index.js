const { query } = require('express')

require('dotenv').config()



//routes
const customer = require('./routes/customer')
const admin = require('./routes/admin')
const seller = require('./routes/seller')
const images = require('./routes/images')
const order = require('./routes/order')
const message = require('./routes/message')

//utilities
const authenticateJWT = require('./utilities/authenticateJWT')

//expressJS
const express = require('express')
const app = express()
const port = 3000



//middleware
app.use(express.json())
app.use('/customer', customer)
app.use('/admin', admin)
app.use('/seller', seller)
app.use('/message', message)
app.use('/order', order)
app.use('/image', images)

app.listen(port, () => {
    console.log("Server running on port", port)
})