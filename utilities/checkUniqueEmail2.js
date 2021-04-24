const client = require('./clientConnect')

//this excludes the currently logged in user from the unique email constraint check
const checkUniqueEmail2 = async(email, usertype, user_id) => {

    let query, values;
    if (usertype == 'customer') {
        query = "SELECT customer_id FROM customers WHERE email=$1 AND customer_id!=$2"
        values = [email, user_id]
    }
    let result = await client.query(query, values)
    if (result.rowCount > 0) {
        return false
    } else {

        if (usertype == 'seller') {
            query = "SELECT seller_id FROM sellers WHERE email=$1 AND seller_id != $2"
            values = [email, user_id]
        }
        result = await client.query(query, values)
        if (result.rowCount > 0) {
            return false
        } else {

            if (usertype == 'admin') {
                query = "SELECT admin_id FROM admins WHERE email=$1 AND admin_id != $2"
                values = [email, user_id]
            }
            result = await client.query(query, values)
            if (result.rowCount > 0) {
                return false
            } else {
                return true
            }
        }
    }
}

module.exports = checkUniqueEmail2