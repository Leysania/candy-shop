const DBManager = require('../db/DBManager');
const UserManager = require('../users/UserManager');

const { Markup } = require('telegraf');

const fs = require('fs');
const COMPONENTS = require("../../components/components");

class MessageManager {
    constructor() {
        this.currentMenu = {};
        this.newOrder = {};
        this.orders = [];
        this.designs = [];
        this.isUpload = false;
        this.changeState = null;
        this.userDesign = null;
        this.orderNum = null;
        this.askKey = null;
        this.newOrder = {
            ...COMPONENTS.TELEGRAM.DEFAULT,
        }
        this.exMessage = null;
        this.cancelInProgress = false;
    }

    cancelMessage = async (ctx, isEdit) => { //удаляем кнопки с прошлых сообщений
        this.cancelInProgress = true;
        this.isUpload = false;
        this.changeState = null;
        try {
            if (this.exMessage) {
                if (this.exMessage?.reply_markup && this.exMessage?.reply_markup?.inline_keyboard[0]) {
                    if (!isEdit)
                        await ctx.deleteMessage(this.exMessage?.message_id);
                    else await ctx.telegram.editMessageReplyMarkup(ctx.chat.id, this.exMessage?.message_id, null, Markup.inlineKeyboard([]));
                    this.exMessage = null;
                }
            }
        } catch (e) {
            this.cancelInProgress = false;
            console.log(e);
        }
    }

    auth = async (ctx) => { //Авторизация
        try {
            this.cancelInProgress = true;
            //ctx.update.message.chat.telegram_id = `${ctx.update.message.chat.id}`;
            this.newOrder = {};
            const data = await UserManager.auth(ctx.update.message.chat);

            await ctx.reply('**Привет!**\n\n'
                +
                'Добро пожаловать! Мы рады приветствовать вас в нашем телеграм - боте, где вы можете заказать вкусные торты и капкейки.\n\n'
                +
                '**Как сделать заказ:**\n' +
                'Для оформления заказа просто напишите нам в телеграм и укажите желаемый ассортимент и количество.Мы готовы предложить вам широкий выбор вкусных десертов для любого повода.\n\n'
                +
                '** О нас:**\n'
                +
                'Мы специализируемся на создании уникальных и красиво оформленных десертов, которые подчеркнут особенность вашего праздника.\n\n'
                +
                '**Контактная информация:**\n' +
                'Если у вас возникнут вопросы или вам нужна помощь с выбором, не стесняйтесь обращаться к нам.Мы всегда готовы помочь вам сделать ваше мероприятие по - настоящему волшебным\n\n'
                +
                '** Спасибо, что выбрали нас! **\n' +
                'Правда здесь много народа? Я помогу тебе не потеряться.');

            await this.showStarterKeybord(ctx);
        } catch (e) {
            console.log(e);
            this.cancelInProgress = false;
            await ctx.reply(COMPONENTS.ERROR.BAD_GATEWAY);
        }
    }

    sendContacts = async (ctx) => {
        try {
            ctx.replyWithHTML(
                `<b>Telegram:</b> @nickname \n` +
                `<b>Контактный телефон:</b> +7999-999-99 \n` +
                `<b>Пункт выдачи:</b> г. Ижевск, Удмуртская ул. д. 3 \n` +
                `<b>Оплата:</b> \n` +
                `<b>[ Сбер ]</b> 4809 2908 9794 5467 \n` +
                `<b>[ Тинькофф ]</b> 593 9252 7299 5013 \n` +
                `<b>[ СБП ]</b> +7999-999-99`
            );
        } catch (e) {
            this.cancelInProgress = false;
            await ctx.reply(COMPONENTS.ERROR.BAD_GATEWAY);
        }
    }


    showStarterKeybord = async (ctx) => { //Начальные пункты меню
        try {
            this.askKey = null;
            this.newOrder = {};
            this.cancelInProgress = true;
            await ctx.reply('Выберите пункт в меню', Markup
                .keyboard(COMPONENTS.TELEGRAM.STARTER_KEYBOARD)
                .resize()
            );
        } catch (e) {
            this.cancelInProgress = false;
            await ctx.reply(COMPONENTS.ERROR.BAD_GATEWAY);
        }
    }

    showMenuKeybord = async (ctx) => { //Начальные пункты меню
        try {
            this.cancelInProgress = true;
            await ctx.reply('В нашем меню Вы найдете такие кондитерские изделия, как торты и капкейки', Markup
                .keyboard(COMPONENTS.TELEGRAM.MENU_KEYBOARD)
                .resize()
            );
        } catch (e) {
            console.log(e);
            this.cancelInProgress = false;
            await ctx.reply(COMPONENTS.ERROR.BAD_GATEWAY);
        }
    }

    startCakeAssembly = async (ctx) => {
        try {
            this.newOrder = {
                ...COMPONENTS.TELEGRAM.DEFAULT_CAKE,
                product_type: 'Торт'
            }
            this.userDesignPath = null
            await this.askProductParam(ctx, 'Укажите вес торта в граммах (например 1000):', null, 'weight');
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERROR.BAD_GATEWAY);
        }
    }

    askProductParam = async (ctx, text, keyboard, askKey) => {
        try {
            this.askKey = askKey;
            if (!keyboard) {
                askKey === 'weight' ? await ctx.reply(text, Markup
                    .keyboard(COMPONENTS.TELEGRAM.CANCEL_KEYBOARD)
                    .resize()) :
                    await ctx.reply(text);
            }
            else {
                const data = await ctx.replyWithHTML(
                    text,
                    { parse_mode: 'HTML', ...Markup.inlineKeyboard(keyboard) }
                );
                this.exMessage = data;
            }
        } catch (e) {
            console.log(e);
            ctx.reply(COMPONENTS.ERROR.BAD_GATEWAY);
        }
    }

    switchPortfolio = async (ctx, count) => {
        this.listNum += count;
        if (this.listNum >= this.designs.length)
            this.listNum = 0;
        else if (this.listNum < 0)
            this.listNum = this.designs.length - 1;
        this.showPortfolio(ctx, this.listNum);
    }

    showPortfolio = async (ctx, listNum) => {
        try {
            this.listNum = listNum;
            if (!this.designs[0]) {
                const portfolio = await DBManager.getPortfolio();
                console.log(portfolio);
                this.designs = portfolio;
            }

            if (this.designs[0]) {
                const keyboard = Markup.inlineKeyboard(COMPONENTS.TELEGRAM.PORTFOLIO_BUTTONS(`${this.listNum + 1}/${this.designs.length}`));
                const data = await ctx.telegram.sendPhoto(ctx.chat.id,
                    this.designs[this.listNum].photo_path ? {
                        source: fs.createReadStream(`${this.designs[this.listNum].photo_path}`) //ex 'assets/cake.jpg'
                    } : {},
                    {
                        ...keyboard
                    }
                );
                this.exMessage = data;
            }
        } catch (e) {
            console.log(e);
            this.cancelInProgress = false;
            ctx.reply(COMPONENTS.ERROR.BAD_GATEWAY);
        }
    }


    switchDesign = async (ctx, count) => {
        this.listNum += count;
        if (this.listNum >= this.designs.length)
            this.listNum = 0;
        else if (this.listNum < 0)
            this.listNum = this.designs.length - 1;
        this.showDesign(ctx, this.listNum, 'enter_d')
    }

    uploadDesignNotice = async (ctx) => {
        this.isUpload = true;
        ctx.reply('Загрузите свой дизайн');
    }

    insertUserDesign = async (ctx, fileId) => {
        const design = await DBManager.insertUserDesign(this.newOrder.product_type, fileId);
        console.log(design);
        this.newOrder.design = design;
        this.newOrder.design.characters = [];
        this.newOrder.design.file_id = fileId;
        await this.showOrderInfo(ctx);
    }

    showDesign = async (ctx, listNum, askKey) => {
        try {
            this.listNum = listNum;
            this.askKey = askKey;
            if (!this.designs[0]) {
                const designs = await DBManager.getDefaultDesigns();
                this.designs = designs;
            }
            if (this.designs[0]) {
                const keyboard = Markup.inlineKeyboard(COMPONENTS.TELEGRAM.DESIGN_BUTTONS(`${this.listNum + 1}/${this.designs.length}`));
                this.newOrder.design = this.designs[listNum].design;
                console.log(this.designs[listNum].design)
                const ingredients = this.designs[listNum].design.characters.filter(ingredient => ingredient?.name === 'Ингредиент');
                const price = this.designs[listNum].design.characters.filter(ingredient => ingredient?.name === 'Цена');

                const data = await ctx.telegram.sendPhoto(ctx.chat.id,
                    {
                        source: fs.createReadStream(`${this.designs[this.listNum]?.design?.photo_path}`) //ex 'assets/speaker.jpg'
                    },
                    {
                        caption:
                            `<b>Цена:</b> ${price.map(ingredient => ingredient?.value)}\n` +
                            `<b>Ингредиенты:</b>\n${ingredients.map((ingredient, index) => ingredient?.value)
                                .join('\n')}`,
                        parse_mode: 'HTML',
                        ...keyboard
                    }
                );
                this.exMessage = data;
            }
        } catch (e) {
            console.log(e);
            this.cancelInProgress = false;
            ctx.reply(COMPONENTS.ERROR.BAD_GATEWAY);
        }
    }

    updateOrderState = async (ctx, state) => {
        this.changeState = state;
        if (state !== 'date_value')
            await ctx.reply('Введите номер заказа');
        else await ctx.reply('Введите новую дату получения заказа в формате ДД.ММ ЧЧ:ММ (Например 31.12 09:30)');
    }

    cancelOrder = async (ctx, orderNum, telegramId) => {
        try {
            const user = await DBManager.getUserByTelegramId(telegramId);
            if (user) {
                const order = await DBManager.getOrder(orderNum, user.id);
                if (order) {
                    await DBManager.cancelOrderById(order.id);
                    await ctx.reply('Ваш заказ "' + orderNum + '" отменен');
                    this.sendChangeOrderDataToAllAdmins(ctx, 'Заказ #' + orderNum + ' отменен');
                } else
                    await ctx.reply('Ваш заказ не найден');
            }
        } catch (e) {
            console.log(e);
        }

    }

    updateOrderDate = async (ctx, date, telegramId) => {
        try {
            const user = await DBManager.getUserByTelegramId(telegramId);
            if (user) {
                const order = await DBManager.getOrder(this.orderNum, user.id);
                if (order) {
                    await DBManager.updateOrderDateById(order.id, date);
                    await ctx.reply('Дата Вашего заказа ' + this.orderNum + ' изменена на: ' + date);
                    this.sendChangeOrderDataToAllAdmins(ctx, 'Дата заказа #' + this.orderNum + ' изменена на: ' + date);
                } else
                    await ctx.reply('Ваш заказ не найден');
            }
            await ctx.reply('Дата вашего заказа');
        } catch (e) {
            console.log(e);
        }
    }


    showOrderInfo = async (ctx, username = null, chat_id = null) => {
        const keyboard = !username ? Markup.inlineKeyboard(COMPONENTS.TELEGRAM.ORDER) : Markup.inlineKeyboard([]);
        const ingredients = this.newOrder.design?.characters.filter(ingredient => ingredient?.name === 'Ингредиент');
        const design_price = this.newOrder.design?.characters.filter(ingredient => ingredient?.name === 'Цена');
        const price = this.getPrice(this.newOrder, design_price[0]?.value);
        this.newOrder.price = price;
        const data = await ctx.telegram.sendPhoto(chat_id ? chat_id : ctx.chat.id,
            this.newOrder.design?.file_id ?
                this.newOrder.design?.file_id :
                {
                    source: fs.createReadStream(`${this.designs[this.listNum]?.design?.photo_path}`), //ex 'assets/сake.jpg'
                    filename: 'image.jpg'
                },
            {
                caption:
                    `${username ? `<b>Клиент:</b> @${username} \n` : ''}` +
                    `${this.newOrder.order_num ? '<b>Номер заказа:</b> ' + this.newOrder.order_num + ' \n' : ''} ` +
                    `<b> Дата выдачи:</b> ${this.newOrder.date} \n` +
                    `<b> Ваш заказ</b> \n` +
                    `<b> Изделие:</b> ${this.newOrder.product_type}, ${this.newOrder.weight} гр; \n` +
                    `<b> Диаметр:</b> ${this.newOrder.width}; \n` +
                    `<b> Высота:</b> ${this.newOrder.height}; \n` +
                    `<b> Бисквит:</b> ${this.newOrder.biscuit}; \n` +
                    `<b> Начинка:</b> ${this.newOrder.feel}; \n` +
                    `<b> Крем:</b> ${this.newOrder.cream}; \n` +
                    (!this.newOrder.design?.file_id ? (
                        `<b> Декор</b> \n` +
                        `<b> Цена:</b> ${design_price.map(ingredient => ingredient?.value)} \n` +
                        `<b> Ингредиенты:</b > \n${ingredients.map((ingredient, index) => ingredient?.value)
                            .join('\n')
                        } \n`) : '') +
                    `<b> Итого к оплате:</b> ${price} \n`,
                parse_mode: 'HTML',
                ...keyboard,
            }
        );
        this.exMessage = data;
    }

    isValidDate(str) {
        // Разделить строку на дату и время
        const [date, time] = str.split(' ');

        // Проверить формат даты
        const dateRegex = /^(?:3[01]|[12][0-9]|0?[1-9]).(?:1[0-2]|0?[1-9]).$/;
        if (!dateRegex.test(date)) {
            return false;
        }

        // Проверить формат времени
        const timeRegex = /^(?:2[0-3]|[01][0-9]):[0-5][0-9]$/;
        if (!timeRegex.test(time)) {
            return false;
        }

        // Вернуть true, если оба формата верны
        return true;
    }

    updatePrevOrder = async (ctx, value) => {
        try {

            if (
                (((this.askKey === 'weight') || (this.askKey === 'width') || (this.askKey === 'height'))
                    && !isNaN(Number(value)))
                || (this.askKey === 'date' && this.isValidDate(value))
                || (this.askKey === 'biscuit'
                    || this.askKey === 'feel'
                    || this.askKey === 'cream'
                    || this.askKey === 'design'
                    || this.askKey === 'enter_d')
            ) {
                if (this.askKey !== 'design' && this.askKey !== 'enter_d') {
                    this.newOrder[this.askKey] = value;
                }

                switch (this.askKey) {
                    case 'weight': await this.askProductParam(ctx, 'Укажите диаметр торта в сантиметрах (Например 30):', null, 'width'); break;
                    case 'width': await this.askProductParam(ctx, 'Укажите высоту торта в сантиметрах (Например 20):', null, 'height'); break;
                    case 'height': await this.askProductParam(ctx, 'Выберите бисквит', COMPONENTS.TELEGRAM.BISCUIT_BUTTONS, 'biscuit'); break;
                    case 'biscuit': await this.askProductParam(ctx, 'Выберите начинку', COMPONENTS.TELEGRAM.FEEL_BUTTONS, 'feel'); break;
                    case 'feel': await this.askProductParam(ctx, 'Выберите крем', COMPONENTS.TELEGRAM.CREAM_BUTTONS, 'cream'); break;
                    case 'cream': await this.askProductParam(ctx, 'Укажите дату в формате ДД.ММ ЧЧ:ММ (Например 31.12 09:30):', null, 'date'); break;
                    case 'date': await this.showDesign(ctx, 0, 'enter_d'); break;
                    case 'enter_d': await this.showOrderInfo(ctx); break;
                }

            } else
                ctx.reply('Отправьте сообщение в корректном формате');
        } catch (e) {
            console.log(e);
            ctx.reply(COMPONENTS.ERROR.BAD_GATEWAY);
        }
    }

    generateOrderNum = async () => {
        try {
            let number = '';
            for (let i = 0; i < 8; i++) {
                const randomIndex = Math.floor(Math.random() * COMPONENTS.CHARACTERS.length);
                number += COMPONENTS.CHARACTERS.charAt(randomIndex);
            }
            const order = await DBManager.getOrderByNum(number);
            if (order)
                await this.generateOrderNum();
            else
                return number;
        } catch (e) {
            console.log(e);
        }

    }

    showOrderType = async (ctx, order) => {
        await ctx.replyWithHTML(
            `<b> Ваш номер заказа:</b> ${order.order_num} \n` +
            `<b> Изделие:</b> ${order.product_type}, ${order.weight} гр; \n` +
            `<b> Дата выдачи:</b> ${order.date} \n`
        );
    }

    showOrders = async (ctx, telegram_id) => {
        try {
            const user = await DBManager.getUserByTelegramId(telegram_id);
            const orders = await DBManager.getOrdersByUserId(user.id);
            orders.forEach(async order => {
                await this.showOrderType(ctx, order)
            });
            await ctx.reply('Для отмены заказа или изменения даты выдачи выберите соответствующий пункт меню и укажите номер заказа', Markup
                .keyboard(COMPONENTS.TELEGRAM.ORDERS_EDITOR_KEYBOARD)
                .resize())
            console.log(orders);
        } catch (e) {
            console.log(e);
        }

    }

    sendText = async (ctx, text, adminId) => {
        await ctx.telegram.sendMessage(adminId, text);;
    }

    sendChangeOrderDataToAllAdmins = async (ctx, text) => {
        const username = ctx.update.message.from.username;
        const admins = await DBManager.getAllAdmins();

        for (let admin of admins) {
            await this.sendText(ctx, `Клиент: @${username} \n` + text, Number(admin.telegram_id))
        }
    }

    sendOrderToAllAdmins = async (ctx) => {
        const username = ctx.update.callback_query.from.username;
        const admins = await DBManager.getAllAdmins();
        console.log(admins);
        for (let admin of admins) {
            await this.showOrderInfo(ctx, username, Number(admin.telegram_id))
        }
    }

    getOrderIngredients(order) {
        const { product_type, order_num, design, date, ...rest } = order;
        return Object.entries(rest);
    }

    getPrice(order, designPrice) {
        if (designPrice)
            return (Number(order.weight) / 1000 * 1500) + (Number(designPrice) * Number(order.weight) / 1000) + ((Number(order.width) + Number(order.height) - 21) * 100);
        else return (Number(order.weight) / 1000 * 1500) + ((Number(order.width) + Number(order.height) - 21) * 100);
    }

    insertOrder = async (ctx) => {
        try {
            const orderNum = await this.generateOrderNum();
            if (orderNum) {
                const product = await DBManager.insertProduct(this.newOrder.product_type, this.newOrder.design.id);
                const ingredients = this.getOrderIngredients(this.newOrder);
                console.log(ingredients);
                ingredients.forEach(async ingredient => {
                    console.log(ingredient);
                    await DBManager.insertProductCharacters(product.id, COMPONENTS.ORDER.CAKE_CHARACTERS[ingredient[0]], ingredient[1])
                });
                this.newOrder.order_num = orderNum;
                const user = await DBManager.getUserByTelegramId(ctx.update.callback_query.from.id);
                await DBManager.createOrder(orderNum, user.id, product.id, this.newOrder.date);
                await this.showOrderType(ctx, this.newOrder);
                await this.sendOrderToAllAdmins(ctx);
                await ctx.reply(`С Вами скоро свяжутся для подтверждения заказа`, Markup
                    .keyboard(COMPONENTS.TELEGRAM.STARTER_KEYBOARD)
                    .resize());
            }
        } catch (e) {
            console.log(e);
        }
    }
}

module.exports = MessageManager;