var express = require('express')
var router = express.Router()
const client = require('../utilities/clientConnect')
const authenticateJWT = require("../utilities/authenticateJWT")
const isBlocked = require('../utilities/isBlocked')
const checkUniqueEmail = require('../utilities/checkUniqueEmail')
const checkUniqueEmail2 = require('../utilities/checkUniqueEmail2')

const { hasAllFields, constraints } = require('../utilities/hasAllFields')

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

//toggle block
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
    const query = "SELECT seller_id,name,email,phone,location,bio,weeklyartisan,blocked,approved,profile_picture FROM public.sellers WHERE seller_id=$1"
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
            const result = await client.query(`SELECT seller_id,name,email,phone,location,bio,weeklyartisan,blocked,approved,profile_picture FROM public.sellers WHERE name LIKE $1`, [`%` + req.body.query + `%`])
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
        const query = `SELECT seller_id,name,email,phone,location,bio,weeklyartisan,blocked,approved,profile_picture FROM public.sellers ORDER BY seller_id`

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

router.get('/all/unapproved', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == "admin") {
        const query = `SELECT seller_id,name,email,phone,location,bio,weeklyartisan,blocked,approved,profile_picture FROM public.sellers WHERE approved=false ORDER BY seller_id`

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

router.patch('/approve/:id', authenticateJWT, (req, res) => {
    // this code toggles the blocked status. Sets it to blocked if unblocked, and unblocked if blocked
    if (req.userObject.typeOfUser == "admin") {
        const query = "UPDATE sellers SET approved = true WHERE seller_id=$1"
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

router.patch('/disapprove/:id', authenticateJWT, (req, res) => {
    // this code toggles the blocked status. Sets it to blocked if unblocked, and unblocked if blocked
    if (req.userObject.typeOfUser == "admin") {
        client.query("BEGIN")
        let query = "UPDATE sellers SET approved = false WHERE seller_id=$1"
        let values = [req.params.id]
        client.query(query, values).then(result => {
            if (result.rowCount > 0) {
                query = "DELETE FROM sellers WHERE seller_id=$1"
                client.query(query, values)
                    .then(response => {
                        if (response.rowCount > 0) {
                            client.query("COMMIT")
                            res.sendStatus(200)
                        } else {
                            client.query("ROLLBACK")
                            res.sendStatus(204)
                        }
                    })

            } else {
                res.sendStatus(204)
            }
        }).catch(err => {
            console.log(err)
            res.sendStatus(500)
        })
    } else {
        res.sendStatus(401)
    }
})

router.post('/new', upload.single('cnic_image'), async(req, res) => {
    //generating hashed password
    let emailUnique = await checkUniqueEmail(req.body.email)
    if (emailUnique == true) {
        try {
            let hashed_pwd = await bcrypt.hash(req.body.password, saltRounds)
            const finalfile = path.join(process.cwd(), req.file.destination, req.file.filename)

            fs.readFile(finalfile, 'hex', function(err, imgData) {
                if (err) {
                    console.log(err)
                    res.sendStatus(500)
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
                            res.sendStatus(501)
                        })
                }
            })
        } catch (err) {
            console.log(err)
            res.sendStatus(502)
        }
    } else {
        res.sendStatus(400)
        console.log("Email not unique")
    }
})

router.get('/cnic/:seller_id', (req, res) => {
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
})

router.patch('/update', authenticateJWT, isBlocked, async(req, res) => {
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
        const valid_input = hasAllFields({
            "name": ["string", 100, "notempty"],
            "email": ["string", 100, "notempty"],
            "passwordChanged": ["boolean", -1, ""],
            "location": ["string", 100, "notempty"],
            "phone": ["string", 18, ""],
            "bio": ["string", -1, ""]
        }, req.body)
        if (valid_input !== true) {
            console.log(valid_input)
            res.status(400).json(valid_input)
        } else {
            let emailUnique = await checkUniqueEmail2(req.body.email, req.userObject.typeOfUser, req.userObject.id)
            if (emailUnique == true) {
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
                console.log("HEY")
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

router.post('/update/profile_picture', authenticateJWT, upload.single('profile_picture'), (req, res) => {
    const finalfile = path.join(process.cwd(), req.file.destination, req.file.filename)
    fs.readFile(finalfile, 'hex', function(err, imgData) {
        if (err) {
            console.log(err)
            res.sendStatus(500)
        } else {
            imgData = '\\x' + imgData;
            const url = process.env.URL + "/image/seller/" + req.userObject.id.toString()
            const query = "UPDATE sellers SET profile_picture_data=$1, profile_picture=$2 WHERE seller_id=$3"
            const values = [imgData, url, req.userObject.id]

            client.query(query, values)
                .then(response => {
                    if (response.rowCount > 0) {
                        res.sendStatus(202)
                    } else {
                        res.sendStatus(204)
                    }
                })
                .catch(err => {
                    console.log(err)
                    res.sendStatus(500)
                })
        }
    })
})

router.post('/verify', async(req, res) => {
    // const query = 
    try {
        const result = await client.query(`SELECT seller_id,name,password FROM sellers WHERE email='${req.body.email}' AND blocked=false AND approved=true`)
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
    const query = "SELECT seller_id, name, email, phone, location, bio, weeklyartisan, blocked, profile_picture FROM sellers WHERE approved=true ORDER BY name LIMIT $1"
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

router.patch('/spotlight/:seller_id', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == 'admin') {
        let query = "UPDATE sellers SET weeklyartisan= NOT weeklyartisan WHERE seller_id=$1"
        let values = [req.params.seller_id]
        client.query(query, values)
            .then(response => {
                if (response.rowCount > 0) {
                    query = "SELECT weeklyartisan FROM sellers WHERE seller_id=$1"
                    client.query(query, values)
                        .then(response2 => {
                            if (response2.rowCount > 0) {
                                if (response2.rows[0].weeklyartisan == true) {
                                    query = "INSERT INTO notifications (title,type,seller_id) VALUES ($1,$2,$3)"
                                    values = ["Congratulations! You have been made Artisan in the Spotlight.", "message", req.params.seller_id]
                                    client.query(query, values)
                                        .then(resp => {
                                            if (resp.rowCount > 0) {
                                                res.sendStatus(202)
                                            } else {
                                                res.sendStatus(202)
                                            }
                                        })
                                } else {
                                    query = "INSERT INTO notifications (title,type,seller_id) VALUES ($1,$2,$3)"
                                    values = ["Congratulations! You have been removed from Artisan in the Spotlight.", "message", req.params.seller_id]
                                    client.query(query, values)
                                        .then(resp => {
                                            if (resp.rowCount > 0) {
                                                res.sendStatus(202)
                                            } else {
                                                res.sendStatus(202)
                                            }
                                        })
                                }

                            } else {
                                res.sendStatus(500)
                            }
                        })

                } else {
                    res.sendStatus(204)
                }
            })
    } else {
        res.sendStatus(401)
    }
})



module.exports = router