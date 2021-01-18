export default class TayiWPFlagsClass {
    SUBCLASS_NAME = '';
    HANDLER_NAME = '';
    MACRO_NAME = '';
    source_actor_id = '';
    affected_ids = [];

    static affect(flags_object, actor, token) {
        flags_object.affected_ids.push([token.id, actor._id]);
    }

    static remove(flags_object, actor, token) {
        flags_object.affected_ids.splice(flags_object.affected_ids.findIndex(t => t === token.id), 1);
    }
}
