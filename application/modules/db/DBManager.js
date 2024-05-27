const pool = require("./DB");

class DBManager {

    async dbQuery(query, values = []) {
        try {
            const res = await pool.query(query, values);
            return res.rows[0];
        } catch (err) {
            console.error(err);
            return err;
        }
    }

    async dbQueryAll(query, values = []) {
        try {
            const res = await pool.query(query, values);
            return res.rows;
        } catch (err) {
            console.error(err);
            return err;
        }
    }

    ////////////////////////////////////////////
    ////////// ABOUT USERS ////////////////////////
    getUserByTelegramId = async (telegram_id) => {
        const query = `SELECT telegram_id, id FROM users WHERE telegram_id = $1`;
        const values = [telegram_id];
        const answer = await this.dbQuery(query, values);
        return answer;
    }

    insertUser = async ({ id, last_name, first_name, username }) => {
        const query = `INSERT INTO users (telegram_id, last_name, first_name, username) VALUES($1, $2, $3, $4) RETURNING *`;
        const values = [id, last_name, first_name, username];
        const answer = await this.dbQuery(query, values);
        return answer;
    }

    getAllAdmins = async () => {
        const query = `SELECT telegram_id FROM users WHERE admin = true`;
        const values = [];
        const answer = await this.dbQueryAll(query, values);
        return answer;
    }

    ////////////////////////////////////////////
    ////////// ABOUT DESIGNS ////////////////////////

    getDefaultDesigns = async () => {
        const query = `SELECT
        json_build_object(
            'id', designs.id,
            'photo_path', designs.photo_path,
            'characters', json_agg(
                json_build_object(
                    'id', design_characters.id,
                    'design_id', design_characters.design_id,
                    'name', design_characters.name,
                    'value', design_characters.value
                )
            )
        ) AS design
        FROM designs
        JOIN design_characters ON designs.id = design_characters.design_id 
        WHERE designs.standard = true AND designs.product_type = 'Торт'
        GROUP BY designs.id;`;
        const values = [];
        const answer = await this.dbQueryAll(query, values);
        return answer;
    }

    insertUserDesign = async (productType, photoPath) => {
        const query = `INSERT INTO designs (product_type, photo_path) VALUES($1, $2) RETURNING *`;
        const values = [productType, photoPath];
        const answer = await this.dbQuery(query, values);
        return answer;
    }

    ////////////////////////////////////
    //// ABOUT ORDERS //////////////////
    getOrderByNum = async (number) => {
        const query = `SELECT id FROM orders WHERE number = $1`;
        const values = [number];
        const answer = await this.dbQuery(query, values);
        return answer;
    }

    getOrder = async (orderNum, userId) => {
        const query = `SELECT id FROM orders WHERE number = $1 AND user_id = $2`;
        const values = [orderNum, userId];
        const answer = await this.dbQuery(query, values);
        return answer;
    }

    cancelOrderById = async (orderId) => {
        const query = `DELETE FROM orders WHERE id = $1`;
        const values = [orderId];
        const answer = await this.dbQuery(query, values);
        return answer;
    }

    updateOrderDateById = async (orderId, date) => {
        const query = `UPDATE orders SET delivery_date = $2 WHERE id = $1`;
        const values = [orderId, date];
        const answer = await this.dbQuery(query, values);
        return answer;
    }

    getOrdersByUserId = async (userId) => {
        const query = `SELECT
        orders.id,
        orders.number AS order_num,
        orders.user_id,
        orders.product_id,
        orders.delivery_date AS date,
        products.product_type,
        characters.value AS weight 
        FROM orders 
        JOIN products ON orders.product_id = products.id 
        JOIN characters ON products.id = characters.product_id AND characters.name = 'Вес' 
        WHERE  orders.user_id = $1;`;
        const values = [userId];
        const answer = await this.dbQueryAll(query, values);
        return answer;
    }

    insertProduct = async (product_type, design_id) => {
        const query = `INSERT INTO products (product_type, design_id) VALUES($1, $2) RETURNING id`;
        const values = [product_type, design_id];
        const answer = await this.dbQuery(query, values);
        return answer;
    }

    insertProductCharacters = async (product_id, character, value) => {
        const query = `INSERT INTO characters (product_id, name, value) VALUES($1, $2, $3) RETURNING id`;
        const values = [product_id, character, value];
        const answer = await this.dbQuery(query, values);
        return answer;
    }

    createOrder = async (order_num, user_id, product_id, date) => {
        const query = `INSERT INTO orders (number, user_id, product_id, delivery_date) VALUES($1, $2, $3, $4) RETURNING id`;
        const values = [order_num, user_id, product_id, date];
        const answer = await this.dbQuery(query, values);
        return answer;
    }

    //////////////////////////////////////////
    ////// ABOUT PORTFOLIO ///////////////
    getPortfolio = async () => {
        const query = `SELECT photo_path FROM portfolio`;
        const values = [];
        const answer = await this.dbQueryAll(query, values);
        return answer;
    }

}

module.exports = new DBManager();