export default class TayiWPFlagsClass {
    SUBCLASS_NAME = '';
    HANDLER_NAME = '';
    MACRO_NAME = '';
    affected_ids = [];

    affect(token) {
        this.affected_ids.push([token.id, token.actor._id]);
    }
}
