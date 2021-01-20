import TayiWPConst from "../../src/const.js";
import TayiWPSkill from "../../categories/clSkill.js";
import TayiWPSkillGrade from "../../categories/clSkillGrade.js";
import TayiWPSkillRank from "../../categories/clSkillRank.js";
import TayiWPReq from "../../src/clReq.js";
import TayiWPRoll from "../../src/clRoll.js";

class TayiWPSkillGradeTreatWounds extends TayiWPSkillGrade {
    formula = '1d8';
    meaning = 'healing';

    constructor(level) {
        super(level);
        this.formula = {
            0: '1d8',
            1: '',
            2: '2d8',
            3: '4d8'
        }[level];
        this.meaning = {
            0: 'damage',
            1: '',
            2: 'healing',
            3: 'healing'
        }[level];
    }

    createParams(grade_num) {
        const grade = TayiWPConst.GRADE_NAMES[grade_num];
        const gr = TayiWPConst.GRADE_SH_NAMES[grade_num];
        return [
            TayiWPConst.createParam(`formula-${gr}`, grade, 'text', this.formula),
            TayiWPConst.createOptionParam(`meaning-${gr}`, '', [
                ['healing', 'healing'],
                ['damage', 'damage']
            ], (this.meaning === 'healing') ? 0 : 1),
        ]
    }
}

class TayiWPSkillRankTreatWounds extends TayiWPSkillRank {
    dc = 15;
    healing_add = 0;
    formula = '1d8';
    meaning = 'healing';

    constructor(level) {
        super(level);
        if (level > 1) {
            this.dc = 10 * level;
            this.healing_add = 20 * level - 30;
        }
        for (let i = 3; i >= 0; i--) {
            const grade = new TayiWPSkillGradeTreatWounds(i);
            if (grade.meaning === 'healing' && this.healing_add > 0)
                grade.formula += `+${this.healing_add}`;
            this.grades[i] = grade;
        }
    }

    createParams() {
        let params = [
            TayiWPConst.createParam('dc', 'DC', 'number', this.dc)
        ];
        for (let i = 3; i >= 0; i--)
            params = params.concat(this.grades[i].createParams(i));
        return params;
    }

    setGrade(grade) {
        while (grade >= 0 && !this.grades.hasOwnProperty(grade))
            grade--;
        if (this.grades.hasOwnProperty(grade)) {
            grade = this.grades[grade];
            this.formula = grade.formula;
            this.meaning = grade.meaning;
            return true;
        }
        return false;
    }
}

export default class TayiWPSkillTreatWounds extends TayiWPSkill {
    static HANDLER_TYPE = 'ACTION';
    static SUBCLASS_NAME = 'Treat Wounds';
    static USE_REQUIREMENTS = [
        new TayiWPReq("SKILL", "medicine", 1)
    ];

    static getDialogOptionPerLevel(level) {
        return new TayiWPSkillRankTreatWounds(level);
    }

    async dialogCallback(req, dialogParams) {
        const actor = TayiWPConst.ifActor();
        const actionDC = parseInt(dialogParams.dc);
        let skill;
        for (let skillCode in actor.data.data.skills) {
            if (!actor.data.data.skills.hasOwnProperty(skillCode)) {
                continue;
            }
            if (actor.data.data.skills[skillCode].name === req.name) {
                skill = actor.data.data.skills[skillCode];
                break;
            }
        }
        // const options = ['secret'];
        // const label = game.i18n.format('PF2E.SkillCheckWithName', { skillName: game.i18n.localize(req.name) });
        // const x = new CheckModifiersDialog(new PF2CheckModifier(label, skill),
        //     { actor: actor, type: 'skill-check', options }, (roll) => { console.log(456); });
        // x.roll = (check, context, callback) => { console.log(123); };
        // x.render(true);
        const roll = new TayiWPRoll("d20 + @total").roll({total: skill.totalModifier}).vsDC(actionDC);
        await roll.result.toMessage();
        const prof = TayiWPConst.RANK_NAMES[dialogParams.level];
        const messageContent = `proficiency level <b>${prof}</b>, ${roll.toString()}`;
        await TayiWPConst.saySomething(actor, `${dialogParams.MACRO_NAME}: ${messageContent}`);
        if (!dialogParams.setGrade(roll.grade) || dialogParams.formula.length === 0) {
            return;
        }
        const roll2 = new TayiWPRoll(dialogParams.formula).roll({});
        await roll2.result.toMessage();
        await TayiWPConst.forEachTargetedToken(async (owner_actor, target_actor, target_token, dialogParams) => {
            const messageContent = `target <b>${target_token.data.name}</b> receives <b>${roll2.result.total}`
                + `</b> ${dialogParams.meaning}`;
            await TayiWPConst.saySomething(owner_actor, `${dialogParams.MACRO_NAME}: ${messageContent}`);
        }, dialogParams);
    }
}
