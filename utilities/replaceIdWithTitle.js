const client = require('./clientConnect')

function replaceIdWithTitle(result, res) {
    let promises = []
    result.rows.forEach((row, index1) => {
        const { items } = row
        items.forEach((item, index2) => {
            const item_id = item[0];
            if (item_id != undefined) {
                const title_query = "SELECT title,image FROM inventory WHERE item_id=$1"
                const title_values = [item_id]
                promises.push(new Promise(function(resolve, reject) {
                    client.query(title_query, title_values, (err, title_result) => {
                        if (title_result.rowCount < 1) {
                            console.log("Not found:", item_id)
                            reject()
                        } else {
                            result.rows[index1].items[index2][0] = title_result.rows[0].title
                            result.rows[index1].image = title_result.rows[0].image
                            resolve()
                        }
                    })
                }))
            }
        })
    })

    Promise.all(promises).then(() => {
            res.status(200).json(result.rows)
        })
        .catch(err => {
            res.sendStatus(500)
            console.log(err)
        })
}

module.exports = replaceIdWithTitle