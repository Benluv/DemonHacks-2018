(function () {
'use strict';

/**
 * Panel which holds controls
 * @class
 * @extends external:H.ui.Control
 */
class Panel extends H.ui.Control {
    /**
     * @param {string} header - panel title
     */
    constructor(header) {
        super();
        this.header_ = header;
        this.setAlignment('top-left');
    }
    renderInternal(el, doc) {
        this.addClass('dl-panel');
        el.innerHTML = `
            <div class="dl-panel__header">${this.header_}</div>
        `;
        super.renderInternal(el, doc);
    }
    addChild(control) {
        //subscribe on events of child controls
        control.setParentEventTarget(this);
        return super.addChild(control);
    }
}

/**
 * Range slider
 * @class
 * @extends external:H.ui.Control
 */
class Slider extends H.ui.Control {
    /**
     * @param {number} initValue - between 0..100
     */
    constructor(initValue = 50) {
        super();
        this.initValue = initValue;
    }
    renderInternal(el) {
        this.addClass('dl-slider');
        el.innerHTML = `<input
            type="range"
            min="0"
            max="100"
            value="${this.initValue}"
            autocomplete="off"
            class="dl-slider__input"
        />`;
        this.input = el.children[0];
        this.input.addEventListener('change', () => {
            this.dispatchEvent('change');
        });
    }
    /**
     * @returns {number} value always between 0..100
     */
    getValue() {
        return Number(this.input.value);
    }
}

/**
 * Slider with two handles
 * @class
 * @extends Slider
 */
class Range extends Slider {
    /**
     * @param {number[]} initRange
     */
    constructor(initRange = [0, 100]) {
        super(initRange[0]);
        this.initRange = initRange;
    }
    renderInternal(el) {
        super.renderInternal(el);
        this.addClass('dl-range');
        el.innerHTML += `<input
            type="range"
            min="0"
            max="100"
            value="${this.initRange[1]}"
            autocomplete="off"
            class="dl-slider__input"
        />`;
        this.input = el.children[0];
        this.input.addEventListener('change', () => {
            this.dispatchEvent('change');
        });
        this.input2 = el.children[1];
        this.input2.addEventListener('change', () => {
            this.dispatchEvent('change');
        });
    }
    /**
     * @param {number[]} range
     */
    getValue() {
        return [
            this.input.value,
            this.input2.value
        ].sort((a, b) => (a - b));
    }
}

/**
 * Label for Control
 * @class
 * @extends external:H.ui.Control
 */
class Label extends H.ui.Control {
    renderInternal() {
        this.addClass('dl-label');
    }
    /**
     * @param {string} html - label html
     */
    setHTML(html) {
        this.getElement().innerHTML = html;
        return this;
    }
}

/**
 * Color Legend Control
 * @class
 * @extends external:H.ui.Control
 */
class ColorLegend extends H.ui.Control {
    /**
     * @param {function} colorScale - scale with domain 0..1
     */
    constructor(colorScale) {
        super();
        this.colorScale = colorScale;
    }
    renderInternal(el) {
        this.addClass('dl-color-legend');
        this.labels = document.createElement('div');
        this.labels.className = 'dl-color-legend__labels';
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        for (let i = 0; i <= 1; i += 1 / canvas.width) {
            const x = i * canvas.width;
            ctx.fillStyle = this.colorScale(i);
            ctx.fillRect(x, 1, 1, canvas.height);
        }
        el.appendChild(canvas);
        el.appendChild(this.labels);
    }
    /**
     * @param {string[]} labels - label html
     */
    setLabels(labels) {
        this.labels.innerHTML = labels.map(
            label => `<div>${label}</div>`
        ).join('');
    }
}

Object.assign(window, {Panel, Slider, Range, Label, ColorLegend});

}());
