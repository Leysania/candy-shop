const DBManager = require("../db/DBManager");

class UserManager {
    async auth(data) {
        try {
            const userId = await DBManager.getUserByTelegramId(data.id);
            if (userId)
                return true;
            else {
                await DBManager.insertUser(data);
                return false;
            };
        } catch (e) {
            console.log(e);
        }

    }
}

module.exports = new UserManager();