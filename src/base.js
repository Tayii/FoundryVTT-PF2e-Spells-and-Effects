import TayiWPConst from "./const.js";

export default class TayiWP {
    static CHAT_CARD_CLASS = "tayi-wp-macro";
    static CHAT_DATA_NAME = "tayiwp";
    // static CHAT_DATA_CALLBACK = "tayiwp_callback";
    static SPELL_CALLBACKS = {};
    static FEAT_CALLBACKS = {};

    static init() {
        Hooks.on('renderChatMessage', (message, html, data) => {
            const chatCard = html.find("." + TayiWP.CHAT_CARD_CLASS);
            const flags = data["message"]["flags"];
            if (chatCard.length === 0 || !flags.hasOwnProperty(TayiWP.CHAT_DATA_NAME)) {
                return;
            }
            const funcArgs = flags[TayiWP.CHAT_DATA_NAME];
            const myData = TayiWP[funcArgs.getClass().CALLBACK_TYPE + '_CALLBACKS'][funcArgs.CALLBACK_NAME]
                .getCallback(funcArgs);
            myData['callback'](message, html, data, chatCard, myData['callbackArgs']);
        });
        Hooks.on('deleteCombat', (combat, options, userId) => {
            const alerts = TurnAlert.getAlerts(combat.id);
            for (let alertId in alerts) {
                if (!alerts.hasOwnProperty(alertId) || !alerts[alertId].name.startsWith(TayiWP.CHAT_DATA_NAME + "Alert")) {
                    continue;
                }
                TurnAlert.execute(alerts[alertId]);
            }
        });
    }

    static callbackGradeEffect(message, html, data, chatCard, tayiWPdata) {
        const funcArgs = tayiWPdata['funcArgs'];
        const applyFunc = tayiWPdata['applyFunc'];
        for (let gradeLevel in funcArgs.grades) {
            if (!funcArgs.grades.hasOwnProperty(gradeLevel)) {
                continue;
            }
            const btn = $(`<button>Apply ` + TayiWPConst.GRADE_NAMES[gradeLevel] + `</button>`);
            chatCard.find('[data-grade="' + gradeLevel + '"]').after(btn);
            btn.click(async ev => {
                ev.stopPropagation();
                await applyFunc(funcArgs, gradeLevel);
            });
        }
        const btn2 = $(`<button>Remove effect</button>`);
        const removeFunc = tayiWPdata['removeFunc'];
        chatCard.append(btn2);
        btn2.click(async ev => {
            ev.stopPropagation();
            await removeFunc(funcArgs);
        });
    }

    static callbackSpellEffect(message, html, data, chatCard, tayiWPdata) {
        const btn = $(`<button>Apply effect</button>`);
        const btn2 = $(`<button>Remove effect</button>`);
        const applyFunc = tayiWPdata['applyFunc'];
        const removeFunc = tayiWPdata['removeFunc'];
        const funcArgs = tayiWPdata['funcArgs'];
        chatCard.append(btn);
        chatCard.append(btn2);
        btn.click(async ev => {
            ev.stopPropagation();
            await applyFunc(funcArgs);
        });
        btn2.click(async ev => {
            ev.stopPropagation();
            await removeFunc(funcArgs);
        });
    }

    static ifActor() {
        const actor = game.actors.get(ChatMessage.getSpeaker().actor);
        if (actor) {
            return actor;
        }
        ui.notifications.error("You must have an actor selected.");
        return false;
    }

    static ifToken() {
        const token = canvas.tokens.get(ChatMessage.getSpeaker().token);
        if (token) {
            return token;
        }
        ui.notifications.error("You must have an token selected.");
        return false;
    }

    static ifCombat() {
        const currentCombat = game.combat;
        if (currentCombat) {
            return currentCombat;
        }
        ui.notifications.error("You must be in combat.");
        return false;
    }

    static async forEachControlledToken(applyFunc, funcArgs) {
        const tokens = canvas.tokens.controlled;
        for (let tokenNum in tokens) {
            if (!tokens.hasOwnProperty(tokenNum)) {
                continue;
            }
            const token = tokens[tokenNum];
            const actor = token.actor;
            await applyFunc(actor, token, funcArgs);
        }
    }

    static async forEachTargetedToken(applyFunc, funcArgs) {
        const iterator = game.user.targets.values();
        for (let token = iterator.next().value; token; token = iterator.next().value) {
            const actor = token.actor;
            await applyFunc(TayiWP.ifActor(), actor, token, funcArgs);
        }
    }

    static findActorItem(itemName, itemType) {
        const actor = TayiWP.ifActor();
        if (!actor) {
            return;
        }
        let item = actor.data.items.filter(item => item.type === itemType)
            .find(item => item.name === itemName);
        if (item) {
            return actor.getOwnedItem(item._id);
        }
    }

    static async saySomething(actor, messageContent) {
        let speaker = { actor: actor, alias: actor.name };
        // if (additionalData && additionalData['EXPIRED']) {
        //     speaker = { alias: "Turn Alert" };
        // }
        const chatData = {
            user: game.user._id,
            speaker: speaker,
            content: messageContent
        };
        // if (additionalData) {
        //     chatData[TayiWP.CHAT_DATA_NAME] = additionalData;
        // }
        return await ChatMessage.create(chatData, {});
    }

    // static rollSomething(formula, data, DC) {
    //     const roll = new Roll(formula, data).roll();
    //     const rollD20 = roll.dice[0].total;
    //     const rollTotal = roll.total;
    //     let grade = 1;
    //     if (rollTotal >= DC) {
    //         grade = 2;
    //     }
    //     if (rollD20 === 20 || rollTotal >= DC + 10) {
    //         grade += 1;
    //     }
    //     if (rollD20 === 1 || rollTotal <= DC - 10) {
    //         grade -= 1;
    //     }
    //     return {
    //         roll: roll,
    //         grade: grade
    //     };
    // }

    static createParam(name, label, ptype, value) {
        const x = this.createParamShort(name, label, ptype, value);
        const y = this.createBorders();
        x.text = y[0].text + x.text + y[1].text;
        return x;
    }

    static createBorders() {
        return [
            {
                name: '__BORDER__',
                text: `
          <div class="form-group">`
            },
            {
                name: '__BORDER__',
                text: `
          </div>`
            }
        ];
    }

    static createParamShort(name, label, ptype, value) {
        return {
            name: name,
            text: `
            <label>` + label + `</label>
            <input id="` + name + `" name="` + name + `" type="` + ptype + `" value="` + value + `"/>`
        };
    }

    static createOptionParam(name, label, values) {
        let selectContent = '';
        for (let i in values) {
            if (!values.hasOwnProperty(i)) {
                continue;
            }
            selectContent += `<option value="` + values[i][0] +`">` + values[i][1] + `</option>`;
        }
        const x = this.createBorders();
        return {
            name: name,
            text: x[0].text + `
            <label>` + label + `</label>
            <select id="` + name + `" name="` + name + `">
                ` + selectContent + `
            </select>` + x[1].text
        };
    }

    static async whenNextTurn(triggerWhen, combatantData, duration, macroName, argsArray) {
        const actor = TayiWP.ifActor();
        const combatCurrent = TayiWP.ifCombat();
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
            name: TayiWP.CHAT_DATA_NAME + "Alert" + triggerWhen + combatantData._id + macroName,
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
            label: TayiWP.CHAT_DATA_NAME + "Alert" + triggerWhen + combatantData._id + macroName,
            message: null,
            recipientIds: [],
            macro: macroName,
            args: argsArray,
            userId: game.userId
        };

        await TurnAlert.create(alertData);
        // await new TurnAlertConfig(alertData).render(true);
    }

    static async whenNextRound(triggerWhen, roundNumber, duration, macroName, argsArray) {
        const combatCurrent = TayiWP.ifCombat();
        if (!combatCurrent) {
            // saySomething(triggerWhen + combatantData.name + ": " + await textFunc());
            return;
        }

        const alertData = {
            id: null,
            name: TayiWP.CHAT_DATA_NAME + "Alert" + triggerWhen + roundNumber + macroName,
            combatId: combatCurrent.data._id,
            createdRound: combatCurrent.data.round,
            round: triggerWhen === TayiWPConst.COMBAT_TRIGGERS.ROUND_START ? roundNumber : roundNumber + 1,
            roundAbsolute: false,
            turnId: null,
            endOfTurn: false,
            repeating: duration > 1 ? {
                frequency: 1,
                expire: duration,
                expireAbsolute: false
            } : null,
            label: TayiWP.CHAT_DATA_NAME + "Alert" + triggerWhen + roundNumber + macroName,
            message: null,
            recipientIds: [],
            macro: macroName,
            args: argsArray,
            userId: game.userId
        };

        await TurnAlert.create(alertData);
        // await new TurnAlertConfig(alertData).render(true);
    }

    static async postChatButtonEffect(effectName, effectDesc, funcArgs) {
        const actor = TayiWP.ifActor();
        let speaker = { actor: actor, alias: actor.name };
        if (funcArgs['EXPIRED']) {
            speaker = { alias: "Turn Alert" };
            effectDesc += ' EXPIRED';
        }
        const chatData = {
            user: game.user._id,
            speaker: speaker,
            content: '<div class="' + TayiWP.CHAT_CARD_CLASS + '"><b>' + effectName + '</b><p>' + effectDesc
            + '</p></div>',
            flags: {}
            // type: CONST.CHAT_MESSAGE_TYPES.OOC
        };
        chatData.flags[TayiWP.CHAT_DATA_NAME] = funcArgs;
        await ChatMessage.create(chatData, {});
    }

    static async postChatButtonGrade(effectName, effectDescFunc, funcArgs) {
        const actor = TayiWP.ifActor();
        let speaker = { actor: actor, alias: actor.name };
        let effectDescAdd = '';
        if (funcArgs['EXPIRED']) {
            speaker = { alias: "Turn Alert" };
            effectDescAdd += ' EXPIRED';
        }
        let messageContent = '<div class="' + TayiWP.CHAT_CARD_CLASS + '"><b>' + effectName + '</b>';
        for (let gradeLevel in funcArgs.grades) {
            if (!funcArgs.grades.hasOwnProperty(gradeLevel)) {
                continue;
            }
            messageContent += '<p data-grade="' + gradeLevel + '">'
                + effectDescFunc(funcArgs, gradeLevel) + effectDescAdd + '</p>';
        }
        const chatData = {
            user: game.user._id,
            speaker: speaker,
            content: messageContent + '</div>',
            flags: {}
            // type: CONST.CHAT_MESSAGE_TYPES.OOC
        };
        chatData.flags[TayiWP.CHAT_DATA_NAME] = funcArgs;
        await ChatMessage.create(chatData, {});
    }
}
