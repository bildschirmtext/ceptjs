(function() {

  class CeptAttr {
    constructor() {
      this.bg = Cept.COLOR_TRANSPARENT;
      this.fg = Cept.COLOR_WHITE;
      this.flashf = 0;
      this.flashi = false;
      this.flashp = 0;
      this.flashr = false;
      this.inv = false;
    }

    equal(b) {
      return this.bg == b.bg
        && this.fg == b.fg
        && this.flashf == b.flashf
        && this.flashi == b.flashi
        && this.flashp == b.flashp
        && this.flashr == b.flashr
        && this.inv == b.inv;
    }
  }

  class Cept {
    static COLOR_BLACK = 0;
    static COLOR_RED = 1;
    static COLOR_GREEN = 2;
    static COLOR_YELLOW = 3;
    static COLOR_BLUE = 4;
    static COLOR_MAGENTA = 5;
    static COLOR_CYAN = 6;
    static COLOR_WHITE = 7;
    static COLOR_TRANSPARENT = 8;
    static COLOR_REDUCED_INTENSITY_RED = 9;
    static COLOR_REDUCED_INTENSITY_GREEN = 10;
    static COLOR_REDUCED_INTENSITY_YELLOW = 11;
    static COLOR_REDUCED_INTENSITY_BLUE = 12;
    static COLOR_REDUCED_INTENSITY_MAGENTA = 13;
    static COLOR_REDUCED_INTENSITY_CYAN = 14;
    static COLOR_GREY = 15;

    static FLASH_MODE_STEADY = 0;
    static FLASH_MODE_FLASH = 1;
    static FLASH_MODE_FAST = 2;

    constructor(selector, options={}) {
      this.rows = 25;
      this.cols = 40;

      this.cursor = { x: 0, y: 0};
      this.attr = {}
      this.attr.fg = Cept.COLOR_WHITE;
      this.attr.bg = Cept.COLOR_TRANSPARENT;

      this.clut = []
      this.resetClut();

      this.flashp = 0;
      window.setInterval(this._flashInterval.bind(this), 1000/6);

      this.screen = {}
      this.screen.screenbg = Cept.COLOR_BLACK;
      this.screen.attr = [];
      this.screen.rowbg = []
      this.screen.text = []
      for (var y = 0; y < this.rows; y++) {
        this.screen.text[y] = ".".repeat(this.cols);
        this.screen.attr[y] = [];
        this.screen.rowbg[y] = Cept.COLOR_TRANSPARENT;
        for (var x = 0; x < this.cols; x++) {
          this.screen.attr[y][x] = new CeptAttr();
          this.screen.attr[y][x].bg = Cept.COLOR_TRANSPARENT;
          this.screen.attr[y][x].fg = Cept.COLOR_WHITE;
          this.screen.attr[y][x].flashf = 0;
          this.screen.attr[y][x].flashi = false;
          this.screen.attr[y][x].flashp = 0;
          this.screen.attr[y][x].flashr = false;
          this.screen.attr[y][x].inv = false;
        }
      }

      this.elements = {};
      this.elements.container = document.querySelector(selector);
      if (this.elements.container === null) {
        console.log("Unable to find element matching " + selector);
        return;
      }
      this.elements.screen = document.createElement("div");
      this.elements.container.appendChild(this.elements.screen);
      this.elements.screen.style.width = "fit-content";
      this.elements.screen.style.padding = "20px 0";
      this.elements.screen.style.fontFamily = "Courier, monospace";
      this.elements.screen.style.transform = "scale(1.8, 1)";
      this.elements.screen.style.transformOrigin = "left";
      this.setScreenColor();

      this.elements.row = [];
      for (var y = 0; y < this.rows; y++) {
        this.elements.row[y] = document.createElement("div");
        this.elements.row[y].style.padding = "0 20px";
        this.elements.screen.appendChild(this.elements.row[y]);
        this._updateRowFrom(y);
      }

      this.clear(10, 10, 20, 5);
    }

    _spanFor(bg, fg, text, spans) {
      var s = document.createElement("span");
      s.style.backgroundColor = this._rgba_from_clut(bg);
      s.style.color = this._rgba_from_clut(fg);
      var t = document.createTextNode(text);
      s.appendChild(t);
      spans.push(s);
    }

    _updateRowFrom(y) {
      this.elements.row[y].style.backgroundColor = this._rgba_from_clut(this.screen.rowbg[y])
      var bg = this.screen.rowbg[y];
      var fg = Cept.COLOR_WHITE;
      var text = "";
      var spans = [];
      for (var x = 0; x < this.cols; x++) {
        var attr = this.screen.attr[y][x];
        var cbg = this.screen.attr[y][x].bg;
        var cfg = this.screen.attr[y][x].fg;
        var inv = this.screen.attr[y][x].inv;
        if ((attr.flashf == 1 && (~~(this.flashp / 3) != attr.flashp ^ attr.flashi))
            || (attr.flashf == 2 && (~~(this.flashp / 2) != attr.flashp) ^ attr.flashi)) {
          if (attr.flashr) {
            cfg = cfg ^ 8; // flash between palette 0/1 or 2/3, "reduced intensity flash"
          } else {
            cfg = cbg;
          }
        }
        if (inv) {
          var temp = cfg;
          cfg = cbg;
          cbg = temp;
        }
        if (cbg != bg || cfg != fg) {
          if (text != "") {
            this._spanFor(bg, fg, text, spans);
          }
          bg = cbg;
          fg = cfg;
          text = "";
        }
        text += this.screen.text[y].substr(x, 1);
      }
      this._spanFor(bg, fg, text, spans);
      this.elements.row[y].replaceChildren(...spans);
    }

    _rgba_from_clut(i) {
      return "rgba(" + this.clut[i][0] + ", " + this.clut[i][1] + ", " + this.clut[i][2] + ", " + this.clut[i][3] + ")";
    }

    _flashInterval() {
      this.flashp = (this.flashp + 1) % 6;
      this.updateScreen();
    }

    resetClut() {
      this.clut = [
        [0, 0, 0, 1],
        [255, 0, 0, 1],
        [0, 255, 0, 1],
        [255, 255, 0, 1],
        [0, 0, 255, 1],
        [255, 0, 255, 1],
        [0, 255, 255, 1],
        [255, 255, 255, 1],

        [0, 0, 0, 0],
        [128, 0, 0, 1],
        [0, 128, 0, 1],
        [128, 128, 0, 1],
        [0, 0, 128, 1],
        [128, 0, 128, 1],
        [0, 128, 128, 1],
        [128, 128, 128, 1],

        [0, 0, 0, 1],
        [255, 0, 0, 1],
        [0, 255, 0, 1],
        [255, 255, 0, 1],
        [0, 0, 255, 1],
        [255, 0, 255, 1],
        [0, 255, 255, 1],
        [255, 255, 255, 1],

        [0, 0, 0, 1],
        [255, 0, 0, 1],
        [0, 255, 0, 1],
        [255, 255, 0, 1],
        [0, 0, 255, 1],
        [255, 0, 255, 1],
        [0, 255, 255, 1],
        [255, 255, 255, 1],
      ];
    }

    get color() {
      return this.attr.fg;
    }

    set color(c) {
      this.attr.fg = c;
    }

    get bgColor() {
      return this.attr.bg;
    }

    set bgColor(c) {
      this.attr.bg = c;
    }

    get flashMode() {
      return this.attr.flashf;
    }

    set flashMode(f) {
      this.attr.flashf = f;
    }

    get flashInverted() {
      return this.attr.flashi;
    }

    set flashInverted(i) {
      this.attr.flashi = i;
    }

    get flashReducedIntensity() {
      return this.attr.flashr;
    }

    set flashReducedIntensity(r) {
      this.attr.flashr = r;
    }

    get flashPhase() {
      return this.attr.flashp;
    }

    set flashPhase(p) {
      this.attr.flashp = p;
    }

    get screenColor() {
      return this.screen.screenbg;
    }

    set screenColor(c) {
      setScreenColor(c)
    }

    setScreenColor(c) {
      if (c !== undefined)
        this.screen.screenbg = c;
      this.elements.screen.style.backgroundColor = this._rgba_from_clut(this.screen.screenbg);
    }

    clear(x0, y0, w, h) {
      this.fill(x0, y0, w, h, "\u00A0");
    }

    fill(x0, y0, w, h, c) {
      var x1 = x0 + w;
      var y1 = y0 + h;
      for (var y = y0; y < y1; y++) {
        this.screen.text[y] = this.screen.text[y].substr(0, x0)
          + c.repeat(w)
          + this.screen.text[y].substr(x1);
        for (var x = x0; x < x1; x++) {
          this.screen.attr[y][x].bg = Cept.COLOR_TRANSPARENT;
        }
        this._updateRowFrom(y);
      }
    }

    updateScreen() {
      for (var y = 0; y < this.rows; y++) {
        this._updateRowFrom(y);
      }
    }

    move(x, y) {
      this.cursor.x = x;
      this.cursor.y = y;
    }

    write(t) {
      for (var i = 0; i < t.length; i++) {
        var x = this.cursor.x;
        var y = this.cursor.y;
        var r = this.screen.text[this.cursor.y];
        this.screen.text[y] = r.substr(0, x) + t[i] + r.substr(x+1, this.cols-x);
        this.screen.attr[y][x].fg = this.attr.fg;
        this.screen.attr[y][x].bg = this.attr.bg;
        this.screen.attr[y][x].flashf = this.attr.flashf;
        this.screen.attr[y][x].flashi = this.attr.flashi;
        this.screen.attr[y][x].flashp = this.attr.flashp;
        this.screen.attr[y][x].flashr = this.attr.flashr;
        x += 1;
        if (x >= this.cols) {
          x = 0;
          y += 1;
          if (y >= this.rows)
            y = 0;
        }
        this.cursor.x = x;
        this.cursor.y = y;
      }
    }

    testPattern1() {
      for (var y = 0; y < this.rows; y++) {
        this.screen.rowbg[y] = y % 32;
        var t = ""
        for (var x = 0; x < this.cols; x++) {
          t += String.fromCharCode(64+x+y);
          this.screen.attr[y][x].bg = (this.rows+x-y) % 32;
        }
        this.screen.text[y] = t;
      }
      for (var y = 10; y < 12; y++) {
        for (var x = 0; x < this.cols; x++) {
          this.screen.attr[y][x].flashf = 1;
          this.screen.attr[y][x].flashp = y-10;
          this.screen.attr[y][x].flashi = x >= 20;
          this.screen.attr[y][x].flashr = ~~(x / 10) % 2 == 1;
        }
      }
      for (var y = 12; y < 15; y++) {
        for (var x = 0; x < this.cols; x++) {
          this.screen.attr[y][x].flashf = 2;
          this.screen.attr[y][x].flashp = y-12;
          this.screen.attr[y][x].flashi = x >= 20;
          this.screen.attr[y][x].flashr = ~~(x / 10 ) % 2 == 1;
        }
      }
      this.updateScreen();
    }

    resetAttr() {
      this.flashMode = Cept.FLASH_MODE_STEADY;
      this.flashInverted = false;
      this.flashReducedIntensity = false;
      this.flashPhase = 0;
    }

    testPattern2() {
      var y;
      this.setScreenColor(Cept.COLOR_REDUCED_INTENSITY_BLUE);
      this.clear(0, 0, this.cols, this.rows);
      this.resetAttr();
      this.color = Cept.COLOR_WHITE;
      this.write("Attribute Test");

      y = 1;

      y += 1;
      this.resetAttr();
      this.move(0, y);
      this.write("Flash");
      this.move(20, y);
      this.flashMode = Cept.FLASH_MODE_FLASH;
      this.write("Normal");
      this.move(30, y);
      this.flashInverted = true;
      this.write("Inverted");

      y += 1;
      this.resetAttr();
      this.move(0, y);
      this.write("Reduced Intensity");
      this.move(20, y);
      this.flashReducedIntensity = true;
      this.flashMode = Cept.FLASH_MODE_FLASH;
      this.write("Normal");
      this.move(30, y);
      this.flashInverted = true;
      this.write("Inverted");

      y += 1;
      this.resetAttr();
      this.move(0, y);
      this.write("Fast");
      this.flashMode = Cept.FLASH_MODE_FAST;
      this.move(25, y);
      this.flashPhase = 0;
      this.write("One");
      this.move(30, y);
      this.flashPhase = 1;
      this.write("Two");
      this.move(35, y);
      this.flashPhase = 2;
      this.write("Three");

      y += 1;
      this.resetAttr();
      this.move(0, y);
      this.write("Fast/RI");
      this.move(10, y);
      this.flashMode = Cept.FLASH_MODE_FAST;
      this.flashReducedIntensity = true;
      this.move(25, y);
      this.flashPhase = 0;
      this.write("One");
      this.move(30, y);
      this.flashPhase = 1;
      this.write("Two");
      this.move(35, y);
      this.flashPhase = 2;
      this.write("Three");
    }
  }

  var cept = {
    init: function(selector, options={}) {
      return new Cept(selector, options);
    }
  }
  window.cept = cept;
})();
