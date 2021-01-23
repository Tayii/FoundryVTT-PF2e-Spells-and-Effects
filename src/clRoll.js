import TayiWPConst from "./const.js";

export default class TayiWPRoll {
    constructor(formula) {
        this.formula = formula;
        this.result = null;
        this.DC = null;
        this.grade = null;
    }

    skillRoll(actor, skill_code, mods, callback) {
        const self = this;
        const label = game.i18n.format('PF2E.SkillCheckWithName', {
            skillName: game.i18n.localize(CONFIG.PF2E.skills[skill_code]),
        });
        const event = {};
        if (mods.length > 0)
            event["shiftKey"] = true;
        const modifiers = new PF2CheckModifier(label, actor.data.data.skills[skill_code]);
        for (const i of mods) {
            modifiers.push(i);
        }
        const options = [];
        // options.push('secret');
        PF2Check.roll(modifiers, { actor: actor, type: 'skill-check', options }, event, async (roll) => {
            self.result = roll;
            await callback(self);
        });
    }

    roll(data) {
        this.result = new Roll(this.formula, data).roll();
        return this;
    }

    vsDC(DC) {
        if (!this.result) {
            return;
        }
        this.DC = DC;
        const rollD20 = this.result.dice[0].total;
        const rollTotal = this.result.total;
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
        this.grade = grade;
        return this;
    }

    toString(show_dc = true) {
        if (show_dc)
            show_dc = ` <b>[[${this.DC}]]</b>`;
        else
            show_dc = ``;
        if (this.grade !== null) {
            return `rolled <b>[[${this.result.result}]]</b> vs DC${show_dc}`
                + ` which is <b>${TayiWPConst.GRADE_NAMES[this.grade]}</b>`;
        }
        if (this.result !== null) {
            return `<b>[[${this.result.result}]]</b>`;
        }
        return this.formula;
    }
}
