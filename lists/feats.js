import TayiWPFeatTreatWounds from "../feats/featTreatWounds.js";
import TayiWPGradeBonMot from "../feats/gradeBonMot.js";

const TAYIWP_FEAT_CALLBACKS = {};
TAYIWP_FEAT_CALLBACKS[TayiWPFeatTreatWounds.featName] = TayiWPFeatTreatWounds;
TAYIWP_FEAT_CALLBACKS[TayiWPGradeBonMot.featName] = TayiWPGradeBonMot;
export default TAYIWP_FEAT_CALLBACKS;
