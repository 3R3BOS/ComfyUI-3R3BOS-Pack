// Developed by 3R3BOS
import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

app.registerExtension({
    name: "3R3BOS.ImageComparerSlider",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "Image Comparer (3R3BOS)") return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
            const node = this;

            this.setSize([420, 435]);
            this.min_size = [320, 365];

            this.color = "#242730";
            this.bgcolor = "#1b1e24";

            // --- SMART INPUT MANAGEMENT ---
            this.manageInputs = function () {
                const inputs = node.inputs;
                if (!inputs) return;

                let changed = true;
                while (changed) {
                    changed = false;
                    let lastConnectedIndex = -1;
                    for (let i = 0; i < node.inputs.length; i++) {
                        if (node.inputs[i].link !== null) lastConnectedIndex = i;
                    }

                    for (let i = 0; i < lastConnectedIndex; i++) {
                        if (node.inputs[i].link === null) {
                            node.removeInput(i);
                            changed = true;
                            break;
                        }
                    }
                }

                let lastLinkIndex = -1;
                for (let i = 0; i < node.inputs.length; i++) {
                    if (node.inputs[i].link !== null) lastLinkIndex = i;
                }

                const targetCount = lastLinkIndex + 2;
                const finalCount = Math.min(20, Math.max(1, targetCount));

                if (node.inputs.length > finalCount) {
                    for (let i = node.inputs.length - 1; i >= finalCount; i--) {
                        node.removeInput(i);
                    }
                } else if (node.inputs.length < finalCount) {
                    for (let i = node.inputs.length; i < finalCount; i++) {
                        node.addInput(`image_${i + 1}`, "IMAGE");
                    }
                }

                node.inputs.forEach((inp, i) => {
                    const expectedName = `image_${i + 1}`;
                    if (inp.name !== expectedName || inp.label !== expectedName) {
                        inp.name = expectedName;
                        inp.label = expectedName;
                    }
                });
            };

            setTimeout(() => { this.manageInputs(); }, 100);

            this.onConnectionsChange = function (type, index, connected, link_info, slotObj) {
                if (type === 1) { this.manageInputs(); }
            };

            // --- SLIDER WIDGET DESIGN ---
            const styleId = "refiner-compare-style-3r3bos";
            if (!document.getElementById(styleId)) {
                const styleEl = document.createElement("style");
                styleEl.id = styleId;
                styleEl.textContent = `
                    .refiner-slider-input {
                        -webkit-appearance: none;
                        width: 100%;
                        height: 6px;
                        background: rgba(255, 255, 255, 0.08);
                        border-radius: 3px;
                        outline: none;
                        margin: 0;
                        border: 1px solid rgba(255, 255, 255, 0.03);
                        box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
                    }
                    .refiner-slider-input::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 14px;
                        height: 14px;
                        border-radius: 50%;
                        background: #00b4d8;
                        cursor: pointer;
                        border: 1.5px solid #ffffff;
                        box-shadow: 0 0 8px rgba(0, 180, 216, 0.8);
                        transition: transform 0.15s, background-color 0.15s, box-shadow 0.15s;
                    }
                    .refiner-slider-input::-webkit-slider-thumb:hover {
                        transform: scale(1.3);
                        background: #ffffff;
                        box-shadow: 0 0 12px rgba(0, 180, 216, 1);
                    }
                `;
                document.head.appendChild(styleEl);
            }

            const container = document.createElement("div");
            container.style.cssText = "display:flex; flex-direction:column; background:#242730; color:#eee; padding:12px; border-radius:8px; height:100%; box-sizing:border-box; overflow:hidden; font-family:sans-serif; border:1px solid rgba(0, 180, 216, 0.2); box-shadow:0 8px 32px rgba(0,0,0,0.5);";

            const imageArea = document.createElement("div");
            imageArea.style.cssText = "flex-grow:1; position:relative; background:#191b22; border-radius:6px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); min-height:220px; box-shadow:inset 0 0 12px rgba(0,0,0,0.8); pointer-events:auto;";

            const placeholder = document.createElement("div");
            placeholder.textContent = "Waiting for images...";
            placeholder.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#444a54;font-style:italic;font-size:12px;";
            imageArea.appendChild(placeholder);

            const imgStack = document.createElement("div");
            imgStack.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
            imageArea.appendChild(imgStack);

            const infoOverlay = document.createElement("div");
            infoOverlay.style.cssText = "position:absolute; bottom:8px; left:8px; background:rgba(10,10,12,0.85); padding:4px 8px; border-radius:12px; font-size:11px; pointer-events:none; border:1px solid rgba(0,180,216,0.3); backdrop-filter:blur(4px); z-index:1000;";
            infoOverlay.innerHTML = '<span id="step-lbl" style="font-weight:700;color:#00b4d8;font-family:monospace;">0 / 0</span>';
            imageArea.appendChild(infoOverlay);

            // --- SYNCHRONIZED PAN & ZOOM ---
            let scale = 1; let panX = 0; let panY = 0;
            let isPanning = false; let startX = 0; let startY = 0;

            imageArea.addEventListener("wheel", (e) => {
                e.preventDefault();
                const zoomSpeed = 0.12;
                const oldScale = scale;
                if (e.deltaY < 0) { scale = Math.min(15, scale + zoomSpeed * scale); } 
                else { scale = Math.max(1, scale - zoomSpeed * scale); }

                const rect = imageArea.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                panX = mouseX - (mouseX - panX) * (scale / oldScale);
                panY = mouseY - (mouseY - panY) * (scale / oldScale);

                if (scale === 1) { panX = 0; panY = 0; }
                applyTransform();
            });

            imageArea.addEventListener("pointerdown", (e) => {
                if (e.button === 0 || e.button === 1) {
                    isPanning = true;
                    startX = e.clientX - panX;
                    startY = e.clientY - panY;
                    imageArea.style.cursor = "grabbing";
                    imageArea.setPointerCapture(e.pointerId);
                    e.preventDefault();
                }
            });

            imageArea.addEventListener("pointermove", (e) => {
                if (!isPanning) return;
                panX = e.clientX - startX;
                panY = e.clientY - startY;
                applyTransform();
            });

            imageArea.addEventListener("pointerup", (e) => {
                if (isPanning) {
                    isPanning = false;
                    imageArea.style.cursor = "default";
                    imageArea.releasePointerCapture(e.pointerId);
                }
            });

            imageArea.addEventListener("dblclick", () => {
                scale = 1; panX = 0; panY = 0;
                applyTransform();
            });

            function applyTransform() {
                imgStack.style.transformOrigin = "0 0";
                imgStack.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
            }

            // --- CONTROLS ASSEMBLY ---
            const controls = document.createElement("div");
            controls.style.cssText = "margin-top:12px;padding:0 4px;";

            const sliderLabel = document.createElement("div");
            sliderLabel.style.cssText = "display:flex; justify-content:space-between; font-size:11px; color:#8f9cae; margin-bottom:6px; font-weight:600; text-transform:uppercase;";
            sliderLabel.innerHTML = "<span>Image 1</span><span>Image 2</span>";

            const sliderRow = document.createElement("div");
            sliderRow.style.cssText = "display:flex; align-items:center; gap:10px; width:100%;";

            const playBtn = document.createElement("button");
            playBtn.innerHTML = "▶";
            playBtn.style.cssText = "background:rgba(0,180,216,0.15); border:1px solid rgba(0,180,216,0.3); color:#00b4d8; border-radius:4px; width:28px; height:24px; cursor:pointer; font-size:11px; display:flex; align-items:center; justify-content:center; transition:all 0.15s; font-weight:bold; flex-shrink:0;";

            const slider = document.createElement("input");
            slider.type = "range";
            slider.className = "refiner-slider-input";
            slider.style.cssText = "flex-grow:1; margin:0;";
            slider.min = "0"; slider.max = "0"; slider.value = "0"; slider.step = "0.01";
            slider.disabled = true;

            sliderRow.appendChild(playBtn);
            sliderRow.appendChild(slider);
            controls.appendChild(sliderLabel);
            controls.appendChild(sliderRow);
            container.appendChild(imageArea);
            container.appendChild(controls);

            this.addDOMWidget("refiner_widget", "custom_html", container, { serialize: false, hideOnZoom: false });

            let cachedImages = [];
            let isPlaying = false;
            let playInterval = null;
            let loopDirection = 1;

            playBtn.addEventListener("click", () => {
                if (isPlaying) { stopPlayback(); } else { startPlayback(); }
            });

            slider.addEventListener("mousedown", stopPlayback);

            function startPlayback() {
                if (cachedImages.length <= 1) return;
                isPlaying = true;
                playBtn.innerHTML = "⏸";
                playBtn.style.background = "#00b4d8";
                playBtn.style.color = "#ffffff";

                playInterval = setInterval(() => {
                    let val = parseFloat(slider.value);
                    const maxVal = cachedImages.length - 1;
                    val += 0.04 * loopDirection;

                    if (val >= maxVal) { val = maxVal; loopDirection = -1; }
                    else if (val <= 0) { val = 0; loopDirection = 1; }

                    slider.value = val.toFixed(2);
                    updateDisplay();
                }, 80);
            }

            function stopPlayback() {
                isPlaying = false;
                playBtn.innerHTML = "▶";
                playBtn.style.background = "rgba(0,180,216,0.15)";
                playBtn.style.color = "#00b4d8";
                if (playInterval) {
                    clearInterval(playInterval);
                    playInterval = null;
                }
            }

            this.stopPlayback = stopPlayback;

            // FIX SECURITY: Intégration du système de fallback intelligent si slot_index est manquant
            function getSourceName(imgObj, fallbackIndex) {
                const index = (imgObj && imgObj.slot_index !== undefined) ? imgObj.slot_index : fallbackIndex;
                if (index === undefined || index === null) return "Unknown";

                const input = node.inputs[index];
                if (input && input.link !== null) {
                    const link = app.graph.links[input.link];
                    if (link) {
                        const sourceNode = app.graph.getNodeById(link.origin_id);
                        if (sourceNode) {
                            let name = sourceNode.title || sourceNode.type;
                            return name.length > 22 ? name.substring(0, 20) + ".." : name;
                        }
                    }
                }
                return `Image ${index + 1}`;
            }

            function updateDisplay() {
                if (cachedImages.length === 0) return;
                const val = parseFloat(slider.value);
                const lowerIndex = Math.floor(val);
                const upperIndex = Math.ceil(val);
                const fraction = val - lowerIndex;

                infoOverlay.querySelector("#step-lbl").textContent = `${(val + 1).toFixed(1)} / ${cachedImages.length}`;

                // On passe l'index du slider en paramètre de repli (fallbackIndex)
                let leftName = getSourceName(cachedImages[lowerIndex]?.data, lowerIndex);
                let rightName = getSourceName(cachedImages[upperIndex]?.data, upperIndex);
                
                let leftColor = fraction < 0.5 ? "#00b4d8" : "#8f9cae";
                let rightColor = fraction >= 0.5 ? "#00b4d8" : "#8f9cae";

                sliderLabel.innerHTML = `
                    <span style="color: ${leftColor}; font-weight: ${fraction < 0.5 ? 'bold' : 'normal'}">${leftName}</span>
                    <span style="color: ${rightColor}; font-weight: ${fraction >= 0.5 ? 'bold' : 'normal'}">${rightName}</span>
                `;

                cachedImages.forEach((imgObj, i) => {
                    const imgEl = imgObj.element;
                    if (!imgEl) return;
                    if (i < lowerIndex) { imgEl.style.opacity = 1; imgEl.style.zIndex = i; }
                    else if (i === lowerIndex) { imgEl.style.opacity = 1; imgEl.style.zIndex = i; }
                    else if (i === upperIndex) { imgEl.style.opacity = fraction; imgEl.style.zIndex = i; }
                    else { imgEl.style.opacity = 0; imgEl.style.zIndex = i; }
                });
            }

            slider.addEventListener("input", updateDisplay);

            this.onExecuted = function (message) {
                if (!message || !message.slider_images) return;
                imgStack.innerHTML = "";
                cachedImages = [];
                placeholder.style.display = "none";
                
                const imagesData = message.slider_images;
                imagesData.forEach((imgData, index) => {
                    const img = new Image();
                    img.src = api.apiURL(`/view?filename=${imgData.filename}&type=${imgData.type}&subfolder=${imgData.subfolder}`);
                    img.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;transition:none;";
                    img.style.opacity = index === 0 ? 1 : 0;
                    imgStack.appendChild(img);
                    cachedImages.push({ data: imgData, element: img });
                });
                
                if (cachedImages.length > 1) {
                    slider.max = cachedImages.length - 1;
                    slider.disabled = false;
                    slider.value = "0";
                    playBtn.disabled = false;
                    playBtn.style.opacity = "1";
                } else {
                    slider.max = 0;
                    slider.disabled = true;
                    stopPlayback();
                    playBtn.disabled = true;
                    playBtn.style.opacity = "0.5";
                }
                updateDisplay();
            };

            return r;
        };

        if (!nodeType.prototype.onRemoved.__patched) {
            const onRemoved = nodeType.prototype.onRemoved;
            nodeType.prototype.onRemoved = function() {
                if (this.stopPlayback) { this.stopPlayback(); }
                if (onRemoved) onRemoved.apply(this, arguments);
            };
            nodeType.prototype.onRemoved.__patched = true;
        }
    }
});
