import TayiWPSkillBonMot from "./feats/bonMot.js";

const l = [
    TayiWPSkillBonMot,
];
const TAYIWP_FEATS = {};
for (const _class of l) {
    TAYIWP_FEATS[_class.SUBCLASS_NAME] = _class;
}
export default TAYIWP_FEATS;
