// Simple spline editor script.
(function () {
    var Spline = function () {
        this.initialize.apply(this, arguments);
    };
    Spline.prototype = Object.create(Object.prototype);
    Spline.prototype.constructor = Spline;
    Spline.prototype.initialize = function () {
        this.i = 0;
        this.pts = [];
        this.selected = -1;
    };

    Spline.prototype.push = function (x, y) {
        if (this.i < 4) {
            this.pts.push({x: Math.round(x), y: Math.round(y), initX: Math.round(x), initY: Math.round(y)});
            this.i++;
        }

        return (this.i < 4);
    };

    Spline.prototype.select = function (x, y) {
        var s = this.pts.filter(p => {
            return Math.sqrt((p.x - x) * (p.x - x) + (p.y - y) * (p.y - y)) <= 15;
        })[0];
        this.selected = this.pts.indexOf(s);

        return (this.selected !== -1);
    };

    Spline.prototype.deselect = function () {
        this.selected = -1;
    };

    Spline.prototype.moveSelected = function (x, y) {
        if (this.selected !== -1) {
            this.pts[this.selected].x = Math.round(x);
            this.pts[this.selected].y = Math.round(y);
            this.pts[this.selected].initX = Math.round(x);
            this.pts[this.selected].initY = Math.round(y);
        }
    };

    Spline.prototype.mirrorVertically = function (center) {
        this.pts.forEach(p => {
            p.y = center - p.y;
            p.initY = p.y;
        });
    };
    Spline.prototype.mirrorHorizontally = function (center) {
        this.pts.forEach(p => {
            p.x = center - p.x;
            p.initX = p.x;
        });
    };

    Spline.prototype.rotate = function (cx, cy, angle) {
        this.pts.forEach(p => {
            var x = p.initX - cx;
            var y = p.initY - cy;
            p.x = x * Math.cos(angle) - y * Math.sin(angle) + cx;
            p.y = x * Math.sin(angle) + y * Math.cos(angle) + cy;
        });
    };

    Spline.prototype.translate = function (x, y) {
        this.pts.forEach(p => {
            p.x += x;
            p.y += y;
        });
    };

    Spline.prototype.fix = function () {
        this.pts.forEach(p => {
            p.initX = p.x;
            p.initY = p.y;
        });
    };

    Spline.prototype.drawSpline = function (ctx, drawJunk) {
        // Display the useful portion of the spline
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.moveTo(this.pts[1].x, this.pts[1].y);
        for (var t = 1; t < 2; t += 0.01) {
            var a1x = (1 - t) * this.pts[0].x + t * this.pts[1].x;
            var a2x = (2 - t) * this.pts[1].x + (t - 1) * this.pts[2].x;
            var a3x = (3 - t) * this.pts[2].x + (t - 2) * this.pts[3].x;
            var b1x = (2 - t) * a1x / 2 + t * a2x / 2;
            var b2x = (3 - t) * a2x / 2 + (t - 1) * a3x / 2;
            var a1y = (1 - t) * this.pts[0].y + t * this.pts[1].y;
            var a2y = (2 - t) * this.pts[1].y + (t - 1) * this.pts[2].y;
            var a3y = (3 - t) * this.pts[2].y + (t - 2) * this.pts[3].y;
            var b1y = (2 - t) * a1y / 2 + t * a2y / 2;
            var b2y = (3 - t) * a2y / 2 + (t - 1) * a3y / 2;
            var cx = (2 - t) * b1x + (t - 1) * b2x;
            var cy = (2 - t) * b1y + (t - 1) * b2y;
            ctx.lineTo(cx, cy);
            ctx.stroke();
        }
        ctx.closePath();

        // Display the "junk" portion of the spline
        if (drawJunk === true) {
            ctx.beginPath();
            ctx.strokeStyle = "lightgray";
            ctx.moveTo(this.pts[0].x, this.pts[0].y);
            for (var t = 0; t < 1; t += 0.01) {
                var a1x = (1 - t) * this.pts[0].x + t * this.pts[1].x;
                var a2x = (2 - t) * this.pts[1].x + (t - 1) * this.pts[2].x;
                var a3x = (3 - t) * this.pts[2].x + (t - 2) * this.pts[3].x;
                var b1x = (2 - t) * a1x / 2 + t * a2x / 2;
                var b2x = (3 - t) * a2x / 2 + (t - 1) * a3x / 2;
                var a1y = (1 - t) * this.pts[0].y + t * this.pts[1].y;
                var a2y = (2 - t) * this.pts[1].y + (t - 1) * this.pts[2].y;
                var a3y = (3 - t) * this.pts[2].y + (t - 2) * this.pts[3].y;
                var b1y = (2 - t) * a1y / 2 + t * a2y / 2;
                var b2y = (3 - t) * a2y / 2 + (t - 1) * a3y / 2;
                var cx = (2 - t) * b1x + (t - 1) * b2x;
                var cy = (2 - t) * b1y + (t - 1) * b2y;
                ctx.lineTo(cx, cy);
                ctx.stroke();
            }
            ctx.closePath();
            ctx.beginPath();
            ctx.strokeStyle = "lightgray";
            ctx.moveTo(this.pts[3].x, this.pts[3].y);
            for (var t = 2; t < 3; t += 0.01) {
                var a1x = (1 - t) * this.pts[0].x + t * this.pts[1].x;
                var a2x = (2 - t) * this.pts[1].x + (t - 1) * this.pts[2].x;
                var a3x = (3 - t) * this.pts[2].x + (t - 2) * this.pts[3].x;
                var b1x = (2 - t) * a1x / 2 + t * a2x / 2;
                var b2x = (3 - t) * a2x / 2 + (t - 1) * a3x / 2;
                var a1y = (1 - t) * this.pts[0].y + t * this.pts[1].y;
                var a2y = (2 - t) * this.pts[1].y + (t - 1) * this.pts[2].y;
                var a3y = (3 - t) * this.pts[2].y + (t - 2) * this.pts[3].y;
                var b1y = (2 - t) * a1y / 2 + t * a2y / 2;
                var b2y = (3 - t) * a2y / 2 + (t - 1) * a3y / 2;
                var cx = (2 - t) * b1x + (t - 1) * b2x;
                var cy = (2 - t) * b1y + (t - 1) * b2y;
                ctx.lineTo(cx, cy);
                ctx.stroke();
            }
            ctx.closePath();
        }
    };

    var drawGrid = function (offX, offY, ctx) {
        for (var i = 0; i < 17; i++) {
            for (var j = 0; j < 13; j++) {
                ctx.strokeRect(48 * i + offX, 48 * j + offY, 48, 48);
            }
        }
    };

    var redraw = function (c, coords, points, drawJunk, rotate, translate, angle) {
        var ctx = c.getContext("2d");

        var offX = (c.width - 48 * 17) / 2;
        var offY = (c.height - 48 * 13) / 2;

        var coordsStr = [];
        ctx.clearRect(0, 0, c.width, c.height);

        ctx.strokeStyle = "black";
        drawGrid(offX, offY, ctx);

        if (rotate) {
            ctx.beginPath();
            ctx.strokeStyle = "blue";
            ctx.arc(offX + 48 * 8.5, offY + 48 * 6.5, 100, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(offX + 48 * 8.5, offY + 48 * 6.5);
            ctx.lineTo(offX + 48 * 8.5 + Math.cos(angle) * 100, offY + 48 * 6.5 + Math.sin(angle) * 100);
            ctx.closePath();
            ctx.stroke();
        }

        if (translate) {
            ctx.beginPath();
            ctx.fillStyle = "blue";
            ctx.moveTo(offX + 48 * 8.5 - 50, offY + 48 * 6.5 + 20);
            ctx.lineTo(offX + 48 * 8.5 - 70, offY + 48 * 6.5);
            ctx.lineTo(offX + 48 * 8.5 - 50, offY + 48 * 6.5 - 20);
            ctx.lineTo(offX + 48 * 8.5 - 50, offY + 48 * 6.5 + 20);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(offX + 48 * 8.5 + 50, offY + 48 * 6.5 + 20);
            ctx.lineTo(offX + 48 * 8.5 + 70, offY + 48 * 6.5);
            ctx.lineTo(offX + 48 * 8.5 + 50, offY + 48 * 6.5 - 20);
            ctx.lineTo(offX + 48 * 8.5 + 50, offY + 48 * 6.5 + 20);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(offX + 48 * 8.5 + 20, offY + 48 * 6.5 + 50);
            ctx.lineTo(offX + 48 * 8.5, offY + 48 * 6.5 + 70);
            ctx.lineTo(offX + 48 * 8.5 - 20, offY + 48 * 6.5 + 50);
            ctx.lineTo(offX + 48 * 8.5 + 20, offY + 48 * 6.5 + 50);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(offX + 48 * 8.5 + 20, offY + 48 * 6.5 - 50);
            ctx.lineTo(offX + 48 * 8.5, offY + 48 * 6.5 - 70);
            ctx.lineTo(offX + 48 * 8.5 - 20, offY + 48 * 6.5 - 50);
            ctx.lineTo(offX + 48 * 8.5 + 20, offY + 48 * 6.5 - 50);
            ctx.closePath();
            ctx.fill();

        }

        for (var i = 0; i < points.i; i++) {
            ctx.beginPath();
            if (points.selected === i) {
                ctx.fillStyle = "red";
            }
            else {
                ctx.fillStyle = "blue";
            }
            ctx.arc(points.pts[i].x - 5, points.pts[i].y - 5, 10, 0, Math.PI * 2, false);

            var str = "\"" + String.fromCharCode("A".charCodeAt(0) + i) + "\": {\"x\": " + (points.pts[i].x - offX).toFixed(2);
            str += ", \"y\": " + (points.pts[i].y - offY).toFixed(2) + "}";
            coordsStr.push(str);

            ctx.font = "20px Arial";
            ctx.fillText(str, points.pts[i].x + 10, points.pts[i].y);
            ctx.fill();
            ctx.closePath();
        }

        if (points.i === 4) {
            points.drawSpline(ctx, drawJunk);
            coords.value = coordsStr.join(",\n");
        }
    };

    var initPage = function () {
        window.scrollTo((document.getElementById("container").clientWidth - window.innerWidth) / 2, (document.getElementById("container").clientHeight - window.innerHeight) / 2);
        var c = document.getElementById("myCanvas");
        c.width = document.getElementById("container").clientWidth;
        c.height = document.getElementById("container").clientHeight;

        var ctx = c.getContext("2d");

        var offX = (c.width - 48 * 17) / 2;
        var offY = (c.height - 48 * 13) / 2;
        drawGrid(offX, offY, ctx);

        var coords = document.getElementById("coords");
        var junk = document.getElementById("junk");
        coords.value = "";

        var points = new Spline();
        var mouseDown = false;
        var translate = false;
        var rotate = false;
        var initX = 0;
        var initY = 0;
        var angle = 0;

        // When the mouse is pressed, place the next spline point. If all points are placed, start moving a point (if it's under the mouse)
        c.addEventListener("mousedown", e => {
            var x = e.clientX - c.getBoundingClientRect().left;
            var y = e.clientY - c.getBoundingClientRect().top;

            initX = x;
            initY = y;
            if (translate) {
                mouseDown = true;
            }
            else if (rotate) {
                mouseDown = true;

            }
            else if (points.push(x, y) === false) {
                if (points.select(x, y)) {
                    mouseDown = true;
                }
            }

            redraw(c, coords, points, junk.checked, rotate, translate, angle);
        });

        // When the mouse is released, deselect the point (if there was one selected) and update the spline.
        c.addEventListener("mouseup", e => {
            if (mouseDown) {
                mouseDown = false;
                points.deselect();
            }

            if (!rotate) {
                points.fix();
            }

            redraw(c, coords, points, junk.checked, rotate, translate, angle);
        });

        // If the mouse is dragging a point, update the spline.
        c.addEventListener("mousemove", e => {
            if (mouseDown) {
                var x = e.clientX - c.getBoundingClientRect().left;
                var y = e.clientY - c.getBoundingClientRect().top;

                if (translate) {
                    points.translate(x - initX, y - initY);

                }
                else if (rotate) {
                    angle = Math.atan2(y - offY - 48 * 6.5, x - offX - 48 * 8.5);
                    points.rotate(offX + 48 * 8.5, offY + 48 * 6.5, angle);
                }
                else {
                    points.moveSelected(x, y);
                }

                redraw(c, coords, points, junk.checked, rotate, translate, angle);
                initX = x;
                initY = y;
            }
        });

        junk.addEventListener("change", e => {
            redraw(c, coords, points, junk.checked, rotate, translate, angle);
        });

        document.getElementById("vMirror").addEventListener("click", e => {
            points.mirrorVertically(2 * offY + 48 * 13);

            redraw(c, coords, points, junk.checked, rotate, translate, angle);
        });

        document.getElementById("hMirror").addEventListener("click", e => {
            points.mirrorHorizontally(2 * offX + 48 * 17);

            redraw(c, coords, points, junk.checked, rotate, translate, angle);
        });

        document.getElementById("rotate").addEventListener("click", e => {
            rotate = !rotate;
            if (rotate) {
                translate = false;
            }

            redraw(c, coords, points, junk.checked, rotate, translate, angle);
        });

        document.getElementById("translate").addEventListener("click", e => {
            translate = !translate;
            if (translate) {
                rotate = false;
            }

            redraw(c, coords, points, junk.checked, rotate, translate, angle);
        });

        document.getElementById("clear").addEventListener("click", e => {
            junk.checked = 0;
            rotate = false;
            translate = false;
            angle = 0;
            coords.value = "";
            points = new Spline();

            redraw(c, coords, points, junk.checked, rotate, translate, angle);
        });
    };

    initPage();
})();