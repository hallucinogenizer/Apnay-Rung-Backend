var express = require('express')
var router = express.Router()
const client = require('../utilities/clientConnect')
const authenticateJWT = require("../utilities/authenticateJWT")
const isBlocked = require('../utilities/isBlocked')
const jwt = require('jsonwebtoken')
    //for bcrypt
const bcrypt = require('bcrypt')
const saltRounds = 10


const fs = require('fs')
const path = require('path')
const multer = require('multer')

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './images/')
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) //Appending .jpg
    }
})

var upload = multer({ dest: './images/', storage: storage })


router.patch('/block/:id', authenticateJWT, (req, res) => {
    // this code toggles the blocked status. Sets it to blocked if unblocked, and unblocked if blocked
    if (req.userObject.typeOfUser == "admin") {
        const query = "UPDATE public.sellers SET blocked = NOT blocked WHERE seller_id=$1"
        const values = [req.params.id]
        client.query(query, values).then(result => {
            res.sendStatus(200)
        }).catch(err => {
            console.log(err)
            res.sendStatus(500)
        })
    } else {
        res.sendStatus(401)
    }
})

router.get('/id/:id', async(req, res) => {
    const query = "SELECT seller_id,name,email,phone,location,bio,weeklyartisan,blocked,profile_picture FROM public.sellers WHERE seller_id=$1"
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
})

router.get('/search', authenticateJWT, async(req, res) => {
    /*
    JSON {
        'query':'Taimoo'
    }
    */
    if (req.userObject.typeOfUser == "admin") {
        try {
            const result = await client.query(`SELECT seller_id,name,email,phone,location,bio,weeklyartisan,blocked,profile_picture FROM public.sellers WHERE name LIKE $1`, [`%` + req.body.query + `%`])
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
        const query = `SELECT seller_id,name,email,phone,location,bio,weeklyartisan,blocked,profile_picture FROM public.sellers`

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
router.post('/new', upload.single('cnic_image'), async(req, res) => {
    //generating hashed password
    try {
        let hashed_pwd = await bcrypt.hash(req.body.password, saltRounds)
        const finalfile = path.join(process.cwd(), req.file.destination, req.file.filename)

        fs.readFile(finalfile, 'hex', function(err, imgData) {
            if (err) {
                console.log(err)
            } else {
                imgData = '\\x' + imgData;
                const query = `INSERT INTO sellers (name,email,password,phone,location,cnic_image,sec_questions) VALUES ($1, $2, $3, $4 ,$5, $6, $7)`
                const values = [req.body.name, req.body.email, hashed_pwd, req.body.phone, req.body.location, imgData, JSON.stringify(req.body.sec_questions)]
                client.query(query, values)
                    .then(resolve => {
                        console.log("Insertion Successful")
                        res.status(201).end()
                    })
                    .catch(err => {
                        console.log(err)
                    })
            }
        })
    } catch (err) {
        console.log(err)
    }
})

router.get('/cnic/:seller_id', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == 'admin' || req.userObject.typeOfUser == 'seller') {
        const query = "SELECT cnic_image AS data FROM sellers WHERE seller_id=$1"
        const values = [req.params.seller_id]
        client.query(query, values)
            .then(result => {
                res.contentType('jpeg')
                res.status(200)
                res.end(result.rows[0].data)
            })
            .catch(err => {
                console.log(err)
                res.sendStatus(500)
            })
    }
})

router.patch('/update', authenticateJWT, isBlocked, (req, res) => {
    /*
    {
        name:'',
        email:'',
        phone:'',
        password:'',
        passwordChanged:true,
        location:'',
        bio:''
    }
    */

    if (req.userObject.typeOfUser == "seller") {
        try {
            let success = false
            const query = `UPDATE sellers SET name = $1,email=$2,location=$3,phone=$4,bio=$5 WHERE seller_id=$6`
            const values = [req.body.name, req.body.email, req.body.location, req.body.phone, req.body.bio, req.userObject.id]

            client.query(query, values)
                .then(resolve => {
                    success = true

                    if (req.body.passwordChanged == true) {
                        const pwd_promise = bcrypt.hash(req.body.password, saltRounds)
                        pwd_promise.then(hashed_pwd => {
                            const query = `UPDATE sellers SET password=$1 WHERE seller_id=$2`
                            const values = [hashed_pwd, req.userObject.id]
                            client.query(query, values)
                                .then(resolve => {
                                    if (success == true) {
                                        res.sendStatus(202)
                                    } else {
                                        res.status(500).send("Unable to update information.")
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

router.post('/verify', async(req, res) => {
    // const query = 
    try {
        const result = await client.query(`SELECT seller_id,name,password FROM sellers WHERE email='${req.body.email}' AND blocked=false`)
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

router.get('/limit/:limit', (req, res) => {
    const query = "SELECT seller_id, name, email, phone, location, bio, weeklyartisan, blocked, profile_picture FROM sellers WHERE true LIMIT $1"
    const values = [req.params.limit]

    client.query(query, values).then(result => {
        res.status(200).json(result.rows)
    }).catch(err => {
        res.sendStatus(500)
        console.log(err)
    })
})

router.get('/info', authenticateJWT, async(req, res) => {
    if (req.userObject.typeOfUser == 'seller') {
        const query = "SELECT seller_id, name, email, phone, location, bio, weeklyartisan, blocked, profile_picture, sec_questions FROM sellers WHERE seller_id=$1"
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

router.get('/spotlight', (req, res) => {
    const query = "SELECT seller_id,name,email,phone,location,bio,profile_picture FROM sellers WHERE weeklyartisan=true AND blocked=false"
    client.query(query)
        .then(result => {
            res.status(200).json(result.rows)
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

module.exports = router