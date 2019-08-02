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
            this.pts.push({x: Math.round(x), y: Math.round(y)});
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
        if (this.selected != -1) {
            this.pts[this.selected].x = Math.round(x);
            this.pts[this.selected].y = Math.round(y);
        }
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

    var redraw = function (c, coords, points, drawJunk) {
        var ctx = c.getContext("2d");

        var offX = (c.width - 48 * 17) / 2;
        var offY = (c.height - 48 * 13) / 2;

        var coordsStr = [];
        ctx.clearRect(0, 0, c.width, c.height);

        ctx.strokeStyle = "black";
        drawGrid(offX, offY, ctx);

        for (var i = 0; i < points.i; i++) {
            ctx.beginPath();
            if (points.selected === i) {
                ctx.fillStyle = "red";
            }
            else {
                ctx.fillStyle = "blue";
            }
            ctx.arc(points.pts[i].x - 5, points.pts[i].y - 5, 10, 0, Math.PI * 2, false);

            var str = "\"" + String.fromCharCode("A".charCodeAt() + i) + "\": {\"x\": " + (points.pts[i].x - offX);
            str += ", \"y\": " + (points.pts[i].y - offY) + "}";
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
    }

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

        // When the mouse is pressed, place the next spline point. If all points are placed, start moving a point (if it's under the mouse)
        c.addEventListener("mousedown", e => {
            var x = e.clientX - c.getBoundingClientRect().left;
            var y = e.clientY - c.getBoundingClientRect().top;

            if (points.push(x, y) == false) {
                if (points.select(x, y)) {
                    mouseDown = true;
                }
            }

            redraw(c, coords, points, junk.checked);
        });

        // When the mouse is released, deselect the point (if there was one selected) and update the spline.
        c.addEventListener("mouseup", e => {
            if (mouseDown) {
                mouseDown = false;
                points.deselect();
            }

            redraw(c, coords, points, junk.checked);
        });

        // If the mouse is dragging a point, update the spline.
        c.addEventListener("mousemove", e => {
            if (mouseDown) {
                var x = e.clientX - c.getBoundingClientRect().left;
                var y = e.clientY - c.getBoundingClientRect().top;
                points.moveSelected(x, y);
                redraw(c, coords, points, junk.checked);
            }
        });

        junk.addEventListener("change", e => {
            redraw(c, coords, points, junk.checked);
        })
    };

    initPage();
})();