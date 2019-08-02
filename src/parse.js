/**
 * @namespace BHell
 */
var BHell = (function (my) {

/**
 * Parser function. Takes a string and evaluates it as an arithmetic expression after replacing the following placeholders:
 *
 * - pi: 3.14...,
 * - x: x coordinate of something,
 * - y: y coordinate of something,
 * - w: width of something,
 * - h: height of something,
 * - sw: screen width,
 * - sh: screen height.
 *
 * @param str String to be parsed.
 * @param x number with which "x" will be replaced on the expression.
 * @param y number with which "y" will be replaced on the expression.
 * @param w number with which "w" will be replaced on the expression.
 * @param h number with which "h" will be replaced on the expression.
 * @param sw number with which "sw" will be replaced on the expression.
 * @param sh number with which "sh" will be replaced on the expression.
 * @returns {*} true/false or a number if the string could be parsed correctly, null otherwise.
 * @memberOf BHell
 */
    my.parse = function(str, x, y, w, h, sw, sh) {
    var ret = null;
    var regex = /[0-9.+\-*/()]+/;

    if (typeof(str) === "number" || typeof(str) === "boolean") {
        ret = str;
    }
    else if (typeof(str) === "string") {
        if (str === "true") {
            ret = true;
        }
        else if (str === "false") {
            ret = false;
        }
        else {
            str = str.replace(/pi/g, String(Math.PI));
            str = str.replace(/x/g, String(x));
            str = str.replace(/y/g, String(y));
            str = str.replace(/sw/g, String(sw));
            str = str.replace(/sh/g, String(sh));
            str = str.replace(/w/g, String(w));
            str = str.replace(/h/g, String(h));
            str = str.replace(/ */g, "");

            // Since all the characters in the string should be at this point digits, operators and parentheses, eval should be safe.
            if (regex.exec(str) != null) {
                ret = eval("Number(" + str + ")");
            }
        }
    }

    return ret;
};

return my;
} (BHell || {}));