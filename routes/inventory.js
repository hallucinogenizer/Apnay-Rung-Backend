const express = require('express')
const router = express.Router()

const authenticateJWT = require("../utilities/authenticateJWT")
const client = require('../utilities/clientConnect')

function findAvgRating(item_id) {
    return new Promise((resolve, reject) => {
        const query = "SELECT review FROM orders WHERE true"
        client.query(query).then(result => {
            let ratings = []
            for (index in result.rows) {
                for (item in result.rows[index].review) {
                    ratings.push(result.rows[index].review[item][1])
                }
            }
            Promise.all(ratings).then(allRatings => {
                let sum = 0
                for (let i = 0; i < allRatings.length; i++) {
                    sum += allRatings[i]
                }
                const avg = sum / allRatings.length
                resolve(avg)
            })
        })
    })
}

router.get('/all/mine', authenticateJWT, async(req, res) => {
    const query = "SELECT item_id,title,description,image,category,inventory.seller_id,sellers.name AS seller_name,price,stock FROM inventory,sellers WHERE inventory.seller_id=sellers.seller_id AND inventory.seller_id=$1;"
    const values = [req.userObject.id]

    client.query(query, values)
        .then(result => {
            res.status(200).json(result.rows)
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

router.get('/all', (req, res) => {
    const query = "SELECT item_id,title,description,image,category,inventory.seller_id,sellers.name AS seller_name,price,stock FROM inventory,sellers WHERE inventory.seller_id=sellers.seller_id"
    client.query(query)
        .then(result => {
            res.status(200).json(result.rows)
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

router.post('/new', authenticateJWT, async(req, res) => {
    /*
        {
            title:____,
            description:____,
            image:{______}, //array of URLs
            category:_______,
            price:__________,
            stock:______
        }
    */
    if (req.userObject.typeOfUser == 'seller') {
        const query = "INSERT INTO inventory (title, description, image, category, price, stock, seller_id) VALUES ($1, $2, $3, $4, $5, $6, $7)"
        const values = [req.body.title, req.body.description, req.body.image, req.body.category, req.body.price, req.body.stock, req.userObject.id]

        client.query(query, values)
            .then(response => {
                res.sendStatus(200)
            })
            .catch(err => {
                res.sendStatus(500)
                    // console.log(err)
            })
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
        res.sendStatus(401)
    }
})

router.get('/id/:item_id', async(req, res) => {
    const query = "SELECT * FROM inventory WHERE item_id=$1"
    const values = [req.params.item_id]

    client.query(query, values)
        .then(async(result) => {
            if (result.rowCount > 0) {
                result.rows[0].rating = await findAvgRating(req.params.item_id)
                res.status(200).json(result.rows)
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
                res.status(200).json(result.rows)
            }
        }
    } catch (err) {
        res.sendStatus(500)
        console.log(err)
    }

})

router.get('/location/:province', (req, res) => {
    const query = "SELECT inventory.item_id, inventory.title, inventory.description, inventory.image, inventory.category, inventory.stock, inventory.price, sellers.seller_id, sellers.name FROM inventory INNER JOIN sellers ON inventory.seller_id=sellers.seller_id WHERE sellers.location=$1;"
    const values = [req.params.province]

    client.query(query, values)
        .then(result => {
            res.status(200).json(result.rows)
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

router.get('/sort/price/asc', (req, res) => {
    const query = "SELECT item_id,title,description,image,category,inventory.seller_id,sellers.name,price,stock FROM inventory,sellers WHERE inventory.seller_id=sellers.seller_id ORDER BY inventory.price ASC;"
    client.query(query)
        .then(result => {
            res.status(200).json(result.rows)
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

router.get('/sort/price/desc', (req, res) => {
    const query = "SELECT item_id,title,description,image,category,inventory.seller_id,sellers.name,price,stock FROM inventory,sellers WHERE inventory.seller_id=sellers.seller_id ORDER BY inventory.price DESC;"
    client.query(query)
        .then(result => {
            res.status(200).json(result.rows)
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
})

router.get('/sort/alphabetical', (req, res) => {
    const query = "SELECT item_id,title,description,image,category,inventory.seller_id,sellers.name,price,stock FROM inventory,sellers WHERE inventory.seller_id=sellers.seller_id ORDER BY inventory.title ASC;"
    client.query(query)
        .then(result => {
            res.status(200).json(result.rows)
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

module.exports = router