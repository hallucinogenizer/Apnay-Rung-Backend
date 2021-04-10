var express = require('express')
var router = express.Router()
const client = require('../utilities/clientConnect')
const authenticateJWT = require("../utilities/authenticateJWT")
const isBlocked = require('../utilities/isBlocked')
const { hasAllFields, constraints } = require('../utilities/hasAllFields')
const replaceIdWithTitle = require('../utilities/replaceIdWithTitle')


router.post('/new', authenticateJWT, (req, res) => {
    /* 
    {
        items:{[item_id,quantity,price],[1,2,500],[]},
        totalamount:0,
        delivery_status:'processing',
        name:'Rohan',
        email:'rohan@yahoo.com',
        phone:'=+923025474222',
        billing_address:'Street House Area City Province',
        shipping_address:'Street House Area City Province'
    }
    */
    const valid_input = hasAllFields({
        "name": constraints.name,
        "email": constraints.email,
        "billing_address": ["string", 300, "notempty"],
        "shipping_address": ["string", 300, "notempty"],
        "phone": ["string", 18, ""],
        "delivery_status": ["string", 50, "notempty"],
        "totalamount": ["number", 100, "notempty"]
    }, req.body)
    if (valid_input !== true) {
        res.status(400).send(valid_input)
    } else {
        if (req.userObject.typeOfUser == "customer") {
            const query = "INSERT INTO orders (timestamp,customer_id,delivery_status,review,totalamount,cancelled,items,name,email,phone,b_address,s_address, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,$13)"
            const values = ['NOW()', req.userObject.id, req.body.delivery_status, "", req.body.totalamount, false, req.body.items, req.body.name, req.body.email, req.body.phone, req.body.b_address, req.body.s_address, req.body.payment_method]

            client.query(query, values)
                .then(response => {
                    res.sendStatus(201)
                }).catch(err => {
                    res.sendStatus(500)
                })
        } else {
            console.log(req.userObject.typeOfUser)
            res.sendStatus(401)
        }
    }
})

router.get('/all', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == "admin") {
        const query = { text: "SELECT * FROM orders WHERE true", values: [] }
        client.query(query)
            .then(async(result) => {
                await replaceIdWithTitle(result, res)
                    // res.status(200).json(result.rows)
            })
            .catch(err => {
                res.sendStatus(500)
                console.log(err)
            })

    } else if (req.userObject.typeOfUser == "customer") {
        const query = {
            text: "SELECT * FROM orders WHERE customer_id=$1",
            values: [req.userObject.id]
        }
        client.query(query)
            .then(async(result) => {
                //replacing item_ids with item_titles
                await replaceIdWithTitle(result, res)
            })
            .catch(err => {
                res.sendStatus(500)
            })
    } else if (req.userObject.typeOfUser == "seller") {
        const query = {
            text: `SELECT * FROM orders WHERE true`,
            values: []
        }
        client.query(query)
            .then(async(result) => {
                //replacing item_ids with item_titles
                let allorders = []
                for (order in result.rows) {
                    let query = "SELECT seller_id FROM inventory WHERE item_id IN ("
                    let item_ids = []
                    for (item in result.rows[order].items) {
                        item_ids.push(result.rows[order].items[item][0])
                        query += result.rows[order].items[item][0]
                        if (item != result.rows[order].items.length - 1) {
                            query += ","
                        }
                    }
                    query += ")"

                    const r = await client.query(query)
                    if (r.rows[0].seller_id == req.userObject.id) {
                        allorders.push(result.rows[order])
                    }

                }
                Promise.all(allorders).then(allorders => {
                    let finalresult = {}
                    finalresult.rows = allorders
                    replaceIdWithTitle(finalresult, res)
                })

                // 

            })
            .catch(err => {
                res.sendStatus(500)
                console.log(err)
            })
    }
})

//get an order by its order_id
router.get('/id/:order_id', authenticateJWT, async(req, res) => {
    const query = "SELECT * FROM orders WHERE order_id=$1"
    const values = [req.params.order_id]
    try {
        let promises = []
        const result = await client.query(query, values)
            //replacing item_ids with item titles
        result.rows[0].items.forEach((item, index) => {
            const title_query = "SELECT title FROM inventory WHERE item_id=$1"
            const title_values = [item[0]]

            promises.push(
                new Promise(function(resolve, reject) {
                    client.query(title_query, title_values, (err, result2) => {
                        if (err) {
                            res.sendStatus(500)
                            console.log(err)
                            reject()
                        } else {
                            result.rows[0].items[index][0] = result2.rows[0].title
                            resolve()
                        }
                    })
                })
            )
        })

        Promise.all(promises)
            .then(response => {
                console.log(response)
                res.status(200).json(result.rows)
            })
            .catch(err => {
                res.sendStatus(500)
            })
    } catch (err) {
        res.sendStatus(500)
        console.log(err)
    }
})

router.get('/search', authenticateJWT, (req, res) => {
    /*
    {
        query:'Taimoor'
    }
    */
    if (req.userObject.typeOfUser == "admin") {
        const query = "SELECT orders.order_id, orders.timestamp, orders.customer_id, orders.delivery_status, orders.review, orders.totalamount, orders.cancelled, orders.name, orders.email, orders.phone, orders.b_address, orders.s_address, orders.items, orders.seller_ids FROM orders INNER JOIN customers ON customers.customer_id=orders.customer_id WHERE customers.name LIKE $1"
        const values = ['%' + req.body.query + '%']
        client.query(query, values)
            .then(result => {
                res.status(200).json(result.rows)
            })
            .catch(err => {
                res.sendStatus(500)
            })
    } else {
        res.sendStatus(401)
    }
})

router.patch('/review/new', authenticateJWT, async(req, res) => {
    /*
    {
        "order_id":__,
        "review":___
    }
    */
    if (req.userObject.typeOfUser == "customer") {
        //checking if the order was this customer's or not
        const pre_query = `SELECT customer_id FROM orders WHERE order_id=$1`
        const pre_values = [req.body.order_id]
        try {
            let result = await client.query(pre_query, pre_values)
            if (result.rows < 1) {
                res.sendStatus(400)
            } else {
                if (result.rows[0].customer_id != req.userObject.id) {
                    res.status(401).send("This is someone else\'s order. You don\'t have the right to post a review for it.")
                    console.log(req.userObject.id)
                } else {
                    try {
                        const query = "UPDATE orders SET review=$1 WHERE order_id=$2;"
                        const values = [req.body.review, req.body.order_id]
                        result = await client.query(query, values)
                        res.sendStatus(202)
                    } catch (err) {
                        res.sendStatus(500)
                        console.log(err)
                    }
                }
            }
        } catch (err) {
            res.sendStatus(500)
        }
    } else {
        res.sendStatus(401)
    }
})

//seller confirms an order
router.patch('/confirm/:order_id', authenticateJWT, (req, res) => {
    if (req.userObject.typeOfUser == "seller") {
        const query = "UPDATE orders SET order_status=True WHERE order_id=$1"
        const values = [req.params.order_id]
        client.query(query, values)
            .then(result => {
                if (result.rowCount == 1) {
                    res.sendStatus(200)
                    console.log(result)
                } else {
                    res.sendStatus(400)
                }
            })
            .catch(err => {
                res.sendStatus(500)
                console.log(err)
            })
    } else {
        res.sendStatus(500)
    }
})

router.get('/review/all', authenticateJWT, isBlocked, async(req, res) => {
    if (req.userObject.typeOfUser == "seller") {
        let query = `SELECT * FROM orders WHERE true`;
        try {
            let result = await client.query(query)



            let allorders = []
            for (order in result.rows) {
                query = "SELECT seller_id FROM inventory WHERE item_id IN ("
                let item_ids = []
                for (item in result.rows[order].items) {
                    item_ids.push(result.rows[order].items[item][0])
                    query += result.rows[order].items[item][0]
                    if (item != result.rows[order].items.length - 1) {
                        query += ","
                    }
                }
                query += ")"

                const r = await client.query(query)
                if (r.rows[0].seller_id == req.userObject.id) {
                    allorders.push(result.rows[order])
                }

            }
            Promise.all(allorders).then(allorders => {
                let finalresult = {}
                finalresult.rows = allorders
                res.status(200).json(finalresult.rows)
            })

        } catch (err) {
            res.sendStatus(500)
            console.log(err)
        }
    } else {
        res.sendStatus(401)
        console.log(err)
    }
})

//all reviews of a given item
router.get('/review/item/:item_id', authenticateJWT, isBlocked, (req, res) => {
    //first find the seller_id of this item
    //so that I can narrow down my search to only those orders in the orders table that belong to that seller_id
    //because this item will only be found in an order that belongs to that seller
    const pre_query = "SELECT seller_id FROM inventory WHERE item_id=$1"
    const pre_values = [req.params.item_id]
    let seller_id;
    client.query(pre_query, pre_values)
        .then(result => {
            if (result.rowCount < 1) {
                res.sendStatus(500)
            } else {
                seller_id = result.rows[0].seller_id

                const query = `SELECT * FROM orders WHERE ${seller_id}=ANY(seller_ids)`
                client.query(query)
                    .then(result => {
                        if (result.rows < 1) {
                            res.sendStatus(204)
                        } else {
                            let final_rows = []
                            for (let i = 0; i < result.rowCount; i++) {
                                let list_of_items = []
                                items_array = result.rows[i].items
                                for (let j = 0; j < items_array.length; j++) {
                                    list_of_items.push(items_array[j][0])
                                    if (items_array[j][0] == req.params.item_id) {
                                        final_rows.push(result.rows[i])
                                        break
                                    }
                                }
                            }
                            res.status(200).json(final_rows).end()
                        }
                    })
                    .catch(err => {
                        res.sendStatus(500)
                        console.log(err)
                    })
            }
        })
        .catch(err => {
            res.sendStatus(500)
        })
})


module.exports = router