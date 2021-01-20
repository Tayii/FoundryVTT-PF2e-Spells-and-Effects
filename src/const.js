export default class TayiWPConst {
    static CHAT_CARD_CLASS = "tayi-wp-macro";
    static CHAT_DATA_NAME = "tayiwp";

    static RANK_NAMES = {
        0: "Untrained",
        1: "Trained",
        2: "Expert",
        3: "Master",
        4: "Legendary"
    };

    static GRADE_NAMES = {
        0: "Critical Failure",
        1: "Failure",
        2: "Success",
        3: "Critical Success",
    };

    static GRADE_SH_NAMES = {
        0: "CF",
        1: "F",
        2: "S",
        3: "CS",
    };

    static COMBAT_TRIGGERS = {
        TURN_START: "TURN_START",
        TURN_END: "TURN_END",
        ROUND_START: "ROUND_START",
        ROUND_END: "ROUND_END",
    };

    static getDC_by_LEVEL(lvl) {
        if (lvl <= 20) {
            return 14 + lvl + Math.floor(lvl / 3);
        }
        else {
            return lvl * 2;
        }
    };

    static getGRADE_by_ROLL(roll, DC) {
        const rollD20 = roll.dice[0].total;
        const rollTotal = roll.total;
        let grade = 1;
        if (rollTotal >= DC) {
            grade = 2;
        }
        if (rollD20 === 20 || rollTotal >= DC + 10) {
            grade += 1;
        }
        if (rollD20 === 1 || rollTotal <= DC - 10) {
            grade -= 1;
        }
        return grade;
    };

    static getSPELL_LEVEL(actor_level) {
        return Math.ceil(actor_level / 2);
    }

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
                text: `<div class="form-group">`
            },
            {
                name: '__BORDER__',
                text: `</div>`
            }
        ];
    }

    static createParamShort(name, label, ptype, value) {
        value = (value !== undefined) ? `value="${value}"` : ``;
        return {
            name: name,
            text: `<label>${label}</label>
            <input id="${name}" name="${name}" type="${ptype}" ${value}/>`
        };
    }

    static createOptionParam(name, label, values, selected_val = 0) {
        let selectContent = '';
        for (let i in values) {
            if (!values.hasOwnProperty(i)) {
                continue;
            }
            const selected = (parseInt(i) === selected_val) ? "selected" : "";
            selectContent += `<option value="${values[i][0]}" ${selected}>${values[i][1]}</option>`;
        }
        const x = this.createBorders();
        return {
            name: name,
            text: x[0].text + `
            <label>${label}</label>
            <select id="${name}" name="${name}">
                ${selectContent}
            </select>` + x[1].text
        };
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
            await applyFunc(this.ifActor(), actor, token, funcArgs);
        }
    }

    static async forEachAffectedToken(applyFunc, params) {
        for (const affected of params.affected_ids) {
            const token = canvas.tokens.get(affected[0]);
            let actor;
            if (token.actor) {
                actor = token.actor;
            }
            else {
                actor = game.actors.find(a => a._id === affected[1]);
            }
            await applyFunc(this.ifActor(), actor, token, params);
        }
    }

    static ifActorItem(itemName, itemType) {
        const actor = this.ifActor();
        if (!actor) {
            return false;
        }
        let item = actor.data.items
            .filter(item => item.type === itemType)
            .find(item => item.name === itemName);
        return (item) ? actor.getOwnedItem(item._id) : false;
    }

    static ifActorHasModifier(actor, mod_type, mod_name) {
        return (actor.data.data.customModifiers.hasOwnProperty(mod_type)
            && actor.data.data.customModifiers[mod_type].find(cm => cm.name === mod_name));
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
        //     chatData[TayiWPConst.CHAT_DATA_NAME] = additionalData;
        // }
        return await ChatMessage.create(chatData, {});
    }

    static createButton(chat_card, btnName, clickFunc, funcArgs) {
        const btn = $(`<button>` + btnName + `</button>`);
        chat_card.append(btn);
        btn.click(async ev => {
            ev.stopPropagation();
            await clickFunc(funcArgs);
        });
    }
}
