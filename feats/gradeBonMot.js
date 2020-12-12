import TayiWP from "../src/base.js";
import TayiWPFeat from "../src/featsClass.js";
import { TayiWPFeatAttributes, TayiWPGradeAttributes, TayiWPProfAttributes } from "../src/featsAttrs.js";
import TayiWPRoll from "../src/baseRoll.js";
import TayiWPConst from "../src/const.js";

const name = 'Bon Mot';

class GradeAttributes extends TayiWPGradeAttributes {
    constructor(penalty, target) {
        super();
        this.penalty = penalty;
        this.target = target;
    }
}

class ProfAttributes extends TayiWPProfAttributes {
}

class FeatAttributes extends TayiWPFeatAttributes {
    static CALLBACK_NAME = name;
    skillName = 'diplomacy';

    constructor(grades) {
        super();
        this.grades = grades;
    }

    setGrade(gradeLevel) {
        if (!super.setGrade(gradeLevel)) {
            return false;
        }
        this.penalty = this["penalty_" + gradeLevel];
        this.target = this.grades[gradeLevel].target;
        return true;
    }

    createParams() {
        const x = [];
        for (let gradeLevel in this.grades) {
            if (!this.grades.hasOwnProperty(gradeLevel)) {
                continue;
            }
            const grade = this.grades[gradeLevel];
            let propName = 'penalty';
            let propParam = propName  + '_' + gradeLevel;
            this[propName] = grade[propName];
            x.push(TayiWP.createParam(propParam, TayiWPConst.GRADE_SH_NAMES[gradeLevel] + ': Penalty to '
                + grade.target, 'number', grade[propName]));
        }
        return x;
    }

    copy() {
        return new FeatAttributes(this.grades);
    }
}

export default class TayiWPGradeBonMot {
    static featName = name;

    static profLevels = {
        1: new ProfAttributes(),
    };

    static gradeLevels = {
        0: new GradeAttributes(2, "user"),
        1: new GradeAttributes(0, ""),
        2: new GradeAttributes(2, "target"),
        3: new GradeAttributes(3, "target"),
    };

    static constructFeatAttrs() {
        const x = {};
        for (let profLevel in this.profLevels) {
            if (!this.profLevels.hasOwnProperty(profLevel)) {
                continue;
            }
            const grades = {};
            for (let gradeLevel in this.gradeLevels) {
                if (!this.gradeLevels.hasOwnProperty(gradeLevel)) {
                    continue;
                }
                const grade = this.gradeLevels[gradeLevel];
                const penalty = grade.penalty;
                const target = grade.target;
                if (penalty === 0) {
                    continue;
                }
                grades[gradeLevel] = new GradeAttributes(penalty, target);
            }
            x[profLevel] = new FeatAttributes(grades);
        }
        return x;
    }

    static async useFunc(featParams) {
        const actor = TayiWP.ifActor();
        // TODO target will DC
        const targetDC = 0;
        const roll = new TayiWPRoll("d20 + @total").rollDC({total: featParams.skill.totalModifier}, targetDC);
        const messageContent = 'proficiency level <b>' + featParams.level + '</b>, Will DC <b>' + targetDC + '</b>: '
            + roll.toString();
        await TayiWP.saySomething(actor, featParams.fullName + ': ' + messageContent);
        if (!featParams.setGrade(roll.grade)) {
            return;
        }
        await this.createEffectButton(featParams);
        featParams['EXPIRED'] = true;
        await TayiWP.whenNextTurn(TayiWPConst.COMBAT_TRIGGERS.TURN_START, actor.data, 10, featParams.macroName,
            [featParams]);
    }

    static async createEffectButton(featParams) {
        const effectDesc = '-' + featParams.penalty + ' status penalty to Perception and Will saves, 10 rounds (1 minute)'
            + ', target = ' + featParams.target;
        await TayiWP.postChatButton(featParams.fullName, effectDesc, featParams);
    }

    static async applyFunc(featParams) {
        await TayiWP.forEachControlledToken(async (actor, token, featParams) => {
            const messageContent = 'takes' + featParams.penalty + ' status penalty to Perception and Will saves,'
                + ' 10 rounds (1 minute)';
            // TODO will modifier
            actor.addCustomModifier('will', featParams.CALLBACK_NAME, featParams.penalty, 'status');
            // TODO perception modifier
            actor.addCustomModifier('perception', featParams.CALLBACK_NAME, featParams.penalty, 'status');
            await TayiWP.saySomething(actor, featParams.macroName + ': ' + messageContent);
        }, featParams);
    }

    static async removeFunc(spellParams) {
        await TayiWP.forEachControlledToken(async (actor, token, featParams) => {
            const messageContent = 'loses' + featParams.penalty + ' status penalty to Perception and Will saves';
            // TODO will modifier
            actor.removeCustomModifier('will', featParams.CALLBACK_NAME);
            // TODO perception modifier
            actor.removeCustomModifier('perception', featParams.CALLBACK_NAME);
            await TayiWP.saySomething(actor, featParams.macroName + ': ' + messageContent);
        }, spellParams);
    }

    static init(args) {
        const skill = TayiWP.ifActor().data.data.skills.dip;
        const featAttrs = this.constructFeatAttrs();
        TayiWPFeat.create(this.featName, skill, featAttrs, this.useFunc).renderDialog();
    }

    static getCallback(funcArgs) {
        return {
            callback: TayiWP.callbackSpellEffect,
            callbackArgs: {
                applyFunc: this.applyFunc,
                removeFunc: this.removeFunc,
                funcArgs: funcArgs
            }
        }
    }
}
