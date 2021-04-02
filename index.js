const { query } = require('express')
const path = require('path');
require('dotenv').config()
const cors = require('cors')


//routes
const customer = require('./routes/customer')
const admin = require('./routes/admin')
const seller = require('./routes/seller')
const images = require('./routes/images')
const order = require('./routes/order')
const inventory = require('./routes/inventory')
const message = require('./routes/message')
const tutorial = require('./routes/tutorial')
const notification = require('./routes/notification')

//utilities
const authenticateJWT = require('./utilities/authenticateJWT')

//expressJS
const express = require('express')
const app = express()
const port = 3000



//middleware
app.use(express.json())
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'https://codesandbox.io');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
// app.use(cors({ origin: 'https://codesandbox.io', credentials: true }));
app.use('/customer', customer)
app.use('/admin', admin)
app.use('/seller', seller)
app.use('/message', message)
app.use('/order', order)
app.use('/tutorial', tutorial)
app.use('/inventory', inventory)
app.use('/notification', notification)
app.use('/image', images)

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/index.html'))
})

app.listen(process.env.PORT || port, () => {
    console.log("Server running on port", process.env.PORT || port)
})