var express = require('express')
var router = express.Router()
const client = require('../utilities/clientConnect')
const authenticateJWT = require("../utilities/authenticateJWT")
const jwt = require('jsonwebtoken')
    //for bcrypt
const bcrypt = require('bcrypt')
const saltRounds = 10


router.patch('/block/:id', authenticateJWT, (req, res) => {
    // this code toggles the blocked status. Sets it to blocked if unblocked, and unblocked if blocked
    if (req.userObject.typeOfUser == "admin") {
        const query = "UPDATE public.sellers SET blocked = NOT blocked WHERE seller_id=" + req.params.id
        client.query(query).then(result => {
            res.sendStatus(200)
        }).catch(err => {
            console.log(err)
            res.sendStatus(500)
        })
    } else {
        res.sendStatus(401)
    }
})

router.get('/id/:id', authenticateJWT, async(req, res) => {
    if (req.userObject.typeOfUser == "admin" || req.userObject.typeOfUser == "customer") {
        const query = "SELECT seller_id,name,email,cnic,location,bio,weeklyartisan,blocked,profile_picture FROM public.sellers WHERE seller_id=$1"
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
            //unauthorized
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
            const result = await client.query(`SELECT seller_id,name,email,cnic,location,bio,weeklyartisan,blocked,profile_picture FROM public.sellers WHERE name LIKE '%${req.body.query}%'`)
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
        const query = `SELECT seller_id,name,email,cnic,location,bio,weeklyartisan,blocked,profile_picture FROM public.sellers`

        client
            .query(query)
            .then(result => {
                res.status(200).json(result.rows)
            })
            .catch(err => {
                console.log(err)
                res.sendStatus()
            })
    } else {
        res.sendStatus(401)
    }
})

//find a secure way of doing this like parameterized queries
router.post('/new', async(req, res) => {
    //generating hashed password
    try {
        let hashed_pwd = await bcrypt.hash(req.body.password, saltRounds)

        const query = `INSERT INTO sellers (name,email,password,location,cnic,cnic_image,sec_questions) VALUES ('${req.body.name}', '${req.body.email}', '${hashed_pwd}','${req.body.location}' ,'${req.body.cnic}', '${req.body.cnic_image}', '${JSON.stringify(req.body.sec_questions)}')`
        console.log(query)
        client.query(query)
            .then(resolve => {
                console.log("Insertion Successful")
                res.status(201).end()
            })
            .catch(err => {
                console.log(err)
            })
    } catch (err) {
        console.log(err)
    }
})

router.patch('/update', authenticateJWT, (req, res) => {
    /*
    {
        name:'',
        email:'',
        password:'',
        passwordChanged:true,
        location:'',
        bio:''
    }
    */

    if (req.userObject.typeOfUser == "seller") {
        try {
            let success = false
            const query = `UPDATE sellers SET name = '${req.body.name}',email='${req.body.email}',location='${req.body.location}',bio='${req.body.bio}' WHERE seller_id=${req.userObject.id}`

            client.query(query)
                .then(resolve => {
                    success = true

                    if (req.body.passwordChanged == true) {
                        const pwd_promise = bcrypt.hash(req.body.password, saltRounds)
                        pwd_promise.then(hashed_pwd => {
                            const query = `UPDATE sellers SET password='${hashed_pwd}' WHERE seller_id=${req.userObject.id}`
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
    // const query = 
    try {
        const result = await client.query(`SELECT seller_id,name,password FROM sellers WHERE email='${req.body.email}'`)
        let userObject = {
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