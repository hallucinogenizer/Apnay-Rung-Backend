const express = require('express')
const router = express.Router()
const authenticateJWT = require("../utilities/authenticateJWT")
const jwt = require('jsonwebtoken')
const client = require('../utilities/clientConnect')
    //for bcrypt
const bcrypt = require('bcrypt')
const saltRounds = 10

router.post('/new', async(req, res) => {
    //generating hashed password
    try {
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
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.patch('/update', authenticateJWT, (req, res) => {
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
        res.sendStatus(401)
    }
})

router.get('/verify', async(req, res) => {
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
                console.log(err)
            })

    } catch (err) {
        console.log(err)
    }
})

module.exports = router