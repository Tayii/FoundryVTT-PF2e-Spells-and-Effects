import TayiWPConst from "./const.js";

export default class TayiWPReq {
    type = '';
    name = '';
    level = 1;
    subreqs = [];
    additions = [];
    sort_value = 0;
    patches = {};

    // code = '';
    // value = 0;

    constructor(type, name, level) {
        this.type = type;
        this.name = name;
        this.level = level;
    }

    getHandlerName() {
        return `${this.type}_${this.name}`.toLowerCase().replace(' ', '_');
    }

    add_subreq(subreq) {
        this.subreqs.push(subreq);
        return this;
    }

    find_add(add_name) {
        return this.additions.find(a => a.name === add_name);
    }

    add_patch(patch_type, patch_callback) {
        this.patches[patch_type] = patch_callback;
        return this;
    }

    apply_patch(patch_type, obj) {
        if (this.patches.hasOwnProperty(patch_type))
            obj = this.patches[patch_type](this, obj);
        for (const subreq of this.subreqs)
            obj = subreq.apply_patch(patch_type, obj);
        for (const add of this.additions)
            obj = add.apply_patch(patch_type, obj);
        return obj;
    }

    update(dict) {
        for (const key in dict) {
            if (dict.hasOwnProperty(key))
                this[key] = dict[key];
        }
        return this;
    }

    ifCheckSpell(actor) {
        const item = TayiWPConst.ifActorItem(this.name, this.type.toLowerCase());
        if (!item) {
            // ui.notifications.error(`You must have the ${this.name} ${this.type.toLowerCase()}.`);
            return false;
        }
        const actorSpellLevel = TayiWPConst.getSPELL_LEVEL(actor.level);
        if (this.level <= actorSpellLevel)
            return new TayiWPReq(this.type, this.name, actorSpellLevel);
        return false;
    }

    ifCheckSkill(actor) {
        for (const skill_code in actor.data.data.skills) {
            if (!actor.data.data.skills.hasOwnProperty(skill_code)) {
                continue;
            }
            const skill = actor.data.data.skills[skill_code];
            if (this.name === skill.name && this.level <= skill.rank) {
                return new TayiWPReq(this.type, this.name, skill.rank).update({
                    code: skill_code,
                    sort_value: skill.value
                });
            }
        }
        // const rank_name = TayiWPConst.RANK_NAMES[this.level];
        // ui.notifications.error(`You must be at least ${rank_name} in the ${this.name} ${this.type.toLowerCase()}.`);
        return false;
    }

    ifCheckFeat(actor) {
        const item = TayiWPConst.ifActorItem(this.name, this.type.toLowerCase());
        if (item) {
            return new TayiWPReq(this.type, this.name, this.level).update({
                item: item
            });
        }
        // ui.notifications.error(`You must have the ${this.name} ${this.type.toLowerCase()}.`);
        return false;
    }

    ifCheck(actor) {
        let answer;
        switch (this.type) {
            case "SPELL":
                answer = this.ifCheckSpell(actor);
                break;
            case "SKILL":
                answer = this.ifCheckSkill(actor);
                break;
            case "FEAT":
                answer = this.ifCheckFeat(actor);
                break;
            default:
                break;
        }
        if (!answer)
            return false;
        for (const subreq of this.subreqs) {
            const s = subreq.ifCheck(actor);
            if (!s)
                return false;
            answer.add_subreq(s);
        }
        answer.patches = this.patches;
        return answer;
    }
}
