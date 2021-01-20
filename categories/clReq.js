import TayiWPConst from "../src/const.js";

export default class TayiWPReq {
    type = '';
    name = '';
    level = 1;
    subreqs = [];

    // code = '';
    // value = 0;

    constructor(type, name, level) {
        this.type = type;
        this.name = name;
        this.level = level;
    }

    add_subreq(subreq) {
        this.subreqs.push(subreq);
        return this;
    }

    update(dict) {
        for (const key in dict) {
            if (dict.hasOwnProperty(key))
                this[key] = dict[key];
        }
        return this;
    }

    ifCheckSpell(actor) {
        const actorSpellLevel = TayiWPConst.getSPELL_LEVEL(actor.level);
        if (this.level <= actorSpellLevel)
            return new TayiWPReq(this.type, this.name, actorSpellLevel);
        return false;
    }

    // check_skill(actor) {
    //     for (const skill_n in actor.data.data.skills) {
    //         if (!actor.data.data.skills.hasOwnProperty(skill_n)) {
    //             continue;
    //         }
    //         const skill = actor.data.data.skills[skill_n];
    //         if (this.name === skill.name) {
    //             return new TayiWPReq(this.type, this.name, this.level).update({
    //                 code: skill_n,
    //                 value: skill.value
    //             });
    //         }
    //     }
    // }

    ifCheck(actor) {
        const item = TayiWPConst.ifActorItem(this.name, this.type.toLowerCase());
        if (!item) {
            ui.notifications.error(`You must have the ${this.name} ${this.type.toLowerCase()}.`);
            return false;
        }
        let typecheck;
        switch (this.type) {
            case "SPELL":
                typecheck = this.ifCheckSpell(actor);
                break;
            // case "SKILL":
            //     typecheck = this.check_skill(actor);
            //     break;
            default:
                break;
        }
        if (!typecheck)
            return false;
        const answer = {};
        answer[this.type] = {};
        answer[this.type][this.name] = typecheck;
        for (const subreq of this.subreqs) {
            const req = subreq.ifCheck(actor);
            if (!req)
                return false;
            if (!answer.hasOwnProperty(subreq.type))
                answer[subreq.type] = {};
            answer[subreq.type][subreq.name] = req;
        }
        return answer;
    }
}
