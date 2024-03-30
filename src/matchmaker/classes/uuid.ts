import { v4 } from "uuid";

class UUID {
    static gr() {
        return v4().replace(/-/g, "");
    }
}

export default UUID;