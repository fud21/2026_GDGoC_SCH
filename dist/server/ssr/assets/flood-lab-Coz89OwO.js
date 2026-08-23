import { a as require_react, o as __toESM, t as require_jsx_runtime } from "../index.js";
//#region app/flood-lab.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_INTERVENTIONS = [{
	id: "construction-sample",
	type: "blockage",
	x: 18,
	y: 11
}];
var TOOLS = [
	{
		id: "inspect",
		label: "조회",
		mark: "⌖",
		description: "셀 위험 조회"
	},
	{
		id: "levee",
		label: "제방",
		mark: "▰",
		description: "방어선 설치"
	},
	{
		id: "excavation",
		label: "굴착",
		mark: "▽",
		description: "하도 확장"
	},
	{
		id: "culvert",
		label: "배수",
		mark: "◎",
		description: "배수구 추가"
	},
	{
		id: "blockage",
		label: "공사",
		mark: "×",
		description: "통수 단면 차단"
	}
];
var BUILDINGS = [
	[
		4,
		3,
		22
	],
	[
		7,
		4,
		30
	],
	[
		10,
		3,
		19
	],
	[
		14,
		4,
		38
	],
	[
		18,
		3,
		24
	],
	[
		22,
		4,
		31
	],
	[
		27,
		3,
		23
	],
	[
		3,
		8,
		25
	],
	[
		7,
		8,
		34
	],
	[
		12,
		7,
		20
	],
	[
		17,
		8,
		42
	],
	[
		23,
		7,
		28
	],
	[
		28,
		8,
		21
	],
	[
		5,
		16,
		24
	],
	[
		9,
		18,
		35
	],
	[
		15,
		17,
		27
	],
	[
		20,
		18,
		44
	],
	[
		25,
		16,
		26
	],
	[
		29,
		18,
		32
	]
];
var canvasWidth = 1100;
var canvasHeight = 600;
var cellWidth = 32;
var cellHeight = 16;
var originX = 540;
var originY = 70;
var clamp = (value, min, max) => Math.min(max, Math.max(min, value));
var project = (x, y) => ({
	x: originX + (x - y) * (cellWidth / 2),
	y: originY + (x + y) * (cellHeight / 2)
});
function drawCell(context, x, y, fill, stroke = "rgba(226, 240, 231, 0.08)") {
	const point = project(x, y);
	context.beginPath();
	context.moveTo(point.x, point.y);
	context.lineTo(point.x + cellWidth / 2, point.y + cellHeight / 2);
	context.lineTo(point.x, point.y + cellHeight);
	context.lineTo(point.x - cellWidth / 2, point.y + cellHeight / 2);
	context.closePath();
	context.fillStyle = fill;
	context.fill();
	context.strokeStyle = stroke;
	context.lineWidth = .6;
	context.stroke();
}
function drawBuilding(context, x, y, height, flooded) {
	const point = project(x + .5, y + .5);
	const width = 12;
	const roofY = point.y - height;
	const roofColor = flooded ? "#d39462" : "#d7ded7";
	context.beginPath();
	context.moveTo(point.x, roofY);
	context.lineTo(point.x + width, roofY + 6);
	context.lineTo(point.x, roofY + 12);
	context.lineTo(point.x - width, roofY + 6);
	context.closePath();
	context.fillStyle = roofColor;
	context.fill();
	context.beginPath();
	context.moveTo(point.x - width, roofY + 6);
	context.lineTo(point.x, roofY + 12);
	context.lineTo(point.x, point.y + 7);
	context.lineTo(point.x - width, point.y + 1);
	context.closePath();
	context.fillStyle = flooded ? "#8d5b48" : "#87978f";
	context.fill();
	context.beginPath();
	context.moveTo(point.x, roofY + 12);
	context.lineTo(point.x + width, roofY + 6);
	context.lineTo(point.x + width, point.y + 1);
	context.lineTo(point.x, point.y + 7);
	context.closePath();
	context.fillStyle = flooded ? "#ad7052" : "#a8b6ae";
	context.fill();
}
function depthColor(depth) {
	if (depth >= 2) return "rgba(22, 83, 137, 0.92)";
	if (depth >= 1) return "rgba(29, 129, 178, 0.88)";
	if (depth >= .5) return "rgba(44, 175, 205, 0.80)";
	return "rgba(85, 216, 221, 0.68)";
}
function signed(value, suffix = "") {
	if (value === 0) return "변화 없음";
	return `${value > 0 ? "+" : ""}${value}${suffix}`;
}
function FloodLab() {
	const canvasRef = (0, import_react.useRef)(null);
	const [rainfall, setRainfall] = (0, import_react.useState)(96);
	const [duration, setDuration] = (0, import_react.useState)(180);
	const [discharge, setDischarge] = (0, import_react.useState)(980);
	const [tide, setTide] = (0, import_react.useState)(.8);
	const [activeTool, setActiveTool] = (0, import_react.useState)("inspect");
	const [interventions, setInterventions] = (0, import_react.useState)(DEFAULT_INTERVENTIONS);
	const [result, setResult] = (0, import_react.useState)(null);
	const [selectedCell, setSelectedCell] = (0, import_react.useState)(null);
	const [timeline, setTimeline] = (0, import_react.useState)(100);
	const [isRunning, setIsRunning] = (0, import_react.useState)(false);
	const [isPlaying, setIsPlaying] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [dirty, setDirty] = (0, import_react.useState)(false);
	const simulate = (0, import_react.useCallback)(async (nextInterventions = interventions) => {
		setIsRunning(true);
		setError("");
		setIsPlaying(false);
		try {
			const response = await fetch("/api/simulate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					rainfall,
					duration,
					discharge,
					tide,
					interventions: nextInterventions
				})
			});
			if (!response.ok) throw new Error("simulation failed");
			setResult(await response.json());
			setTimeline(100);
			setDirty(false);
		} catch {
			setError("계산 서버에 연결하지 못했습니다. 잠시 후 다시 실행해 주세요.");
		} finally {
			setIsRunning(false);
		}
	}, [
		discharge,
		duration,
		interventions,
		rainfall,
		tide
	]);
	(0, import_react.useEffect)(() => {
		simulate(DEFAULT_INTERVENTIONS);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!isPlaying) return;
		if (timeline >= 100) {
			setIsPlaying(false);
			return;
		}
		const timer = window.setInterval(() => {
			setTimeline((current) => Math.min(100, current + 1));
		}, 75);
		return () => window.clearInterval(timer);
	}, [isPlaying, timeline]);
	const cellMap = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		result?.cells.forEach((cell) => map.set(`${cell.x}-${cell.y}`, cell));
		return map;
	}, [result]);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const context = canvas.getContext("2d");
		if (!context) return;
		context.clearRect(0, 0, canvasWidth, canvasHeight);
		const background = context.createLinearGradient(0, 0, 0, canvasHeight);
		background.addColorStop(0, "#16332f");
		background.addColorStop(1, "#0d211f");
		context.fillStyle = background;
		context.fillRect(0, 0, canvasWidth, canvasHeight);
		for (let sum = 0; sum < 53; sum += 1) for (let x = 0; x < 32; x += 1) {
			const y = sum - x;
			if (y < 0 || y >= 22) continue;
			const cell = cellMap.get(`${x}-${y}`);
			const riverDistance = Math.abs(y - (11 + Math.sin(x * .31) * 1.7));
			const isRoad = x === 8 || x === 20 || y === 5 || y === 17;
			let terrainColor = riverDistance < 1.15 ? "#176571" : isRoad ? "#68746b" : cell && cell.elevation > 8 ? "#486a4a" : "#3b6146";
			if ((x + y) % 5 === 0 && riverDistance >= 1.15 && !isRoad) terrainColor = "#41694a";
			drawCell(context, x, y, terrainColor);
			if (cell && cell.depth > 0 && timeline > 0) {
				const arrivalPercent = cell.arrival / 12 * 100;
				if (timeline >= arrivalPercent) {
					const growth = clamp((timeline - arrivalPercent) / Math.max(12, 100 - arrivalPercent), 0, 1);
					const animatedDepth = cell.depth * (.28 + growth * .72);
					if (animatedDepth >= .04) drawCell(context, x, y, depthColor(animatedDepth), "rgba(127, 233, 237, 0.12)");
				}
			}
		}
		for (const [x, y, height] of BUILDINGS) {
			const cell = cellMap.get(`${x}-${y}`);
			drawBuilding(context, x, y, height, (cell && timeline >= cell.arrival / 12 * 100 ? cell.depth : 0) >= .2);
		}
		interventions.forEach((intervention) => {
			const point = project(intervention.x + .5, intervention.y + .5);
			const tool = TOOLS.find((item) => item.id === intervention.type);
			context.beginPath();
			context.arc(point.x, point.y - 7, 9, 0, Math.PI * 2);
			context.fillStyle = intervention.type === "blockage" ? "#ff9c6c" : "#e0f45d";
			context.fill();
			context.strokeStyle = "#102823";
			context.lineWidth = 2;
			context.stroke();
			context.fillStyle = "#102823";
			context.font = "700 11px Arial";
			context.textAlign = "center";
			context.fillText(tool?.mark ?? "•", point.x, point.y - 3);
		});
	}, [
		cellMap,
		interventions,
		timeline
	]);
	const placeIntervention = (x, y) => {
		setSelectedCell(cellMap.get(`${x}-${y}`) ?? null);
		if (activeTool === "inspect") return;
		setInterventions([...interventions, {
			id: `${activeTool}-${Date.now()}`,
			type: activeTool,
			x,
			y
		}].slice(-16));
		setDirty(true);
	};
	const handleMapPointer = (event) => {
		const bounds = event.currentTarget.getBoundingClientRect();
		const screenX = (event.clientX - bounds.left) * (canvasWidth / bounds.width);
		const screenY = (event.clientY - bounds.top) * (canvasHeight / bounds.height);
		const a = 2 * (screenX - originX) / cellWidth;
		const b = 2 * (screenY - originY) / cellHeight;
		const x = Math.floor((a + b) / 2);
		const y = Math.floor((b - a) / 2);
		if (x >= 0 && x < 32 && y >= 0 && y < 22) placeIntervention(x, y);
	};
	const handleMapKey = (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			placeIntervention(16, 11);
		}
	};
	const updateCondition = (setter, value) => {
		setter(value);
		setDirty(true);
	};
	const resetScenario = () => {
		setInterventions([]);
		setSelectedCell(null);
		setDirty(true);
	};
	const riskLabel = result ? result.metrics.riskScore >= 70 ? "심각" : result.metrics.riskScore >= 45 ? "주의" : "낮음" : "계산 중";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "app-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "topbar",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "brand-lockup",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "brand-symbol",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "RIVERSE" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "URBAN FLOOD DIGITAL TWIN" })] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "scenario-heading",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "eyebrow",
						children: "시나리오 01 · 포항시"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "냉천 산업지구 공사 영향 분석" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "topbar-actions",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "status-pill",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}), " 모델 준비됨"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "ghost-button",
							type: "button",
							onClick: resetScenario,
							children: "초기화"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: `run-button ${isRunning ? "is-running" : ""}`,
							type: "button",
							onClick: () => void simulate(),
							disabled: isRunning,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": "true",
								children: "▶"
							}), isRunning ? "수해 모델 계산 중" : dirty ? "변경사항 분석" : "다시 분석"]
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "workspace",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "control-panel",
					"aria-label": "시뮬레이션 조건",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel-section intro-section",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "section-index",
									children: "01 / CONDITIONS"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "어떤 비가 내리나요?" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "극한 강우와 하천 조건을 설정해 도시의 가장 취약한 순간을 재현합니다." })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel-section condition-list",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "range-field",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "시간당 강우" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("output", { children: [rainfall, " mm"] })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "range",
											min: "10",
											max: "180",
											step: "2",
											value: rainfall,
											onChange: (event) => updateCondition(setRainfall, Number(event.target.value))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "약한 비" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "극한 호우" })] })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "range-field",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "지속 시간" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("output", { children: [duration, " 분"] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "range",
										min: "30",
										max: "360",
										step: "15",
										value: duration,
										onChange: (event) => updateCondition(setDuration, Number(event.target.value))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "range-field",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "상류 유량" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("output", { children: [discharge.toLocaleString("ko-KR"), " ㎥/s"] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "range",
										min: "100",
										max: "2000",
										step: "20",
										value: discharge,
										onChange: (event) => updateCondition(setDischarge, Number(event.target.value))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "range-field",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "하류 수위" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("output", { children: [tide.toFixed(1), " m"] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "range",
										min: "0",
										max: "3",
										step: "0.1",
										value: tide,
										onChange: (event) => updateCondition(setTide, Number(event.target.value))
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel-section preset-section",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "section-title-row",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "section-index",
										children: "02 / PRESET"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "빠른 시나리오" })] })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "preset-card active",
									onClick: () => {
										setRainfall(96);
										setDuration(180);
										setDischarge(980);
										setTide(.8);
										setDirty(true);
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "preset-icon",
											children: "태풍"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "힌남노급 복합 홍수" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "강우 + 하천 범람 + 만조" })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "선택" })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "preset-card",
									onClick: () => {
										setRainfall(60);
										setDuration(120);
										setDischarge(520);
										setTide(.3);
										setDirty(true);
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "preset-icon calm",
											children: "집중"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "도심 집중호우" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "배수 용량 초과 중심" })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "적용" })
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "model-note",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": "true",
								children: "i"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "MVP 수리 모델" }), "50m 격자 기반 상대 위험 분석입니다. 공식 방재 판단에는 보정된 정밀 모델이 필요합니다."] })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "map-stage",
					"aria-label": "3D 침수 시뮬레이션 지도",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "map-toolbar",
							role: "toolbar",
							"aria-label": "지도 편집 도구",
							children: [
								TOOLS.map((tool) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: activeTool === tool.id ? "active" : "",
									onClick: () => setActiveTool(tool.id),
									title: tool.description,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										"aria-hidden": "true",
										children: tool.mark
									}), tool.label]
								}, tool.id)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "toolbar-divider" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "undo-tool",
									disabled: !interventions.length,
									onClick: () => {
										setInterventions((current) => current.slice(0, -1));
										setDirty(true);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										"aria-hidden": "true",
										children: "↶"
									}), " 실행 취소"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "map-context",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "live-dot" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "가상 지형 · 냉천 하류" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "격자 50m · 계산 영역 1.76㎢" })] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
							ref: canvasRef,
							width: canvasWidth,
							height: canvasHeight,
							className: "simulation-canvas",
							onPointerDown: handleMapPointer,
							onKeyDown: handleMapKey,
							tabIndex: 0,
							"aria-label": `${TOOLS.find((tool) => tool.id === activeTool)?.label} 도구 선택됨. 지도를 클릭하거나 Enter 키를 눌러 적용하세요.`
						}),
						!result && !error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "map-loading",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), "첫 침수 시나리오를 계산하고 있습니다"]
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "map-error",
							role: "alert",
							children: error
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "map-hint",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: TOOLS.find((tool) => tool.id === activeTool)?.mark }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [TOOLS.find((tool) => tool.id === activeTool)?.label, " 도구"] }), activeTool === "inspect" ? "지도의 격자를 선택해 수심을 확인하세요." : "지도에서 변경할 위치를 클릭하세요."] })]
						}),
						selectedCell && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "cell-inspector",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": "선택 정보 닫기",
									onClick: () => setSelectedCell(null),
									children: "×"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"선택 격자 ",
									selectedCell.x + 1,
									"-",
									selectedCell.y + 1
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [selectedCell.depth.toFixed(2), " m"] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
									"예상 최대 수심 · 도달 ",
									selectedCell.arrival * 15,
									"분"
								] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "map-bottom-bar",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "play-button",
									"aria-label": isPlaying ? "애니메이션 일시정지" : "침수 애니메이션 재생",
									onClick: () => {
										if (timeline >= 100) setTimeline(0);
										setIsPlaying((current) => !current);
									},
									children: isPlaying ? "Ⅱ" : "▶"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "time-label",
									children: "00:00"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									"aria-label": "시뮬레이션 시간",
									type: "range",
									min: "0",
									max: "100",
									value: timeline,
									onChange: (event) => {
										setTimeline(Number(event.target.value));
										setIsPlaying(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "time-label",
									children: "03:00"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "depth-legend",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "수심" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "depth-1" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "0.2m" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "depth-2" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "1m" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "depth-3" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "2m+" })
									]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "insight-panel",
					"aria-label": "분석 결과",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "risk-summary",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "section-index",
									children: "LIVE RISK ASSESSMENT"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "risk-title-row",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "종합 위험도" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "현재 공사안 기준" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `risk-badge risk-${riskLabel}`,
										children: riskLabel
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "risk-score",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: result?.metrics.riskScore ?? "—" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/ 100" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "risk-meter",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { style: { width: `${result?.metrics.riskScore ?? 0}%` } })
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `delta-banner ${(result?.comparison.deltaRisk ?? 0) > 0 ? "worse" : "better"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										"aria-hidden": "true",
										children: (result?.comparison.deltaRisk ?? 0) > 0 ? "↑" : "↓"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["기준안 대비 위험도 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: signed(result?.comparison.deltaRisk ?? 0, "점") })] })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "metric-grid",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "최대 수심" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [result?.metrics.maxDepth.toFixed(2) ?? "—", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: " m" })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
										className: "metric-bar",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { style: { width: `${Math.min(100, (result?.metrics.maxDepth ?? 0) * 28)}%` } })
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "침수 면적" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [result?.metrics.floodedArea.toFixed(2) ?? "—", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: " ㎢" })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
										className: "metric-bar",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { style: { width: `${Math.min(100, (result?.metrics.floodedArea ?? 0) * 50)}%` } })
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "영향 건물" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [result?.metrics.affectedBuildings ?? "—", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: " 동" })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", {
										className: "metric-caption",
										children: "산업시설 포함"
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "노출 도로" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [result?.metrics.exposedRoads.toFixed(1) ?? "—", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: " km" })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", {
										className: "metric-caption",
										children: "통행 제한 예상"
									})
								] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "impact-section",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "section-title-row",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "section-index",
										children: "IMPACT DELTA"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "공사 전후 영향" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "compare-chip",
										children: "기준안 비교"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "comparison-bars",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "기준 시나리오" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: result?.comparison.baselineRisk ?? "—" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("u", { style: { width: `${result?.comparison.baselineRisk ?? 0}%` } }) })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "현재 공사안" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: result?.metrics.riskScore ?? "—" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("u", {
										className: "current",
										style: { width: `${result?.metrics.riskScore ?? 0}%` }
									}) })] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "cost-impact",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "예상 피해액 변화" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: signed(result?.comparison.deltaDamage ?? 0, "억 원") })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "alerts-section",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "section-title-row",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "section-index",
										children: "PRIORITY ALERTS"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "우선 확인 지점" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [interventions.length + 2, "건"] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "alert-card severe",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "01" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "냉천교 상류 통수 저하" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "공사 구조물 상류에 수위 상승이 집중됩니다." })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "심각" })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "alert-card",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "02" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "산업로 저지대" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
											"약 ",
											result?.metrics.firstArrivalMinutes ?? 0,
											"분 후 첫 침수가 예상됩니다."
										] })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "주의" })
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
							className: "panel-footer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: result?.model ?? "RIVERSE rapid-grid v0.1" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Google Solution Challenge MVP" })]
						})
					]
				})
			]
		})]
	});
}
//#endregion
export { FloodLab };
