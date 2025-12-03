import { elements, getCheckboxSettings } from "./elements.js";
import { throttle } from "./utils.js";

const getStruct = () => {
	return {
		LAYER: {
			id: null,
			name: null,
			visible: null,
			pixels: {},
		},
	};
};

const layers = [];

let current_layer_id = null;

const emuColors = {
	0: "rgb(0, 0, 0)",
	1: "rgb(0, 0, 128)",
	2: "rgb(0, 128, 0)",
	3: "rgb(0, 128, 128)",
	4: "rgb(128, 0, 0)",
	5: "rgb(128, 0, 128)",
	6: "rgb(128, 128, 0)",
	7: "rgb(192, 192, 192)",
	8: "rgb(128, 128, 128)",
	9: "rgb(0, 0, 255)",
	A: "rgb(0, 255, 0)",
	B: "rgb(0, 255, 255)",
	C: "rgb(255, 0, 0)",
	D: "rgb(255, 0, 255)",
	E: "rgb(255, 255, 0)",
	F: "rgb(255, 255, 255)",
};

const rgbToEmu = Object.fromEntries(Object.entries(emuColors).map(([k, v]) => [v, k]));

const brush_setting = {
	fgc: "0",
	bgc: "F",
	char: " ",
};

const MouseState = {
	LEFT: 0,
	MIDDLE: 1,
	RIGHT: 2,
};

const mouse_state = {
	is_pressed: false,
	button: null,
};

const render_pixels_throt = throttle(render_pixels, 100);

function render_pixels() {
	const painted_pixels = elements.GRID.querySelectorAll(".pixel-cell[style]");
	for (let i = 0; i < painted_pixels.length; i++) {
		painted_pixels[i].removeAttribute("style");
		painted_pixels[i].innerHTML = "";
	}
	// Render the top most first, then store the painted pixels, then check if it's painted, and skip the lower ones
	const rendered_pixels = new Set();

	for (let i = layers.length - 1; i >= 0; i--) {
		if (layers[i].visible == false) continue; // Skip rendering layers that ain't visible
		const pixels_xy = Object.keys(layers[i].pixels);

		// Loop over through the layers pixel
		for (let j = 0; j < pixels_xy.length; j++) {
			if (rendered_pixels.has(pixels_xy[j])) continue;
			rendered_pixels.add(pixels_xy[j]);

			const pixel_data = layers[i].pixels[pixels_xy[j]];
			const pixel_element = document.getElementById(pixels_xy[j]);

			pixel_element.style.backgroundColor = emuColors[pixel_data.bgc];
			pixel_element.style.color = emuColors[pixel_data.fgc];
			pixel_element.innerHTML = pixel_data.char;
		}
	}
}

class PixelGrid extends HTMLElement {
	static get observedAttributes() {
		return ["rows", "columns", "size", "has-border"];
	}

	constructor() {
		super();

		this.addEventListener("contextmenu", (e) => e.preventDefault());
		this.addEventListener("mousedown", (e) => {
			mouse_state.is_pressed = true;
			mouse_state.button = e.button;
		});
		this.addEventListener("mouseleave", () => {
			mouse_state.is_pressed = false;
			mouse_state.button = null;
		});
		this.addEventListener("mouseup", () => {
			mouse_state.is_pressed = false;
			mouse_state.button = null;
		});

		this.addEventListener("click", (e) => this.paint(e, true));
		this.addEventListener("mousemove", (e) => this.paint(e));
	}

	connectedCallback() {
		this.render();
	}
	attributeChangedCallback() {
		this.render();
	}

	paint(e, click) {
		if (mouse_state.is_pressed == false && !click) return;
		if (!e.target.classList.contains("pixel-cell")) return;
		if (current_layer_id == null) return;

		const pixel = e.target;
		const layer_index = layers.findIndex((e) => e.id == current_layer_id);
		const layer = layers[layer_index];
		const id = pixel.id;

		if (mouse_state.button == MouseState.LEFT) {
			layer.pixels[id] = { fgc: brush_setting.fgc, bgc: brush_setting.bgc, char: " " };
		} else if (mouse_state.button == MouseState.RIGHT) {
			const bgc = rgbToEmu[pixel.style.backgroundColor] ?? "0";
			layer.pixels[id] = { fgc: brush_setting.fgc, bgc: bgc, char: `${brush_setting.char}` };
		} else if (mouse_state.button == MouseState.MIDDLE) {
			delete layer.pixels[id];
		}

		render_pixels();
	}

	render() {
		const size = parseInt(this.getAttribute("size")) || 10;
		const rows = parseInt(this.getAttribute("rows")) || 25;
		const columns = parseInt(this.getAttribute("columns")) || 80;
		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < columns; j++) {
				const cell = document.createElement("div");
				const xy = `${i},${j}`;
				cell.id = xy;
				cell.classList.add("pixel-cell");
				this.append(cell);
			}
		}

		this.style.gridTemplateColumns = `repeat(${columns}, ${size}px)`;
		this.style.gridTemplateRows = `repeat(${rows}, ${size}px)`;
	}
}

class ColorPalette extends HTMLElement {
	constructor() {
		super();

		this.addEventListener("click", (e) => {
			if (!e.target.classList.contains("color-cell")) return;
			const target = e.target;
			if (this.getAttribute("color-for") == "fg") {
				brush_setting.fgc = target.dataset.color;
				elements.CURR_FG.style.backgroundColor = target.style.backgroundColor;
			}
			if (this.getAttribute("color-for") == "bg") {
				brush_setting.bgc = target.dataset.color;
				elements.CURR_BG.style.backgroundColor = target.style.backgroundColor;
			}
		});
	}
	connectedCallback() {
		this.render();
	}
	render() {
		for (let i in emuColors) {
			const cell = document.createElement("div");
			cell.classList.add("color-cell");
			cell.dataset.color = i;
			cell.style.backgroundColor = emuColors[i];
			this.append(cell);
		}
	}
}

class CharPalette extends HTMLElement {
	constructor() {
		super();
		this.default_characters = "!@#$%^&*()-=_+[];'\\/,.<>|{}";

		this.addEventListener("click", (e) => {
			if (!e.target.classList.contains("char-cell")) return;
			const target = e.target;
			elements.CHAR_INPUT.value = target.dataset.char;
			elements.CURR_CHAR.innerHTML = target.dataset.char;
			brush_setting.char = target.dataset.char;
		});
	}

	connectedCallback() {
		this.render();
	}
	render() {
		for (let i in this.default_characters) {
			const char = document.createElement("div");
			char.classList.add("char-cell");
			char.dataset.char = this.default_characters[i];
			char.innerHTML = this.default_characters[i];
			this.append(char);
		}
	}
}

class DrawingLayer extends HTMLElement {
	constructor() {
		super();
		const name = prompt("Layer name: ");
		this.layer = getStruct().LAYER;
		this.layer.id = layers.length ? Math.max(...layers.map((e) => e.id)) + 1 : 0;
		if (name == null) this.layer.name = `Layer ${this.layer.id}`;
		else if (name.length == 0) this.layer.name = `Layer ${this.layer.id}`;
		else this.layer.name = name;

		this.layer.visible = true;
		layers.push(this.layer);

		this.addEventListener("click", (e) => {
			if (e.target.closest(".layer-tool")) return;
			current_layer_id = this.layer.id;
			const children = elements.LAYERS_CONT.children;
			for (let i = 0; i < children.length; i++) {
				if (children[i] == this) this.classList.add("layer-selected");
				else children[i].classList.remove("layer-selected");
			}
		});
	}

	connectedCallback() {
		this.render();

		this.querySelector("svg[data-feature='layer-delete'").addEventListener("click", () => {
			const layer_index = layers.findIndex((e) => e.id == this.layer.id);
			layers.splice(layer_index, 1);
			this.remove();
			render_pixels();
		});

		this.querySelector("svg[data-feature='layer-up'").addEventListener("click", () => {
			const layer_index = layers.findIndex((e) => e.id == this.layer.id);
			if (layer_index - 1 >= 0) {
				[layers[layer_index], layers[layer_index - 1]] = [layers[layer_index - 1], layers[layer_index]];
				const prev = this.previousElementSibling;
				if (prev) {
					this.parentNode.insertBefore(this, prev);
				}
				render_pixels();
			}
		});

		this.querySelector("svg[data-feature='layer-down'").addEventListener("click", () => {
			const layer_index = layers.findIndex((e) => e.id == this.layer.id);
			if (layer_index + 1 < layers.length) {
				[layers[layer_index], layers[layer_index + 1]] = [layers[layer_index + 1], layers[layer_index]];
				const next = this.nextSibling;
				if (next) {
					this.parentNode.insertBefore(next, this);
				}
				render_pixels();
			}
		});

		this.querySelector("svg[data-feature='visible'").addEventListener("click", () => {
			const layer_index = layers.findIndex((e) => e.id == this.layer.id);
			layers[layer_index].visible = !layers[layer_index].visible;
			render_pixels();
		});
	}

	render() {
		this.innerHTML = this.layer.name;
		this.innerHTML += `
            <div class="layer-tool">
                <svg data-feature="layer-delete"><use href="#delete"></use></svg>
                <svg data-feature="visible"><use href="#visible"></use></svg>
                <svg data-feature="layer-up"><use href="#up"></use></svg>
                <svg data-feature="layer-down"><use href="#down"></use></svg>
            </div>
        `;
	}
}

function init() {
	elements.CURR_CHAR.innerHTML = brush_setting.char;
	elements.CURR_FG.style.backgroundColor = emuColors[brush_setting.fgc];
	elements.CURR_BG.style.backgroundColor = emuColors[brush_setting.bgc];

	customElements.define("char-palette", CharPalette);
	customElements.define("color-palette", ColorPalette);
	customElements.define("pixel-grid", PixelGrid);
	customElements.define("drawing-layer", DrawingLayer);

	elements.CHAR_INPUT.addEventListener("keyup", (e) => {
		if (e.key.length > 1) {
			e.target.value = "";
			const char = "";
			e.target.value = char;
			brush_setting.char = char;
			elements.CURR_CHAR.innerText = char;
			return;
		}
		e.target.value = "";
		const char = e.key[0];
		e.target.value = char;
		brush_setting.char = char;
		elements.CURR_CHAR.innerText = char;
	});

	elements.LAYER_ADD.addEventListener("click", () => {
		elements.LAYERS_CONT.append(document.createElement("drawing-layer"));
	});

	elements.TOOL.addEventListener("click", (e) => {
		if (e.target.nodeName == "SECTION") return;
		const target = e.target.closest("svg");
		if (!target) return;

		switch (target.dataset.feature) {
			case "zoom-in": {
				alert(1);
				break;
			}
			case "zoom-out": {
				alert(1);
				break;
			}
			case "translate": {
				const { basic, addSetups, cxOptimize, mergeLayer, layerComments, pixelToRect, useProc, xyComments, layerByLayer, layerToFrame } = getCheckboxSettings();

				let code = "";

				if (cxOptimize) {
					if (mergeLayer) code += cxOptimizedTranslate(mergeLayers());
					else if (layerByLayer) for (let i in layers) code += cxOptimizedTranslate(layers[i].pixels);
				} else if (pixelToRect) {
					null;
				} else if (useProc) {
					null;
				} else if (basic) {
					if (mergeLayer) code += basicTranslate(mergeLayers());
					else if (layerByLayer) for (let i in layers) code += basicTranslate(layers[i].pixels);
				}

				downloadData("DrawEmu8086.asm", code);
				break;
			}
		}
	});
}

function cxOptimizedTranslate(pixels) {
	// [/] Turn the whole layer into a row
	// [/] Then for every row, check from left to right,
	// [/] If the pixel have the same neighbour, then add CX
	// [/] If not, do another and repeat
	let code = "";
	const rows = {};
	for (let j in pixels) {
		const [x, y] = j.split(",");
		if (!rows[x]) rows[x] = [];
		rows[x].push([parseInt(y), `${pixels[j].bgc}${pixels[j].fgc}${pixels[j].char}`]);
	}
	for (let j in rows) {
		rows[j].sort((a, b) => a[0] - b[0]);
	}
	for (let j in rows) {
		console.log("Layer", j);
		let code_line = "";
		let cx = 1;
		let start_col = null;
		for (let p in rows[j]) {
			const index = parseInt(p);
			console.log;
			if (start_col == null) start_col = rows[j][index][0];
			if (rows[j][index][0] + 1 == rows[j][index + 1]?.[0] && rows[j][index][1] == rows[j][index + 1]?.[1]) {
				if (start_col == null) start_col = rows[j][index][0];
				cx += 1;
			} else {
				const bgc = rows[j][index][1][0];
				const fgc = rows[j][index][1][1];
				const char = rows[j][index][1][2].charCodeAt(0).toString(16);
				code_line += `
MOV AH, 02H
MOV BH, 00H
MOV DH, ${j}
MOV DL, ${start_col}
INT 10H

MOV AH, 09H
MOV AL, 0${char}H
MOV BH, 00H
MOV BL, 0${bgc}${fgc}H
MOV CX, ${cx}
INT 10H`;
				cx = 1;
				start_col = null;
			}
		}
		code += code_line;
	}
	return code;
}

function basicTranslate(pixels) {
	let code = "";
	for (let j in pixels) {
		const pixel = pixels[j];
		const [x, y] = j.split(",");
		const char = pixel.char.charCodeAt(0).toString(16);
		const fgc = pixel.fgc;
		const bgc = pixel.bgc;
		code += `
MOV AH, 02H
MOV BH, 00H
MOV DH, ${x}
MOV DL, ${y}
INT 10H

MOV AH, 09H
MOV AL, 0${char}H
MOV BH, 00H
MOV BL, 0${bgc}${fgc}H
MOV CX, 1
INT 10H
`;
	}
	return code;
}

function downloadData(filename, data) {
	const blob = new Blob([data], { type: "text/plain" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.append(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

function mergeLayers() {
	const pixels = {};
	const rendered_pixels = new Set();
	for (let i = layers.length - 1; i >= 0; i--) {
		if (layers[i].visible == false) continue; // Skip rendering layers that ain't visible
		const pixels_xy = Object.keys(layers[i].pixels);

		// Loop over through the layers pixel
		for (let j = 0; j < pixels_xy.length; j++) {
			if (rendered_pixels.has(pixels_xy[j])) continue;
			rendered_pixels.add(pixels_xy[j]);

			const pixel = layers[i].pixels[pixels_xy[j]];
			pixels[pixels_xy[j]] = pixel;
		}
	}
	return pixels;
}

init();
