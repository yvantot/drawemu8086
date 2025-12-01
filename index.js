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

const brush_setting = {
	fgc: "0",
	bgc: "F",
	char: " ",
};

const mouse_state = {
	is_pressed: false,
};

class PixelGrid extends HTMLElement {
	static get observedAttributes() {
		return ["rows", "columns", "size", "has-border"];
	}

	constructor() {
		super();
		this.addEventListener("contextmenu", (e) => e.preventDefault());
		this.addEventListener("mousedown", () => (mouse_state.is_pressed = true));
		this.addEventListener("mouseup", () => (mouse_state.is_pressed = false));

		this.addEventListener("click", (e) => {
			this.paint(e, true);
		});

		this.addEventListener("mousemove", (e) => {
			this.paint(e);
		});
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
		const target = e.target;

		e.target.innerHTML = brush_setting.char;
		target.style.color = emuColors[brush_setting.fgc];
		target.style.backgroundColor = emuColors[brush_setting.bgc];

		target.dataset.color = `${brush_setting.bgc}${brush_setting.fgc}`;
		target.dataset.char = `${brush_setting.char.charCodeAt(0).toString(16)}`;
	}

	render() {
		const size = parseInt(this.getAttribute("size")) || 10;
		const rows = parseInt(this.getAttribute("rows")) || 25;
		const columns = parseInt(this.getAttribute("columns")) || 80;
		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < columns; j++) {
				const cell = document.createElement("div");
				cell.dataset.xy = `${i},${j}`;
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

			if (this.getAttribute("color-for") == "fg") brush_setting.fgc = target.dataset.color;
			if (this.getAttribute("color-for") == "bg") brush_setting.bgc = target.dataset.color;
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

document.getElementById("brush-character").addEventListener("keyup", (e) => {
	if (e.key.length > 1) return;
	e.target.value = "";
	const char = e.key[0];
	e.target.value = char;
	brush_setting.char = char;
});

document.getElementById("grid-menu").addEventListener("click", (e) => {
	if (e.target.nodeName == "DIV") return;
	const target = e.target.closest("svg");
	if (!target) return;
	switch (target.dataset.feature) {
		case "zoom-in": {
			const pixel_grid = document.querySelector("pixel-grid");
			let current_zoom = pixel_grid.style.scale ? parseFloat(pixel_grid.style.scale) : 1;
			current_zoom += 0.2;
			pixel_grid.style.scale = Math.min(current_zoom, 2);
			break;
		}
		case "zoom-out": {
			const pixel_grid = document.querySelector("pixel-grid");
			let current_zoom = pixel_grid.style.scale ? parseFloat(pixel_grid.style.scale) : 1;
			current_zoom -= 0.2;
			pixel_grid.style.scale = Math.max(current_zoom, 0.7);
			break;
		}
		case "clear": {
			document.querySelectorAll(".pixel-cell").forEach((cell) => {
				if (!cell.hasAttribute("data-color")) return;
				cell.style.color = emuColors["F"];
				cell.style.backgroundColor = emuColors["0"];

				cell.innerHTML = "";
				cell.removeAttribute("data-color");
				cell.removeAttribute("data-char");
			});
			break;
		}
		case "translate": {
			let code = "";
			document.querySelectorAll("div[data-char]").forEach((e) => {
				code += `
MOV AH, 02H
MOV BH, 00H
MOV DH, ${e.dataset.xy.split(",")[0]}
MOV DL, ${e.dataset.xy.split(",")[1]}
INT 10H

MOV AH, 09H
MOV AL, 0${e.dataset.char}H
MOV BH, 0
MOV BL, 0${e.dataset.color}H
MOV CX, 1
INT 10H
`;
			});

			const blob = new Blob([code], { type: "text/plain" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "TEST.asm";
			document.body.append(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			break;
		}
	}
});

customElements.define("color-palette", ColorPalette);
customElements.define("pixel-grid", PixelGrid);
