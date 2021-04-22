const { query } = require('express')
const path = require('path');
require('dotenv').config()
const cors = require('cors')
const bcrypt = require('bcrypt')
const saltRounds = 10
const jwt = require('jsonwebtoken')

//routes
const customer = require('./routes/customer')
const admin = require('./routes/admin')
const seller = require('./routes/seller')
const images = require('./routes/images')
const order = require('./routes/order')
const inventory = require('./routes/inventory')
const message = require('./routes/message')
const tutorial = require('./routes/tutorial')
const test = require('./routes/test')
const notification = require('./routes/notification')
const ejs = require('ejs')
    //utilities
const authenticateJWT = require('./utilities/authenticateJWT')
const { hasAllFields, constraints } = require('./utilities/hasAllFields')

//expressJS
const express = require('express');
const client = require('./utilities/clientConnect');
const e = require('express');
const app = express()
const port = 3000



//middleware
app.use(express.json())
app.use(express.static(path.join(__dirname, 'views')));
app.engine('html', require('ejs').renderFile);
app.use(cors({ origin: true, credentials: true }));
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
app.use('/test', test)

app.get('/', (req, res) => {
    res.render(path.join(__dirname + '/views/index.html'))
})

app.get('/fileupload', (req, res) => {
    res.render(path.join(__dirname + '/views/fileupload.html'))
})

app.post('/verify', async(req, res) => {
    const valid_input = hasAllFields({
        "email": constraints.email,
        "password": constraints.password
    }, req.body)
    if (valid_input !== true) {
        res.status(400).send(valid_input)
    } else {
        let query = `SELECT customer_id,name,password FROM customers WHERE email=$1`
        let values = [req.body.email]
        try {
            let result = await client.query(query, values)
            let userObject = {
                id: -1,
                name: '',
                typeOfUser: 'customer'
            }

            if (result.rowCount > 0) {
                let promises = []

                promises.push(new Promise((resolve, reject) => {
                    for (let row of result.rows) {
                        resolve(bcrypt.compare(req.body.password, row.password))
                        userObject.id = row.customer_id
                        userObject.name = row.name
                    }
                }))
                Promise.all(promises)
                    .then(async(resolve) => {
                        if (resolve.includes(true)) {
                            const accessToken = jwt.sign(userObject, process.env.ACCESS_TOKEN_SECRET)
                            res.status(200).json({ verified: true, typeOfUser: 'customer', accessToken: accessToken }).end()
                        } else {
                            console.log(4)
                            res.status(200).json({ verified: false }).end()
                        }
                    })
                    .catch(err => {
                        res.sendStatus(500)
                        console.log(err)
                    })
            } else {
                query = "SELECT seller_id, name, password FROM sellers WHERE email=$1 AND blocked=false AND approved=true"
                values = [req.body.email]
                result = await client.query(query, values)
                if (result.rowCount == 0) {

                    query = "SELECT admin_id, name, password FROM admins WHERE email=$1"
                    values = [req.body.email]
                    result = await client.query(query, values)
                    if (result.rowCount == 0) {
                        console.log(1)
                        res.status(200).json({ verified: false }).end()
                    } else if (result.rowCount == 1) {
                        userObject = {
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
                        Promise.all(promises).then(resolve => {
                            if (resolve.includes(true)) {
                                const accessToken = jwt.sign(userObject, process.env.ACCESS_TOKEN_SECRET)
                                res.status(200).json({ verified: true, typeOfUser: 'admin', accessToken: accessToken }).end()
                            } else {
                                console.log(2)
                                res.status(200).json({ verified: false }).end()
                            }
                        })
                    }

                } else if (result.rowCount == 1) {
                    userObject = {
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
                    Promise.all(promises).then(resolve => {
                        if (resolve.includes(true)) {
                            const accessToken = jwt.sign(userObject, process.env.ACCESS_TOKEN_SECRET)
                            res.status(200).json({ verified: true, typeOfUser: 'seller', accessToken: accessToken }).end()
                        } else {
                            console.log(3)
                            res.status(200).json({ verified: false }).end()
                        }
                    })
                }

            }

        } catch (err) {
            console.log(err)
        }
    }
})

app.post('/securityquestions/verify', async(req, res) => {
    //{email: _____, question_no:___, answer:"useranswer"}

    let query = "SELECT sec_questions FROM customers WHERE email=$1"
    let values = [req.body.email]

    let result = await client.query(query, values)
    if (result.rowCount == 0) {
        query = "SELECT sec_questions FROM sellers WHERE email=$1"
        result = await client.query(query, values)
    }
    const sec_questions = result.rows[0].sec_questions
    let i = 1;
    for (q in sec_questions) {
        if (i == req.body.question_no) {
            if (sec_questions[q] == req.body.answer) {
                res.status(200).json({ verified: true })
            } else {
                res.status(200).json({ verified: false })
            }
            break
        } else {
            i++
        }
    }
})

app.post('/securityquestions', async(req, res) => {
    //{email: _____}

    let query = "SELECT sec_questions FROM customers WHERE email=$1"
    let values = [req.body.email]

    let result = await client.query(query, values)
    if (result.rowCount == 0) {
        query = "SELECT sec_questions FROM sellers WHERE email=$1"
        result = await client.query(query, values)
    }
    const sec_questions = result.rows[0].sec_questions
    let questions = []
    for (q in sec_questions) {
        questions.push(q)
    }
    res.status(200).json(questions)
})

app.post('/resetpassword', async(req, res) => {
    let hashed_pwd = await bcrypt.hash(req.body.password, saltRounds)
    let query = "UPDATE customers SET password=$1 WHERE email=$2"
    let values = [hashed_pwd, req.body.email]

    client.query(query, values).then(response => {
        if (response.rowCount == 0) {
            query = "UPDATE sellers SET password=$1 WHERE email=$2"
            client.query(query, values).then(response => {
                if (response.rowCount == 0) {
                    res.sendStatus(204)
                } else {
                    res.sendStatus(202)
                }
            })
        } else {
            res.sendStatus(202)
        }
    })
})

app.listen(process.env.PORT || port, () => {
    console.log("Server running on port", process.env.PORT || port)
})