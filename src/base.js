import TayiWPConst from "./const.js";

export default class TayiWP {
    // callback_name (callback_type + name) => callback_class
    //
    // callback_class.getCallback(flag_args) => {
    //  callback(message, html, data, chat_card, callback_args)
    //  callback_args
    // }
    static HANDLERS_MESSAGE = {};

    static init() {
        Hooks.on('renderChatMessage', (message, html, data) => {
            // 1) определить, что сообщение нужно обработать
            //  - если там есть карточка с названием нашего класса
            //  - если есть флаг с нашим названием
            const chat_card = html.find("." + TayiWPConst.CHAT_CARD_CLASS);
            const flags = data["message"]["flags"];
            if (chat_card.length === 0 || !flags.hasOwnProperty(TayiWPConst.CHAT_DATA_NAME)) {
                return;
            }
            // 2) определить, каким обработчиком нужно обработать сообщение
            //  - если название обработчика (TayiWPFlagsClass.HANDLER_NAME) есть
            //      в списке обработчиков (HANDLERS_MESSAGE)
            const effect_data = flags[TayiWPConst.CHAT_DATA_NAME];
            if (!TayiWP.HANDLERS_MESSAGE.hasOwnProperty(effect_data.HANDLER_NAME)
                || !TayiWP.HANDLERS_MESSAGE[effect_data.HANDLER_NAME]) {
                return;
            }
            // 3) обработать сообщение
            const handler_class = TayiWP.HANDLERS_MESSAGE[effect_data.HANDLER_NAME]; // обработчик
            handler_class.handleMessage(message, html, data, chat_card, effect_data); // обрабатываем сообщение
        });
        Hooks.on('deleteCombat', (combat, options, userId) => {
            const alerts = TurnAlert.getAlerts(combat.id);
            for (const alert of alerts) {
                if (!alert.name.startsWith(TayiWPConst.CHAT_DATA_NAME + "Alert")) {
                    continue;
                }
                TurnAlert.execute(alert);
            }
        });
        Hooks.on('updateToken', (entity, data, options, userId) => {
            if (!(options.hasOwnProperty('x') || options.hasOwnProperty('y'))) {
                return;
            }
            const x = options.hasOwnProperty('x') ? options.x : data.x;
            const y = options.hasOwnProperty('y') ? options.y : data.y;
            // for (const callback_name in TayiWP.CALLBACKS_AURAS) {
            //     if (!TayiWP.CALLBACKS_AURAS.hasOwnProperty(callback_name)) {
            //         continue;
            //     }
            //     const aura_data = TayiWP.CALLBACKS_AURAS[callback_name];
            //     const token_orig = entity.data.tokens.find(t => t._id === aura_data.token_id);
            //     if (!token_orig) {
            //         continue;
            //     }
            //     const dx = (token_orig.x - x) / entity.data.grid * entity.data.gridDistance;
            //     const dy = (token_orig.y - y) / entity.data.grid * entity.data.gridDistance;
            //     const diag = Math.min(dx, dy);
            //     const diag_ft = (diag % 2 === 0) ? diag * 7.5 : (diag - 1) * 7.5 + 5;
            //     const delta_ft = diag_ft + Math.max(dx, dy) * 5;
            //     if (!(delta_ft >= aura_data.distance)) {
            //         continue;
            //     }
            //     const callback_class = aura_data.callback_class;
            //     const callback_data = callback_class.getCallback(aura_data);
            //     callback_data.callback_func(entity, data, options, userId, callback_data.callback_args);
            // }
        });
    }

    static registerCallback(callbackClass) {
        const callbackName = callbackClass.getHandlerName();
        TayiWP.HANDLERS_MESSAGE[callbackName] = callbackClass.getCallbackMessage();
    }

    static async postChatButtonEffect(effectName, effectDesc, funcArgs) {
        const actor = TayiWPConst.ifActor();
        let speaker = { actor: actor, alias: actor.name };
        if (funcArgs['EXPIRED']) {
            speaker = { alias: "Turn Alert" };
            effectDesc += ' EXPIRED';
        }
        const chatData = {
            user: game.user._id,
            speaker: speaker,
            content: '<div class="' + TayiWPConst.CHAT_CARD_CLASS + '"><b>' + effectName + '</b><p>' + effectDesc
            + '</p></div>',
            flags: {}
            // type: CONST.CHAT_MESSAGE_TYPES.OOC
        };
        chatData.flags[TayiWPConst.CHAT_DATA_NAME] = funcArgs;
        await ChatMessage.create(chatData, {});
    }

    static async whenNextTurn(triggerWhen, combatantData, duration, macroName, argsArray) {
        const combatCurrent = TayiWPConst.ifCombat();
        if (!combatCurrent) {
            // saySomething(triggerWhen + combatantData.name + ": " + await textFunc());
            return;
        }

        const combatantTurnIndex = combatCurrent.turns.findIndex(turn => turn.actor.data._id === combatantData._id);
        const combatantTurnId = combatCurrent.turns[combatantTurnIndex]._id;
        const currentTurnIndex = combatCurrent.data.turn;
        const roundNumber = currentTurnIndex < combatantTurnIndex ? 0 : 1;

        const alertData = {
            id: null,
            name: TayiWPConst.CHAT_DATA_NAME + "Alert" + triggerWhen + combatantData._id + macroName,
            combatId: combatCurrent.data._id,
            createdRound: combatCurrent.data.round,
            round: roundNumber,
            roundAbsolute: false,
            turnId: combatantTurnId,
            endOfTurn: triggerWhen === TayiWPConst.COMBAT_TRIGGERS.TURN_END,
            repeating: duration > 1 ? {
                frequency: 1,
                expire: duration,
                expireAbsolute: false
            } : null,
            label: TayiWPConst.CHAT_DATA_NAME + "Alert" + triggerWhen + combatantData._id + macroName,
            message: null,
            recipientIds: [],
            macro: macroName,
            args: argsArray,
            userId: game.userId
        };

        await TurnAlert.create(alertData);
        // await new TurnAlertConfig(alertData).render(true);
    }
}
