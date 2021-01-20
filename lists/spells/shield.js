import TayiWPConst from "../../src/const.js";
import TayiWPSpell from "../../categories/clSpell.js";
import TayiWPSpellLevel from "../../categories/clSpellLevel.js";
import TayiWP from "../../src/base.js";
import TayiWPFlagsClass from "../../src/clFlags.js";
import TayiWPReq from "../../categories/clReq.js";

class TayiWPSpellAttributesShield extends TayiWPSpellLevel {
    compendiumName = 'pf2e.equipment-srd';
    shieldNameBefore = 'Buckler';
    shieldName = 'Magical Shield of Force';
    ac_bonus = 1;
    hardness = 5;

    createParams() {
        return [
            TayiWPConst.createParam('ac_bonus', 'AC Bonus', 'number', this.ac_bonus),
            TayiWPConst.createParam('hardness', 'Hardness', 'number', this.hardness)
        ]
    }
}

export default class TayiWPSpellShield extends TayiWPSpell {
    static SUBCLASS_NAME = 'Shield';
    static DIALOG_LEVEL_SCALING = 2;
    static USE_REQUIREMENTS = [
        new TayiWPReq("SPELL", "Shield", 1)
    ];

    static getDialogOptionPerLevel(level) {
        const attr = new TayiWPSpellAttributesShield(level);
        attr.hardness = 5 + (level - this.DIALOG_LEVEL_MIN) / 2 * 5;
        return attr;
    }

    static alertCreate(args) {
        const instance = super.create();
        if (instance) {
            instance.removeEffect(args[0]);
        }
    }

    async dialogCallback(spellParams) {
        const actor = TayiWPConst.ifActor();
        await this.applyEffect(spellParams);
        spellParams['EXPIRED'] = true;
        await TayiWP.whenNextTurn(TayiWPConst.COMBAT_TRIGGERS.TURN_START, actor.data._id, 1, spellParams.MACRO_NAME,
            [spellParams]);
    }

    // async createEffectButton(spellParams) {
    //     const effectDesc = `+${spellParams.ac_bonus} circumstance AC, 1 round (hardness ${spellParams.hardness})`;
    //     await TayiWP.postChatButtonEffect(this.getFullName(spellParams.level), effectDesc, spellParams);
    // }

    // static getCallbackMessage() {
        // return this;
    // }

    // static handleMessage(message, html, data, chat_card, effect_data) {
        // TayiWPConst.createButton(chat_card, "Remove effect", this.buttonClickRemoveEffect, effect_data);
    // }

    async applyEffect(spellParams) {
        spellParams.ac_bonus = parseInt(spellParams.ac_bonus);
        spellParams.hardness = parseInt(spellParams.hardness);
        const pack = game.packs.get(spellParams.compendiumName);
        const index = await pack.getIndex();
        const entry = index.find(e => e.name === spellParams.shieldNameBefore);
        const item = await pack.getEntity(entry._id);
        await TayiWPConst.forEachControlledToken(async (actor, token, spellParams) => {
            const shield = await actor.createOwnedItem(item.data);
            await actor.updateEmbeddedEntity("OwnedItem", [{
                "_id": shield._id,
                "data.hp.value": 1,
                "data.maxHp.value": 1,
                "data.armor.value": spellParams.ac_bonus,
                "data.hardness.value": spellParams.hardness,
                "data.brokenThreshold.value": 0,
                "name": `${spellParams.shieldName} (lvl ${spellParams.level})`,
                "img": "systems/pf2e/icons/spells/shield.jpg",
                "data.equipped.value": true,
            }]);
            await actor.addCustomModifier('ac', `Raise Shield (${spellParams.shieldName})`, spellParams.ac_bonus,
                'circumstance');
            token.toggleEffect("systems/pf2e/icons/spells/shield.jpg", {
                "active": true
            });
            TayiWPFlagsClass.affect(spellParams, actor, token);
            const messageContent = `creates shield with AC <b>${spellParams.ac_bonus}`
                + `</b> and Hardness <b>${spellParams.hardness}</b>`;
            await TayiWPConst.saySomething(actor, `${spellParams.MACRO_NAME}: ${messageContent}`);
        }, spellParams);
    }

    async removeEffect(spellParams) {
        await TayiWPConst.forEachAffectedToken(async (current_actor, actor, token, spellParams) => {
            let shield = actor.data.items
                .filter(item => item.type === 'armor')
                .filter(armor => armor.data.armorType.value === 'shield')
                .find(shield => shield.name.startsWith(spellParams.shieldName));

            await actor.removeCustomModifier('ac', `Raise Shield (${spellParams.shieldName})`);
            token.toggleEffect("systems/pf2e/icons/spells/shield.jpg", {
                "active": false
            });
            let messageContent = `dismisses ${spellParams.SUBCLASS_NAME} cantrip`;
            if (shield.data.hp.value < shield.data.maxHp.value) {
                messageContent += `; ${spellParams.SUBCLASS_NAME} can't be used for 10 minutes`
            }
            await actor.deleteEmbeddedEntity('OwnedItem', shield._id);
            TayiWPFlagsClass.remove(spellParams, actor, token);
            await TayiWPConst.saySomething(actor, `${spellParams.MACRO_NAME}: ${messageContent}`);
        }, spellParams);
    }
}
