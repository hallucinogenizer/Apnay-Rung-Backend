const client = require('./clientConnect')

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
                        console.log(result.rows[i].review[j][1])
                        n = n + 1
                        sum += result.rows[i].review[j][1]
                    }
                }
            }
            let rating = n == 0 ? 0 : (sum / n).toFixed(1)
            resolve(rating)
        } else {
            resolve(0)
        }
    })
}

module.exports = findAvgRating