const { Markup } = require("telegraf");

const TITLES = {
    MENU: '📋 Меню',
    CONTACTS: '👤 Контакты',
    ORDERS: '❤️ Мои заказы',
    PORTFOLIO: '✨ Портфолио',
    CAKES: '🍰 Торты',
    CUPCAKES: '🧁 Капкейки',
    CANCEL: '❌ Отменить оформление',
    DATE: '🕓 Изменить дату',
    BACK: '↩️ Назад',
    CANCEL_BY_NUM: '❌ Отменить заказ'
}

const INGREDIENTS = {
    vanilla_b: 'Ванильный',
    chocolate_b: 'Шоколадный',
    strawberry_f: 'Клубничное конфи',
    cherry_f: 'Вишневое конфи',
    milk_c: 'Крем-чиз молочный',
    chocolate_c: 'Шоколадный',
    enter_d: 'Подтвердить'
}

const CHARACTERS = {
    weight: 'Вес',
    width: 'Диаметр',
    height: 'Высота',
    biscuit: 'Бисквит',
    feel: 'Начинка',
    cream: 'Крем',
    price: 'Цена'
}

const COMPONENTS = {
    TELEGRAM: {
        STARTER_KEYBOARD: [
            [{ text: TITLES.MENU }, { text: TITLES.ORDERS }], // Первая строка кнопок из двух кнопок
            [{ text: TITLES.CONTACTS }, { text: TITLES.PORTFOLIO }], // Вторая строка
        ],
        MENU_KEYBOARD: [
            [{ text: TITLES.CAKES }, { text: TITLES.CUPCAKES }],
            [{ text: TITLES.BACK }]
        ],
        CANCEL_KEYBOARD: [
            [{ text: TITLES.CANCEL }],
        ],
        ORDERS_EDITOR_KEYBOARD: [
            [{ text: TITLES.BACK }, { text: TITLES.CANCEL_BY_NUM }],
            [{ text: TITLES.DATE }],
        ],
        BISCUIT_BUTTONS: [
            Markup.button.callback(INGREDIENTS[`vanilla_b`], `vanilla_b`),
            Markup.button.callback(INGREDIENTS[`chocolate_b`], `chocolate_b`)
        ],
        FEEL_BUTTONS: [
            Markup.button.callback(INGREDIENTS[`strawberry_f`], `strawberry_f`),
            Markup.button.callback(INGREDIENTS[`cherry_f`], `cherry_f`)
        ],
        CREAM_BUTTONS: [
            Markup.button.callback(INGREDIENTS[`milk_c`], `milk_c`),
            Markup.button.callback(INGREDIENTS[`chocolate_c`], `chocolate_c`)
        ],
        DESIGN_BUTTONS: (listNum) => [
            [
                Markup.button.callback('Загрузить свой дизайн', `upload_d`),
            ],
            [
                Markup.button.callback('« Назад', `ex_d`),
                Markup.button.callback(listNum, `list_num_d`),
                Markup.button.callback('Вперед »', `next_d`),
            ],
            [
                Markup.button.callback('Выбрать', `enter_d`),
            ]
        ],
        PORTFOLIO_BUTTONS: (listNum) => [
            [
                Markup.button.callback('« Назад', `ex_p`),
                Markup.button.callback(listNum, `list_num_p`),
                Markup.button.callback('Вперед »', `next_p`),
            ],
        ],
        ORDER: [
            [
                Markup.button.callback('Заказать', `insert_order`),
                Markup.button.callback('Отменить', `cancel_order`)
            ],
        ],
        CALLBACKS: {
            ...INGREDIENTS
        },
        HEARS: {
            TITLES: { ...TITLES },
        }
    },
    ORDER: {
        DEFAULT_CAKE: {
            order_num: null,
            product_type: null,
            weight: null,
            width: null,
            height: null,
            biscuit: null,
            feel: null,
            cream: null,
            design: null,
            date: null
        },
        CAKE_CHARACTERS: {
            ...CHARACTERS
        }
    },
    ERROR: {
        BAD_GATEWAY: 'Ошибка обработки сообщения'
    },
    CHARACTERS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
}

module.exports = COMPONENTS;