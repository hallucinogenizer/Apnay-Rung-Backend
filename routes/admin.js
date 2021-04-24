const express = require('express')
const router = express.Router()
const authenticateJWT = require("../utilities/authenticateJWT")
const { hasAllFields, constraints } = require('../utilities/hasAllFields')
const checkUniqueEmail2 = require('../utilities/checkUniqueEmail2')
const jwt = require('jsonwebtoken')
const client = require('../utilities/clientConnect')
    //for bcrypt
const bcrypt = require('bcrypt')
const saltRounds = 10


router.post('/new', async(req, res) => {
    //generating hashed password
    try {
        const valid_input = hasAllFields({
            "name": constraints.name,
            "email": constraints.email,
            "password": constraints.password
        }, req.body)

        if (valid_input !== true) {
            res.status(400).send(valid_input)
        } else {
            let hashed_pwd = await bcrypt.hash(req.body.password, saltRounds)

            const query = `INSERT INTO admins (name,email,password) VALUES ('${req.body.name}', '${req.body.email}', '${hashed_pwd}')`

            client.query(query)
                .then(resolve => {
                    console.log("Insertion Successful")
                    res.status(201).end()
                })
                .catch(err => {
                    console.log(err)
                    res.sendStatus(500)
                })
        }
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.patch('/update', authenticateJWT, async(req, res) => {
    /*
    {
        name:'',
        email:'',
        password:'',
        passwordChanged:true,
        profile_picture:''
    }
    */
    if (req.userObject.typeOfUser == "admin") {
        const valid_input = hasAllFields({
            "name": constraints.name,
            "email": constraints.email,
            "passwordChanged": constraints.boolean
        }, req.body)
        if (valid_input !== true) {
            res.status(400).json(valid_input)
        } else {
            let emailUnique = await checkUniqueEmail2(req.body.email, req.userObject.typeOfUser, req.userObject.id)
            if (emailUnique == true) {
                try {
                    let success = false
                    const query = `UPDATE admins SET name = '${req.body.name}',email='${req.body.email}',profile_picture = '${req.body.profile_picture}' WHERE admin_id=${req.userObject.id}`

                    client.query(query)
                        .then(resolve => {
                            success = true

                            if (req.body.passwordChanged == true) {
                                const pwd_promise = bcrypt.hash(req.body.password, saltRounds)
                                pwd_promise.then(hashed_pwd => {
                                    const query = `UPDATE admins SET password='${hashed_pwd}' WHERE admin_id=${req.userObject.id}`
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
            } else {
                res.status(400).json({
                    missingFields: [],
                    wrongFields: ['email'],
                    longFields: [],
                    emptyFields: []
                })
            }
        }
    } else {
        res.sendStatus(401)
    }
})

//add constraints._____ to customer.js as well, just like in admin.js
router.get('/verify', async(req, res) => {
    const valid_input = hasAllFields({
        "email": constraints.email,
        "password": constraints.password
    }, req.body)
    if (valid_input !== true) {
        res.status(400).send(valid_input)
    } else {
        const query = `SELECT admin_id,name,password FROM admins WHERE email='${req.body.email}';`
        try {
            const result = await client.query(query)
            let userObject = {
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
                    res.sendStatus(500)
                    console.log(err)
                })

        } catch (err) {
            res.sendStatus(500)
            console.log(err)
        }
    }
})

router.get('/info', authenticateJWT, async(req, res) => {
    if (req.userObject.typeOfUser == 'admin') {
        const query = "SELECT admin_id,name,email FROM admins WHERE admin_id=$1"
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

module.exports = router