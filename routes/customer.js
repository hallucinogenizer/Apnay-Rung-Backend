var express = require('express')
var router = express.Router()
const client = require('../utilities/clientConnect')
const authenticateJWT = require("../utilities/authenticateJWT")
const { hasAllFields, constraints } = require('../utilities/hasAllFields')
const isBlocked = require('../utilities/isBlocked')
const jwt = require('jsonwebtoken')
    //for bcrypt
const bcrypt = require('bcrypt')
const saltRounds = 10

router.post('/new', async(req, res) => {
    const valid_input = hasAllFields({
        "name": constraints.name,
        "email": constraints.email,
        "password": constraints.password,
        "address": ["string", 300, "notempty"],
        "phone": ["string", 18, ""]
    }, req.body)
    if (valid_input !== true) {
        res.status(400).send(valid_input)
    } else {
        //generating hashed password
        try {
            let hashed_pwd = await bcrypt.hash(req.body.password, saltRounds)

            const query = `INSERT INTO customers (name,email,password,address,phone, sec_questions) VALUES ($1, $2, $3, $4, $5, $6)`
            const values = [req.body.name, req.body.email, hashed_pwd, req.body.address, req.body.phone, JSON.stringify(req.body.sec_questions)]
            client.query(query, values)
                .then(resolve => {
                    console.log("Insertion Successful")
                    res.status(201).end()
                })
                .catch(err => {
                    res.sendStatus(500)
                    console.log(err)
                })
        } catch (err) {
            res.sendStatus(500)
            console.log(err)
        }
    }
})

router.patch('/update', authenticateJWT, isBlocked, (req, res) => {
    /*
    {
        name:'',
        email:'',
        password:'',
        passwordChanged:true,
        phone:'',
        address:''
    }
    */

    //add update user route in seller
    if (req.userObject.typeOfUser == "customer") {
        const valid_input = hasAllFields({
            "name": ["string", 100, "notempty"],
            "email": ["string", 100, "notempty"],
            "password": ["string", -1, "notempty"],
            "passwordChanged": ["boolean", -1, ""],
            "address": ["string", 300, "notempty"],
            "phone": ["string", 18, ""]
        }, req.body)
        if (valid_input !== true) {
            res.status(400).send(valid_input)
        } else {
            try {
                let success = false
                const query = `UPDATE customers SET name = '${req.body.name}',email='${req.body.email}',phone = '${req.body.phone}',address='${req.body.address}' WHERE customer_id=${req.userObject.id}`

                client.query(query)
                    .then(resolve => {
                        success = true

                        if (req.body.passwordChanged == true) {
                            const pwd_promise = bcrypt.hash(req.body.password, saltRounds)
                            pwd_promise.then(hashed_pwd => {
                                const query = `UPDATE customers SET password='${hashed_pwd}' WHERE customer_id=${req.userObject.id}`
                                client.query(query)
                                    .then(resolve => {
                                        if (success == true) {
                                            res.sendStatus(202)
                                        } else {
                                            res.sendStatus(500)
                                        }
                                    }).catch(err => {
                                        res.sendStatus(500)
                                    })
                            }).catch(err => {
                                res.sendStatus(500)
                            })
                        } else {
                            if (success == true) {
                                res.sendStatus(202)
                            } else {
                                res.sendStatus(500)
                            }
                        }
                    })
                    .catch(err => {
                        console.log(err)
                        res.sendStatus(500)
                    })
            } catch (err) {
                console.log(err)
                res.sendStatus(500)
            }
        }
    } else {
        res.sendStatus(401)
    }
})


router.patch('/block/:id', authenticateJWT, (req, res) => {

    // this code toggles the blocked status. Sets it to blocked if unblocked, and unblocked if blocked
    if (req.userObject.typeOfUser == "admin") {
        const query = "UPDATE public.customers SET blocked = NOT blocked WHERE customer_id=" + req.params.id
        client.query(query).then(result => {
            res.sendStatus(200)
        }).catch(err => {
            console.log(err)
            res.sendStatus(500)
        })
    }
})

router.get('/id/:id', authenticateJWT, async(req, res) => {
    if (req.userObject.typeOfUser == "admin") {
        const query = "SELECT customer_id,name,email,address,phone,blocked FROM public.customers WHERE customer_id=$1"
        const values = [req.params.id]
        try {
            const result = await client.query(query, values)
            if (result.rowCount == 1) {
                res.status(200).json(result.rows[0])
            } else if (result.rowCount < 1) {
                res.sendStatus(404)
                    //404 = resource not found
            } else {
                res.sendStatus(500)
            }
        } catch (err) {
            res.sendStatus(500)
        }
    } else {
        res.sendStatus(401)
    }
})

router.get('/search', authenticateJWT, async(req, res) => {
    /*
    JSON {
        'query':'Taimoo'
    }
    */
    if (req.userObject.typeOfUser == "admin") {
        try {
            const result = await client.query(`SELECT customer_id,name,email,address,phone,blocked FROM public.customers WHERE name LIKE '%${req.body.query}%'`)
            if (result.rowCount < 1) {
                res.sendStatus(404)
            } else {
                res.status(200).json(result.rows)
            }

        } catch (err) {
            res.sendStatus(500)
        }
    } else {
        res.sendStatus(401)
    }
})

router.get('/all', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == "admin") {
        const query = `SELECT customer_id,name,email,address,phone,blocked FROM public.customers`

        client
            .query(query)
            .then(result => {
                res.status(200).json(result.rows)
            })
            .catch(err => {
                console.log(err)
            })
    } else {
        res.sendStatus(401)
    }
})

router.post('/verify', async(req, res) => {
    const query = `SELECT customer_id,name,password FROM customers WHERE email='${req.body.email}' AND blocked=false;`
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
            .then(async(resolve) => {
                if (resolve.includes(true)) {
                    const accessToken = jwt.sign(userObject, process.env.ACCESS_TOKEN_SECRET)
                    res.status(200).json({ verified: true, accessToken: accessToken }).end()
                } else {
                    res.status(200).json({ verified: false }).end()

                }
            })
            .catch(err => {
                res.sendStatus(500)
                console.log(err)
            })

    } catch (err) {
        console.log(err)
    }
})

router.get('/info', authenticateJWT, async(req, res) => {
    if (req.userObject.typeOfUser == 'customer') {
        const query = "SELECT * FROM customers WHERE customer_id=$1"
        const values = [req.userObject.id]

        client.query(query, values)
            .then(result => {
                if (result.rowCount > 0) {
                    res.status(200).json(result.rows[0])
                } else {
                    res.sendStatus(204)
                }
            })
    } else {
        res.sendStatus(401)
    }
})

//add a simple get('') request to http://apnayrung.com/customer/
//it returns information about the user who is logged in

module.exports = router