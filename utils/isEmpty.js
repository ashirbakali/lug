let allCheck;

exports.isEmpty = (body) => {
    for (var i = 0; i < Object.values(body).length; i++) {
        if (Object.values(body)[i].length === 0) {
            allCheck = false;
            return;
        } else {
            allCheck = true;
        }
    }

    return allCheck;
}