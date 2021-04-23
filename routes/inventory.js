const express = require('express')
const router = express.Router()

const authenticateJWT = require("../utilities/authenticateJWT")
const client = require('../utilities/clientConnect')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const { hasAllFields, constraints } = require('../utilities/hasAllFields')

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './images/')
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) //Appending .jpg
    }
})

var upload = multer({ dest: './images/', storage: storage })

async function findAvgRating(item_id) {
    const query = "SELECT review FROM orders WHERE true"
    let result = await client.query(query)
    return new Promise((resolve, reject) => {
        if (result.rowCount > 0) {
            let sum = 0
            let n = 0
            for (let i = 0; i < result.rows.length; i++) {
                for (let j = 0; j < result.rows[i].review.length; j++) {
                    if (result.rows[i].review[j][0] == item_id) {
                        n++
                        sum += result.rows[i].review[j][1]
                    }
                }
            }
            resolve(sum / n)
        } else {
            resolve(0)
        }
    })

}

router.get('/all/mine', authenticateJWT, async(req, res) => {
    const query = "SELECT item_id,title,description,image,category,inventory.seller_id,sellers.name AS seller_name,price,stock FROM inventory,sellers WHERE inventory.seller_id=sellers.seller_id AND inventory.seller_id=$1;"
    const values = [req.userObject.id]

    client.query(query, values)
        .then(result => {
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].image = "https://apnay-rung-api.herokuapp.com/image/item/" + result.rows[i].item_id.toString()
                if (i == result.rows.length - 1) {
                    res.status(200).json(result.rows)
                }
            }
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

router.get('/all', (req, res) => {
    const query = "SELECT item_id,title,description,category,featured,inventory.seller_id,sellers.name AS seller_name,price,stock FROM inventory,sellers WHERE inventory.seller_id=sellers.seller_id"
    client.query(query)
        .then(async(result) => {
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].image = process.env.URL + "/image/item/" + result.rows[i].item_id.toString()
                const avg = await findAvgRating(result.rows[i].item_id)
                console.log(avg)
                result.rows[i].rating = avg
            }
            res.status(200).json(result.rows)
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

router.post('/new', upload.single('image'), authenticateJWT, async(req, res) => {
    /*
        {
            title:____,
            description:____,
            category:_______,
            price:__________,
            stock:______
        }
    */
    if (req.userObject.typeOfUser == 'seller') {
        const valid_input = hasAllFields({
            "title": ["string", 100, "notempty"],
            "description": ["string", -1, "notempty"],
            "category": ["string", 50, "notempty"]
        }, req.body)
        if (valid_input !== true) {
            res.status(400).json(valid_input)
        } else {
            const finalfile = path.join(process.cwd(), req.file.destination, req.file.filename)

            fs.readFile(finalfile, 'hex', function(err, imgData) {
                if (err) {
                    console.log(err)
                    res.sendStatus(500)
                } else {
                    imgData = '\\x' + imgData;
                    const query = "INSERT INTO inventory (title, description, image,  category, price, stock, seller_id) VALUES ($1, $2, $3, $4, $5, $6, $7)"
                    const values = [req.body.title, req.body.description, imgData, req.body.category, req.body.price, req.body.stock, req.userObject.id]

                    client.query(query, values)
                        .then(response => {
                            res.sendStatus(200)
                        })
                        .catch(err => {
                            res.sendStatus(500)
                            console.log("2:", err)
                        })
                }
            })
        }
    } else {
        res.sendStatus(401)
    }

})

router.patch('/update/:item_id', authenticateJWT, (req, res) => {
    /*
    {
        'title':____,
        'description':______,
        'category':_________,
        'price':_____,
        'stock':______
    }
    */
    if (req.userObject.typeOfUser == 'seller') {
        const query = "UPDATE inventory SET title=$1, description=$2, category=$3, price=$4, stock=$5 WHERE item_id=$6 AND seller_id=$7"
        const values = [req.body.title, req.body.description, req.body.category, req.body.price, req.body.stock, req.params.item_id, req.userObject.id]
        client.query(query, values)
            .then(response => {
                if (response.rowCount > 0) {
                    res.sendStatus(202)
                } else {
                    res.sendStatus(406)
                }
            })
            .catch(err => {
                res.sendStatus(500)
                console.log(err)
            })
    } else {
        res.sendStatus(403)
    }
})

router.post('/update/image/:item_id', authenticateJWT, upload.single('image'), (req, res) => {
    const finalfile = path.join(process.cwd(), req.file.destination, req.file.filename)
    fs.readFile(finalfile, 'hex', function(err, imgData) {
        if (err) {
            console.log(err)
            res.sendStatus(500)
        } else {
            imgData = '\\x' + imgData;
            const url = process.env.URL + "/image/item/" + req.params.item_id.toString()
            const query = "UPDATE inventory SET image=$1 WHERE item_id=$2"
            const values = [imgData, req.params.item_id]

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

router.get('/id/:item_id', async(req, res) => {
    const query = "SELECT * FROM inventory WHERE item_id=$1"
    const values = [req.params.item_id]

    client.query(query, values)
        .then(async(result) => {
            if (result.rowCount > 0) {
                result.rows[0].rating = await findAvgRating(req.params.item_id)
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].image = process.env.URL + "image/item/" + result.rows[i].item_id.toString()
                    if (i == result.rows.length - 1) {
                        res.status(200).json(result.rows)
                    }
                }
            } else {
                res.sendStatus(204)
            }
        }).catch(err => {
            console.log(err)
            res.sendStatus(500)
        })
})

//check user type in this:
router.delete('/id/:item_id', authenticateJWT, async(req, res) => {
    if (req.userObject.typeOfUser == 'seller') {
        const query = "DELETE FROM inventory WHERE item_id=$1 AND seller_id=$2"
        const values = [req.params.item_id, req.userObject.id]
        client.query(query, values)
            .then(response => {
                if (response.rowCount == 0) {
                    res.sendStatus(204)
                } else if (response.rowCount == 1) {
                    res.sendStatus(200)
                }
            })
            .catch(err => {
                res.sendStatus(500)
                console.log(err)
            })
    } else {
        res.sendStatus(401)
    }
})

router.get('/limit/:limit', async(req, res) => {
    let query = "SELECT * FROM inventory WHERE true LIMIT $1"
    let values = [req.params.limit]
    let promises = []
    try {
        const result = await client.query(query, values)
        for (let index = 0; index < result.rows.length; index++) {
            query = "SELECT name FROM sellers WHERE seller_id=$1"
            values = [result.rows[index].seller_id]

            client.query(query, values).then(r => {
                if (r.rowCount > 0) {
                    result.rows[index].seller_name = r.rows[0].name

                } else {
                    result.rows[index].seller_name = "Unknown"
                }
            })
            const avg = await findAvgRating(result.rows[index].item_id)
            result.rows[index].rating = avg
            if (index == result.rows.length - 1) {
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].image = "https://apnay-rung-api.herokuapp.com/image/item/" + result.rows[i].item_id.toString()
                    if (i == result.rows.length - 1) {
                        res.status(200).json(result.rows)
                    }
                }
            }
        }
    } catch (err) {
        res.sendStatus(500)
        console.log(err)
    }

})

router.get('/location/:province', (req, res) => {
    const query = "SELECT inventory.item_id, inventory.title, inventory.description, inventory.image, inventory.category, inventory.stock, inventory.price, sellers.seller_id, sellers.name AS seller_name FROM inventory INNER JOIN sellers ON inventory.seller_id=sellers.seller_id WHERE sellers.location=$1;"
    const values = [req.params.province]

    client.query(query, values)
        .then(result => {
            if (result.rowCount > 0) {
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].image = "https://apnay-rung-api.herokuapp.com/image/item/" + result.rows[i].item_id.toString()
                    if (i == result.rows.length - 1) {
                        res.status(200).json(result.rows)
                    }
                }
            } else {
                res.status(200).json(result.rows)
            }

        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

router.get('/sort/price/asc', (req, res) => {
    const query = "SELECT item_id,title,description,image,category,inventory.seller_id,sellers.name AS seller_name,price,stock FROM inventory,sellers WHERE inventory.seller_id=sellers.seller_id ORDER BY inventory.price ASC;"
    client.query(query)
        .then(result => {
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].image = "https://apnay-rung-api.herokuapp.com/image/item/" + result.rows[i].item_id.toString()
                if (i == result.rows.length - 1) {
                    res.status(200).json(result.rows)
                }
            }
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

router.get('/sort/price/desc', (req, res) => {
    const query = "SELECT item_id,title,description,image,category,inventory.seller_id,sellers.name AS seller_name,price,stock FROM inventory,sellers WHERE inventory.seller_id=sellers.seller_id ORDER BY inventory.price DESC;"
    client.query(query)
        .then(result => {
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].image = "https://apnay-rung-api.herokuapp.com/image/item/" + result.rows[i].item_id.toString()
                if (i == result.rows.length - 1) {
                    res.status(200).json(result.rows)
                }
            }
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

router.get('/sort/alphabetical', (req, res) => {
    const query = "SELECT item_id,title,description,image,category,inventory.seller_id,sellers.name AS seller_name,price,stock FROM inventory,sellers WHERE inventory.seller_id=sellers.seller_id ORDER BY inventory.title ASC;"
    client.query(query)
        .then(result => {
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].image = "https://apnay-rung-api.herokuapp.com/image/item/" + result.rows[i].item_id.toString()
                if (i == result.rows.length - 1) {
                    res.status(200).json(result.rows)
                }
            }
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

router.patch('/stock', authenticateJWT, (req, res) => {
    /*
    to increase stock of item 7 by 10
        {
            item_id:7,
            stock_increment:10
        }
        
    */
    const query = "UPDATE inventory SET stock=stock+$1 WHERE item_id=$2 AND seller_id=$3"
    const values = [req.body.stock_increment, req.body.item_id, req.userObject.id]

    client.query(query, values)
        .then(response => {
            if (response.rowCount > 0) {
                res.sendStatus(202)
            } else {
                res.status(400).end("Either you are trying to increment the stocks of an item that does not belong to the seller whose token you are using, or you sent a wrong item_id.")
            }
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

router.patch('/featured/set/:item_id', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == 'admin') {
        const query = "UPDATE inventory SET featured=true WHERE item_id=$1"
        const values = [req.params.item_id]
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
    } else {
        res.sendStatus(403)
    }
})

router.patch('/featured/remove/:item_id', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == 'admin') {
        const query = "UPDATE inventory SET featured=false WHERE item_id=$1"
        const values = [req.params.item_id]
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
    } else {
        res.sendStatus(403)
    }
})

router.patch('/featured/toggle/:item_id', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == 'admin') {
        const query = "UPDATE inventory SET featured = NOT featured WHERE item_id=$1"
        const values = [req.params.item_id]
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
    } else {
        res.sendStatus(403)
    }
})

router.get('/featured', (req, res) => {
    const query = "SELECT item_id,title,description,category,inventory.seller_id,sellers.name AS seller_name,price,stock FROM inventory,sellers WHERE inventory.seller_id=sellers.seller_id AND inventory.featured=true"
    client.query(query)
        .then(result => {
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].image = process.env.URL + "/image/item/" + result.rows[i].item_id.toString()
            }
            res.status(200).json(result.rows)
        })
        .catch(err => {
            console.log(err)
            res.sendStatus(500)
        })
})

module.exports = router