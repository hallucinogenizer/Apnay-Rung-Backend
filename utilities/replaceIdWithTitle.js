const client = require('./clientConnect')

function replaceIdWithTitle(result, res) {
    let promises = []
    result.rows.forEach((row, index1) => {
        const { items } = row
        items.forEach((item, index2) => {
            const item_id = item[0];
            const title_query = "SELECT title FROM inventory WHERE item_id=$1"
            const title_values = [item_id]
            promises.push(new Promise(function(resolve, reject) {
                client.query(title_query, title_values, (err, title_result) => {
                    if (result.rowCount < 1) {
                        res.sendStatus(500)
                        reject()
                    } else {
                        resolve()
                        result.rows[index1].items[index2][0] = title_result.rows[0].title
                    }
                })
            }))
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