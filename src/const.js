export default class TayiWPConst {
    static RANK_NAMES = {
        0: "Untrained",
        1: "Trained",
        2: "Expert",
        3: "Master",
        4: "Legendary"
    };

    static GRADE_NAMES = {
        0: "Critical Failure",
        1: "Failure",
        2: "Success",
        3: "Critical Success",
    };

    static GRADE_SH_NAMES = {
        0: "CF",
        1: "F",
        2: "S",
        3: "CS",
    };

    static COMBAT_TRIGGERS = {
        TURN_START: "TURN_START",
        TURN_END: "TURN_END",
        ROUND_START: "ROUND_START",
        ROUND_END: "ROUND_END",
    };

    static DC_BY_LEVEL = (() => {
        const arr = {};
        for (let lvl = 0; lvl <= 25; lvl++) {
            if (lvl <= 20) {
                arr[lvl] = 14 + lvl + Math.floor(lvl / 3);
            }
            else {
                arr[lvl] = lvl * 2;
            }
        }
        return arr;
    })();
}
