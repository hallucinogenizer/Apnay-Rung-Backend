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
    let query
    let values
    let continueOrNot = false
    if (req.userObject.typeOfUser == 'seller') {
        query = "SELECT * FROM inventory WHERE seller_id = $1"
        values = [req.userObject.id]
        continueOrNot = true
    } else if (req.userObject.typeOfUser == 'admin') {
        query = "SELECT * FROM inventory"
        values = []
        continueOrNot = true
    } else if (req.userObject.typeOfUser == 'customer') {
        query = "SELECT * FROM inventory"
        values = []
        continueOrNot = true
    } else {
        res.sendStatus(401)
    }

    if (continueOrNot) {
        try {
            const result = await client.query(query, values)
            for (let rowF = 0; rowF < result.rowCount; rowF++) {
                const q = "SELECT name FROM sellers WHERE seller_id=$1"
                const v = [result.rows[rowF].seller_id]

                client.query(q, v).then(r => {
                    if (r.rowCount > 0) {
                        result.rows[rowF].seller_name = r.rows[0].name
                    }
                    if (rowF == result.rowCount - 1) {
                        res.status(200).json(result.rows)
                    }
                })
            }


        } catch (err) {
            res.sendStatus(500)
            console.log(err)
        }
    }
})

router.get('/all', (req, res) => {
    const query = "SELECT * FROM inventory WHERE true"
    let promises = []
    client.query(query).then(async(result) => {

        promises.push(new Promise(async(resolve, reject) => {
            for (let index = 0; index < result.rows.length; index++) {
                const avg = await findAvgRating(result.rows[index].item_id)
                result.rows[index].rating = avg
                if (index == result.rows.length - 1) {
                    resolve(avg)
                }
            }
        }))
        Promise.all(promises).then(all => {
            res.json(result.rows)
        }).catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
    }).catch(err => {
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

module.exports = router