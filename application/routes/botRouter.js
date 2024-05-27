const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');

const MessageManager = require('../modules/telegram/MessageManager');
const UserManager = require('../modules/users/UserManager');
const COMPONENTS = require('../components/components');

const users = {};
const bot = new Telegraf(process.env.BOT_TOKEN);

async function checkUser(telegramId, chat) {
    if (!users[telegramId])
        users[telegramId] = new MessageManager();

    if (chat) {
        try {
            const data = await UserManager.auth(chat);
        } catch (e) {
            console.log(e);
        }
    }
}

async function callFunction(user, ctx, func, isEdit = false) {
    try {
        user.cancelInProgress = true;
        user.cancelMessage(ctx, isEdit).then(() => {
            if (func)
                func().then(() => {
                    user.cancelInProgress = false;
                })
            else user.cancelInProgress = false;
        })
    } catch (e) {
        console.log(e);
        user.cancelInProgress = false;
    }
}

bot.start(async (ctx) => {
    const chat_id = ctx.update.message.chat.id;
    if (!users[chat_id])
        users[chat_id] = new MessageManager();
    await callFunction(users[chat_id], ctx, () => users[chat_id].auth(ctx));
});

bot.hears(COMPONENTS.TELEGRAM.HEARS.TITLES.CAKES, async (ctx) => {
    const chat_id = ctx.update.message.chat.id;
    checkUser(chat_id, ctx.update.message.chat);
    if (!users[chat_id].cancelInProgress)
        await callFunction(users[chat_id], ctx, () => users[chat_id].startCakeAssembly(ctx));
    else ctx.reply('Дождитесь ответа на прошлый запрос');
});



bot.on(message('text'), async (ctx) => {
    try {
        const chat_id = ctx?.update?.message?.chat?.id;
        checkUser(chat_id, ctx.update.message.chat);
        if (!users[chat_id].cancelInProgress) {
            if (users[chat_id].changeState) {
                if (users[chat_id].changeState === 'delete')
                    return await callFunction(users[chat_id], ctx, () => users[chat_id].cancelOrder(ctx, ctx.update.message.text, chat_id));
                else if (users[chat_id].changeState === 'date') {
                    users[chat_id].orderNum = ctx.update.message.text;
                    return await callFunction(users[chat_id], ctx, () => users[chat_id].updateOrderState(ctx, 'date_value'));
                }
                else if (users[chat_id].changeState === 'date_value') {
                    return await callFunction(users[chat_id], ctx, () => users[chat_id].updateOrderDate(ctx, ctx.update.message.text, chat_id));
                }
            }
            if (ctx.update.message.text === COMPONENTS.TELEGRAM.HEARS.TITLES.CANCEL ||
                ctx.update.message.text === COMPONENTS.TELEGRAM.HEARS.TITLES.BACK) {
                return await callFunction(users[chat_id], ctx, () => users[chat_id].showStarterKeybord(ctx));
            }
            else if (ctx.update.message.text === COMPONENTS.TELEGRAM.HEARS.TITLES.MENU || ctx.update.message.text === '/menu') {
                return await callFunction(users[chat_id], ctx, () => users[chat_id].showMenuKeybord(ctx));
            }
            else if (ctx.update.message.text === COMPONENTS.TELEGRAM.HEARS.TITLES.PORTFOLIO || ctx.update.message.text === '/portfolio') {
                return await callFunction(users[chat_id], ctx, () => users[chat_id].showPortfolio(ctx, 0));
            }
            else if (ctx.update.message.text === COMPONENTS.TELEGRAM.HEARS.TITLES.ORDERS || ctx.update.message.text === '/orders') {
                return await callFunction(users[chat_id], ctx, () => users[chat_id].showOrders(ctx, chat_id));
            }
            else if (ctx.update.message.text === COMPONENTS.TELEGRAM.HEARS.TITLES.CONTACTS || ctx.update.message.text === '/contacts') {
                return await callFunction(users[chat_id], ctx, () => users[chat_id].sendContacts(ctx));
            }
            else if (ctx.update.message.text === COMPONENTS.TELEGRAM.HEARS.TITLES.DATE) {
                return await callFunction(users[chat_id], ctx, () => users[chat_id].updateOrderState(ctx, 'date'));
            }
            else if (ctx.update.message.text === COMPONENTS.TELEGRAM.HEARS.TITLES.CANCEL_BY_NUM) {
                return await callFunction(users[chat_id], ctx, () => users[chat_id].updateOrderState(ctx, 'delete'));
            }
            else if (users[chat_id].askKey) {
                return await callFunction(users[chat_id], ctx, () => users[chat_id].updatePrevOrder(ctx, ctx.update.message.text));
            }
        } else {
            ctx.reply('Дождитесь ответа на прошлый запрос');
        }
    } catch (e) {
        console.log(e);
    }
});

bot.on('message', async (ctx) => {
    if (ctx.message.photo) {
        try {
            // Сохранение изображения на сервере
            const chat_id = ctx?.update?.message?.chat?.id;
            checkUser(chat_id);
            if (!users[chat_id].cancelInProgress) {
                if (users[chat_id].isUpload) {

                    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

                    await callFunction(users[chat_id], ctx, () => users[chat_id].insertUserDesign(ctx, fileId))
                }
                else ctx.reply('Дождитесь ответа на прошлый запрос');
            }
        } catch (error) {
            console.error('Ошибка при сохранении изображения:', error);
        }
    }
});

bot.on('callback_query', async (ctx) => {
    try {
        const chat_id = ctx.update.callback_query.from.id
        checkUser(chat_id);
        if (!users[chat_id].cancelInProgress) {
            if (ctx.update.callback_query.data === 'next_p') {
                await callFunction(users[chat_id], ctx, () => users[chat_id].switchPortfolio(ctx, 1))
            } else if (ctx.update.callback_query.data === 'ex_p') {
                await callFunction(users[chat_id], ctx, () => users[chat_id].switchPortfolio(ctx, -1))
            }
            if (users[chat_id].askKey) {
                if (ctx.update.callback_query.data === 'upload_d') {
                    await callFunction(users[chat_id], ctx, () => users[chat_id].uploadDesignNotice(ctx))
                } else if (ctx.update.callback_query.data === 'next_d') {
                    await callFunction(users[chat_id], ctx, () => users[chat_id].switchDesign(ctx, 1))
                } else if (ctx.update.callback_query.data === 'ex_d') {
                    await callFunction(users[chat_id], ctx, () => users[chat_id].switchDesign(ctx, -1))
                } else if (ctx.update.callback_query.data === 'insert_order') {
                    await callFunction(users[chat_id], ctx, () => users[chat_id].insertOrder(ctx), true)
                } else if (ctx.update.callback_query.data === 'cancel_order') {
                    await callFunction(users[chat_id], ctx, () => users[chat_id].showStarterKeybord(ctx))
                } else
                    await callFunction(users[chat_id], ctx, () => users[chat_id].updatePrevOrder(ctx, COMPONENTS.TELEGRAM.CALLBACKS[ctx.callbackQuery.data]))
            }
        }
        else ctx.reply('Дождитесь ответа на прошлый запрос');
    } catch (e) {
        console.log(e);
    }
})

bot.command('quit', async (ctx) => {
    await ctx.telegram.leaveChat(ctx.message.chat.id);
    await ctx.leaveChat();
});

bot.on('inline_query', async (ctx) => {
    const result = []
    await ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result)
    await ctx.answerInlineQuery(result)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
//END SOMETHING ELSE

module.exports = bot;