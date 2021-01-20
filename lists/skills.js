import TayiWPSkillTreatWounds from "./skills/treatWounds.js";

const l = [
    TayiWPSkillTreatWounds,
];
const TAYIWP_SKILLS = {};
for (const _class of l) {
    TAYIWP_SKILLS[_class.SUBCLASS_NAME] = _class;
}
export default TAYIWP_SKILLS;
