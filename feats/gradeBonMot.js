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
        return super.copy(new FeatAttributes(this.grades));
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
        const x = {
            'feat': featParams,
            'roll': new TayiWPRoll("d20 + @total").roll({total: featParams.skill.totalModifier})
        };
        const messageContent = 'proficiency level <b>' + featParams.level + '</b>, rolled ' + x.roll.toString();
        await TayiWP.saySomething(actor, featParams.fullName + ': ' + messageContent);
        await TayiWP.forEachTargetedToken(async (owner_actor, target_actor, target_token, params) => {
            const targetDC = target_actor.data.data.saves.will.totalModifier + 10;
            const roll = params.roll.vsDC(targetDC);
            const featParams = params.feat;
            const messageContent = 'target - ' + target_token.data.name + ', ' + roll.toString();
            await TayiWP.saySomething(owner_actor, featParams.macroName + ': ' + messageContent);
        }, x);
        await TayiWPGradeBonMot.createEffectButton(featParams);
        featParams['EXPIRED'] = true;
        await TayiWP.whenNextTurn(TayiWPConst.COMBAT_TRIGGERS.TURN_START, actor.data, 10, featParams.macroName,
            [featParams]);
    }

    static async createEffectButton(featParams) {
        await TayiWP.postChatButtonGrade(featParams.fullName, (featParams, gradeLevel) => {
            const penalty = featParams['penalty_' + gradeLevel];
            return '-' + penalty + ' status penalty to Perception and Will saves, 10 rounds (1 minute)'
        }, featParams);
    }

    static async applyFunc(featParams, gradeLevel) {
        await TayiWP.forEachControlledToken(async (actor, token, featParams) => {
            const penalty = parseInt(featParams['penalty_' + gradeLevel]);
            const messageContent = 'takes -' + penalty + ' status penalty to Perception and Will saves,'
                + ' 10 rounds (1 minute)';
            actor.addCustomModifier('will', featParams.CALLBACK_NAME, penalty, 'status');
            actor.addCustomModifier('perception', featParams.CALLBACK_NAME, penalty, 'status');
            await TayiWP.saySomething(actor, featParams.macroName + ': ' + messageContent);
        }, featParams);
    }

    static async removeFunc(featParams) {
        await TayiWP.forEachControlledToken(async (actor, token, featParams) => {
            const messageContent = 'loses status penalty to Perception and Will saves';
            actor.removeCustomModifier('will', featParams.CALLBACK_NAME);
            actor.removeCustomModifier('perception', featParams.CALLBACK_NAME);
            await TayiWP.saySomething(actor, featParams.macroName + ': ' + messageContent);
        }, featParams);
    }

    static init(args) {
        const skill = TayiWP.ifActor().data.data.skills.dip;
        const featAttrs = this.constructFeatAttrs();
        TayiWPFeat.create(this.featName, skill, featAttrs, this.useFunc).renderDialog();
    }

    static getCallback(funcArgs) {
        return {
            callback: TayiWP.callbackGradeEffect,
            callbackArgs: {
                applyFunc: this.applyFunc,
                removeFunc: this.removeFunc,
                funcArgs: funcArgs
            }
        }
    }
}
