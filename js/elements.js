export const elements = {
	CHAR_INPUT: document.getElementById("char-value"),
	CURR_CHAR: document.getElementById("current-char"),
	CURR_FG: document.getElementById("current-fg"),
	CURR_BG: document.getElementById("current-bg"),
	LAYER_ADD: document.getElementById("add-layer"),
	LAYERS_CONT: document.getElementById("layers"),
	GRID: document.querySelector("pixel-grid"),
	TOOL: document.getElementById("sect-tool"),
	SET_BACKGROUND: document.getElementById("set-background"),

	CHK_BASIC_TRANSLATE: document.getElementById("basic-translate"),
	CHK_MERGE_LAYER: document.getElementById("merge-layer"),
	CHK_PIXEL_TO_RECT: document.getElementById("pixel-to-rect"),
	CHK_CX_OPTIMIZE: document.getElementById("cx-optimize"),
	CHK_USE_PROC: document.getElementById("use-proc"),
	CHK_XY_COMMENTS: document.getElementById("xy-comments"),
	CHK_LAYER_COMMENTS: document.getElementById("layer-comments"),
	CHK_ADD_SETUPS: document.getElementById("add-setups"),
	CHK_LAYER_BY_LAYER: document.getElementById("layer-by-layer"),
	CHK_LAYER_TO_FRAME: document.getElementById("layer-to-frame"),
};

export function getCheckboxSettings() {
	return {
		basic: elements.CHK_BASIC_TRANSLATE.checked,
		mergeLayer: elements.CHK_MERGE_LAYER.checked,
		pixelToRect: elements.CHK_PIXEL_TO_RECT.checked,
		cxOptimize: elements.CHK_CX_OPTIMIZE.checked,
		useProc: elements.CHK_USE_PROC.checked,
		xyComments: elements.CHK_XY_COMMENTS.checked,
		layerComments: elements.CHK_LAYER_COMMENTS.checked,
		addSetups: elements.CHK_ADD_SETUPS.checked,
		layerByLayer: elements.CHK_LAYER_BY_LAYER.checked,
		layerToFrame: elements.CHK_LAYER_TO_FRAME.checked,
	};
}
