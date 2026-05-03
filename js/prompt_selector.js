// Developed by 3R3BOS
import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

const hexToRgba = (hex, alpha) => {
    if (!hex) return `rgba(0, 255, 136, ${alpha})`;
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

app.registerExtension({
    name: "3R3BOS.PromptSelector",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "Prompt Selector (3R3BOS)") return;

        // CSS for Modal
        const styleId = "3r3bos-prompt-modal-style";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
                .r3bos-modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.8); z-index: 10000;
                    display: flex; justify-content: center; align-items: center;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                .r3bos-modal {
                    background: #1a1a1a; border: 1px solid #333; border-radius: 8px;
                    width: 480px; padding: 25px; box-shadow: 0 10px 40px rgba(0,0,0,0.9);
                    color: #eee;
                }
                .r3bos-modal h3 { margin-top: 0; color: #00FF88; border-bottom: 1px solid #333; padding-bottom: 10px; font-weight: 600; }
                .r3bos-form-group { margin-bottom: 15px; }
                .r3bos-form-group label { display: block; font-size: 12px; color: #888; margin-bottom: 6px; }
                .r3bos-input, .r3bos-select {
                    width: 100%; padding: 10px; background: #111; border: 1px solid #333;
                    color: #fff; border-radius: 4px; box-sizing: border-box; font-family: inherit;
                }
                .r3bos-input:focus, .r3bos-select:focus { outline: none; border-color: #00FF88; }
                .r3bos-textarea { height: 120px; resize: vertical; }
                .r3bos-btn {
                    background: #2a2a2a; color: #fff; border: 1px solid #444; padding: 8px 12px;
                    border-radius: 4px; cursor: pointer; transition: 0.2s; font-weight: bold;
                }
                .r3bos-btn:hover { background: #3a3a3a; }
                .r3bos-btn-action { background: #151515; font-size: 14px; padding: 8px 10px; }
                .r3bos-btn-primary { background: rgba(0, 255, 136, 0.1); border-color: #00FF88; color: #00FF88; padding: 10px 20px;}
                .r3bos-btn-primary:hover { background: rgba(0, 255, 136, 0.2); }
                .r3bos-flex-row { display: flex; gap: 8px; align-items: center; }
            `;
            document.head.appendChild(style);
        }

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            if (onNodeCreated) onNodeCreated.apply(this, arguments);
            
            this.setSize([600, 500]);
            
            this.db = {};
            this.categories = [];
            this.activeCategory = null;
            this.activeSubcategory = null;
            this.selectedIds = new Set();
            this.hitBoxes = [];
            
            this.loadDB = () => {
                api.fetchApi("/3r3bos/prompts_db")
                    .then(res => res.json())
                    .then(data => {
                        if (data.error) return;
                        this.db = data;
                        this.categories = Object.keys(data);
                        if (!this.categories.includes(this.activeCategory)) {
                            this.activeCategory = this.categories.length > 0 ? this.categories[0] : null;
                            this.activeSubcategory = null;
                        }
                        
                        if (this.activeCategory) {
                            const subcats = Object.keys(this.db[this.activeCategory] || {}).filter(k => k !== "_meta");
                            if (!subcats.includes(this.activeSubcategory)) {
                                this.activeSubcategory = subcats.length > 0 ? subcats[0] : null;
                            }
                        }
                        this.setDirtyCanvas(true);
                    });
            };

            this.loadDB();

            // PURE CANVAS UI: Remove selected_items widget
            setTimeout(() => {
                const selIdx = this.widgets.findIndex(w => w.name === "selected_items");
                if (selIdx > -1) {
                    const wSel = this.widgets[selIdx];
                    wSel.type = "converted-widget";
                    wSel.hidden = true;
                    wSel.computeSize = () => [0, 0];
                    if (wSel.inputEl) wSel.inputEl.remove();
                    try {
                        const parsed = JSON.parse(wSel.value);
                        if (Array.isArray(parsed)) this.selectedIds = new Set(parsed);
                    } catch (e) { this.selectedIds = new Set(); }
                }

                const custIdx = this.widgets.findIndex(w => w.name === "custom_text");
                if (custIdx > -1) {
                    const wCust = this.widgets[custIdx];
                    wCust.type = "converted-widget";
                    wCust.hidden = true;
                    wCust.computeSize = () => [0, 0];
                    if (wCust.inputEl) wCust.inputEl.remove();
                }
                
                // base_text has been completely removed in python.
                this.setDirtyCanvas(true, true);
            }, 100);
        };

        const onDrawForeground = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function (ctx) {
            if (onDrawForeground) onDrawForeground.apply(this, arguments);
            if (this.flags.collapsed) return;

            // Enforce minimum size to prevent UI breaking
            if (this.size[0] < 600) this.size[0] = 600;
            if (this.size[1] < 550) this.size[1] = 550;

            // Moved up since base_text is gone
            const startY = 30; 
            const margin = 10;
            const w = this.size[0];
            let h = this.size[1];
            
            const col1W = Math.max(120, Math.floor(w * 0.2)); // Category
            const col2W = Math.max(120, Math.floor(w * 0.2)); // Subcategory
            let listH = h - startY - 110; 
            
            this.hitBoxes = [];

            // Top Bar
            const btnW = 150;
            const btnH = 28;
            const btnX = w - margin - btnW;
            const btnY = startY;
            
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, btnW, btnH, 6);
            ctx.fillStyle = "#252525"; ctx.fill();
            ctx.strokeStyle = "#444"; ctx.stroke();
            ctx.fillStyle = "#00FF88";
            ctx.font = "12px 'Segoe UI', Roboto, sans-serif";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText("⚙️ Database Editor", btnX + btnW/2, btnY + btnH/2);
            
            this.hitBoxes.push({ type: "manage", x: btnX, y: btnY, w: btnW, h: btnH });

            // Empty check
            if (this.categories.length === 0) {
                ctx.fillStyle = "#888";
                ctx.font = "italic 14px 'Segoe UI', Roboto, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("Database empty. Click Editor to add.", w / 2, startY + listH / 2);
                return;
            }

            const listsStartY = startY + 40;
            
            // Draw Category List (Col 1)
            let cy = listsStartY;
            this.categories.forEach((cat) => {
                const isSelected = this.activeCategory === cat;
                const boxH = 30;
                
                ctx.beginPath();
                ctx.roundRect(margin, cy, col1W, boxH, 6);
                
                if (isSelected) {
                    let catColor = "#00FF88";
                    if (this.db[cat] && this.db[cat]["_meta"] && this.db[cat]["_meta"].color) {
                        catColor = this.db[cat]["_meta"].color;
                    }
                    
                    let grad = ctx.createLinearGradient(margin, cy, margin + col1W, cy);
                    grad.addColorStop(0, hexToRgba(catColor, 0.15));
                    grad.addColorStop(1, "rgba(20, 20, 20, 0.5)");
                    ctx.fillStyle = grad;
                    ctx.fill();
                    ctx.strokeStyle = hexToRgba(catColor, 0.3);
                    ctx.stroke();
                    
                    ctx.fillStyle = catColor;
                    ctx.beginPath();
                    ctx.roundRect(margin, cy + 4, 3, boxH - 8, 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = "#161616";
                    ctx.fill();
                    ctx.strokeStyle = "#222";
                    ctx.stroke();
                }
                
                ctx.fillStyle = isSelected ? "#fff" : "#888";
                ctx.font = (isSelected ? "600 " : "400 ") + "12px 'Inter', 'Segoe UI', sans-serif";
                ctx.textAlign = "left";
                
                let displayCat = cat;
                const maxCatW = col1W - 24;
                if (ctx.measureText(displayCat).width > maxCatW) {
                    while (displayCat.length > 0 && ctx.measureText(displayCat + "...").width > maxCatW) {
                        displayCat = displayCat.substring(0, displayCat.length - 1);
                    }
                    displayCat += "...";
                }
                
                ctx.fillText(displayCat, margin + 12, cy + boxH / 2);
                
                this.hitBoxes.push({ type: "category", val: cat, x: margin, y: cy, w: col1W, h: boxH });
                cy += boxH + 6;
            });

            // Draw Subcategory List (Col 2)
            if (this.activeCategory && this.db[this.activeCategory]) {
                const subcats = Object.keys(this.db[this.activeCategory]).filter(k => k !== "_meta");
                let sy = listsStartY;
                const cx = margin * 2 + col1W;
                
                let catColor = this.db[this.activeCategory]?._meta?.color || "#00FF88";
                
                subcats.forEach((subcat) => {
                    const isSelected = this.activeSubcategory === subcat;
                    const boxH = 30;
                    
                    let subColor = this.db[this.activeCategory]?._meta?.subcolors?.[subcat] || catColor;
                    
                    ctx.beginPath();
                    ctx.roundRect(cx, sy, col2W, boxH, 6);
                    
                    if (isSelected) {
                        let grad = ctx.createLinearGradient(cx, sy, cx + col2W, sy);
                        grad.addColorStop(0, hexToRgba(subColor, 0.15));
                        grad.addColorStop(1, "rgba(20, 20, 20, 0.5)");
                        ctx.fillStyle = grad;
                        ctx.fill();
                        ctx.strokeStyle = hexToRgba(subColor, 0.3);
                        ctx.stroke();
                        
                        ctx.fillStyle = subColor;
                        ctx.beginPath();
                        ctx.roundRect(cx, sy + 4, 3, boxH - 8, 2);
                        ctx.fill();
                    } else {
                        ctx.fillStyle = "#111"; 
                        ctx.fill();
                        ctx.strokeStyle = "#1a1a1a";
                        ctx.stroke();
                    }
                    
                    ctx.fillStyle = isSelected ? "#fff" : "#777";
                    ctx.font = (isSelected ? "600 " : "400 ") + "12px 'Inter', 'Segoe UI', sans-serif";
                    ctx.textAlign = "left";
                    
                    let displaySub = subcat;
                    const maxSubW = col2W - 24;
                    if (ctx.measureText(displaySub).width > maxSubW) {
                        while (displaySub.length > 0 && ctx.measureText(displaySub + "...").width > maxSubW) {
                            displaySub = displaySub.substring(0, displaySub.length - 1);
                        }
                        displaySub += "...";
                    }
                    
                    ctx.fillText(displaySub, cx + 12, sy + boxH / 2);
                    
                    this.hitBoxes.push({ type: "subcategory", val: subcat, x: cx, y: sy, w: col2W, h: boxH });
                    sy += boxH + 6;
                });
            }

            // Draw Items List (Col 3)
            if (this.activeCategory && this.activeSubcategory && this.db[this.activeCategory][this.activeSubcategory]) {
                const items = this.db[this.activeCategory][this.activeSubcategory];
                let ix = margin * 3 + col1W + col2W;
                let iy = listsStartY;
                const pillH = 30;
                
                let catColor = this.db[this.activeCategory]?._meta?.color || "#00FF88";
                let subColor = this.db[this.activeCategory]?._meta?.subcolors?.[this.activeSubcategory] || catColor;
                
                items.forEach((item) => {
                    const isSelected = this.selectedIds.has(item.id);
                    ctx.font = "12px 'Segoe UI', Roboto, sans-serif";
                    
                    let itemColor = item.color || subColor;
                    
                    // Truncate text if it exceeds column width
                    let displayName = item.name;
                    const maxTextW = w - margin * 4 - col1W - col2W - 30;
                    if (ctx.measureText(displayName).width > maxTextW) {
                        while (displayName.length > 0 && ctx.measureText(displayName + "...").width > maxTextW) {
                            displayName = displayName.substring(0, displayName.length - 1);
                        }
                        displayName += "...";
                    }
                    
                    const textW = ctx.measureText(displayName).width;
                    const pillW = textW + 24;
                    
                    if (ix + pillW > w - margin) {
                        ix = margin * 3 + col1W + col2W;
                        iy += pillH + 8;
                    }
                    
                    ctx.beginPath();
                    ctx.roundRect(ix, iy, pillW, pillH, 15);
                    
                    if (isSelected) {
                        ctx.fillStyle = hexToRgba(itemColor, 0.15); ctx.fill();
                        ctx.strokeStyle = itemColor; ctx.lineWidth = 1.5; ctx.stroke();
                        ctx.lineWidth = 1;
                        ctx.fillStyle = "#fff";
                        ctx.font = "600 12px 'Inter', 'Segoe UI', sans-serif";
                    } else {
                        let grad = ctx.createLinearGradient(ix, iy, ix, iy + pillH);
                        grad.addColorStop(0, "#2a2a2a");
                        grad.addColorStop(1, "#1a1a1a");
                        ctx.fillStyle = grad; ctx.fill();
                        
                        ctx.strokeStyle = "#3a3a3a"; ctx.lineWidth = 1; ctx.stroke();
                        ctx.fillStyle = "#ccc";
                        ctx.font = "400 12px 'Inter', 'Segoe UI', sans-serif";
                    }
                    
                    ctx.textAlign = "center";
                    ctx.fillText(displayName, ix + pillW / 2, iy + pillH / 2);
                    
                    this.hitBoxes.push({ type: "item", val: item.id, x: ix, y: iy, w: pillW, h: pillH });
                    ix += pillW + 8;
                });
            }

            // --- PRE-CALCULATE SELECTED TAGS HEIGHT ---
            let reqSelectedH = 60; // Base min height
            if (this.selectedIds.size > 0) {
                let simPx = margin + 8;
                let simPy = 22;
                ctx.font = "12px 'Segoe UI', Roboto, sans-serif";
                
                Array.from(this.selectedIds).forEach(id => {
                    let itemName = id;
                    for (const cat in this.db) {
                        for (const sub in this.db[cat]) {
                            if (sub === "_meta") continue;
                            const found = this.db[cat][sub].find(i => i.id === id);
                            if (found) { itemName = found.name; break; }
                        }
                    }
                    
                    let displayItemName = itemName;
                    const maxTagTextW = w - margin * 4 - 40;
                    if (ctx.measureText(displayItemName).width > maxTagTextW) {
                        while (displayItemName.length > 0 && ctx.measureText(displayItemName + "...").width > maxTagTextW) {
                            displayItemName = displayItemName.substring(0, displayItemName.length - 1);
                        }
                        displayItemName += "...";
                    }

                    const tagW = ctx.measureText(displayItemName).width + 30;
                    const tagH = 26;
                    
                    if (simPx + tagW > w - margin - 8) {
                        simPx = margin + 8;
                        simPy += tagH + 6;
                    }
                    simPx += tagW + 6;
                });
                reqSelectedH = simPy + 26 + 12; // py + tagH + padding
            }

            // --- AUTO-EXPAND NODE IF NEEDED ---
            const baseListH = 260; // Guarantee minimum list height
            const minRequiredH = startY + 40 + 30 + baseListH + 10 + reqSelectedH + 10 + 100 + 10;
            
            if (h < minRequiredH) {
                this.size[1] = minRequiredH;
                h = minRequiredH; // update local ref
            }

            // Layout calculations for the two bottom boxes
            const extraH = Math.max(0, h - minRequiredH);
            const selectedH = reqSelectedH; // Automatic size, never artificial scaling
            const liveH = 100 + extraH * 0.6; // Give 60% of manual extra stretch to Live Preview
            
            // Ensure boxes stay bound by node height
            const liveY = h - liveH - 10;
            const prevY = liveY - selectedH - 10;
            
            // --- DRAW SELECTED TAGS BOX ---
            ctx.beginPath();
            ctx.roundRect(margin, prevY, w - margin * 2, selectedH, 8);
            ctx.fillStyle = "#0a0a0a"; ctx.fill();
            ctx.strokeStyle = "#1a1a1a"; ctx.stroke();
            
            ctx.fillStyle = "#555";
            ctx.font = "bold 10px 'Inter', 'Segoe UI', sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText("SELECTED TAGS", margin + 8, prevY + 6);
            
            if (this.selectedIds.size === 0) {
                ctx.fillStyle = "#444";
                ctx.font = "italic 13px 'Segoe UI', Roboto, sans-serif";
                ctx.fillText("No tags selected...", margin + 12, prevY + 30);
            } else {
                let px = margin + 8;
                let py = prevY + 22;
                
                Array.from(this.selectedIds).forEach(id => {
                    let itemName = id;
                    let itemColor = "#00FF88";
                    for (const cat in this.db) {
                        for (const sub in this.db[cat]) {
                            if (sub === "_meta") continue;
                            const found = this.db[cat][sub].find(i => i.id === id);
                            if (found) { 
                                itemName = found.name;
                                let catC = this.db[cat]?._meta?.color || "#00FF88";
                                let subC = this.db[cat]?._meta?.subcolors?.[sub] || catC;
                                itemColor = found.color || subC;
                                break; 
                            }
                        }
                    }
                    
                    ctx.font = "12px 'Segoe UI', Roboto, sans-serif";
                    
                    // Truncate text if it exceeds selected box width
                    let displayItemName = itemName;
                    const maxTagTextW = w - margin * 4 - 40;
                    if (ctx.measureText(displayItemName).width > maxTagTextW) {
                        while (displayItemName.length > 0 && ctx.measureText(displayItemName + "...").width > maxTagTextW) {
                            displayItemName = displayItemName.substring(0, displayItemName.length - 1);
                        }
                        displayItemName += "...";
                    }

                    const textW = ctx.measureText(displayItemName).width;
                    const tagW = textW + 30;
                    const tagH = 26;
                    
                    if (px + tagW > w - margin - 8) {
                        px = margin + 8;
                        py += tagH + 6;
                    }
                    if (py + tagH > prevY + selectedH) return;
                    
                    ctx.beginPath();
                    ctx.roundRect(px, py, tagW, tagH, 13);
                    let grad = ctx.createLinearGradient(px, py, px, py + tagH);
                    grad.addColorStop(0, hexToRgba(itemColor, 0.2));
                    grad.addColorStop(1, "rgba(20, 20, 20, 0.5)");
                    ctx.fillStyle = grad; ctx.fill();
                    ctx.strokeStyle = hexToRgba(itemColor, 0.4); ctx.stroke();
                    
                    ctx.fillStyle = "#eeeeee";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "middle";
                    ctx.fillText(displayItemName, px + 10, py + tagH / 2);
                    
                    ctx.fillStyle = "rgba(255, 85, 85, 0.8)";
                    ctx.font = "bold 14px 'Segoe UI'";
                    ctx.textAlign = "center";
                    ctx.fillText("×", px + tagW - 12, py + tagH / 2 - 1);
                    
                    this.hitBoxes.push({ type: "remove", val: id, x: px, y: py, w: tagW, h: tagH });
                    px += tagW + 6;
                });
            }
            
            // --- DRAW LIVE PROMPT PREVIEW BOX ---
            ctx.beginPath();
            ctx.roundRect(margin, liveY, w - margin * 2, liveH, 8);
            ctx.fillStyle = "#000000"; ctx.fill(); // Pitch black for code/text
            ctx.strokeStyle = "#222"; ctx.stroke();
            
            // Header subtle background
            ctx.beginPath();
            ctx.roundRect(margin, liveY, w - margin * 2, 24, 8);
            let hdrGrad = ctx.createLinearGradient(margin, liveY, margin, liveY + 24);
            hdrGrad.addColorStop(0, "#111");
            hdrGrad.addColorStop(1, "#000");
            ctx.fillStyle = hdrGrad; ctx.fill();
            
            ctx.fillStyle = "#00FF88";
            ctx.font = "bold 11px 'Inter', 'Segoe UI', sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText("LIVE PROMPT PREVIEW", margin + 8, liveY + 6);
            
            // Draw [✏️ Edit Live Prompt] button
            const cBtnW = 120;
            const cBtnH = 20;
            const cBtnX = w - margin - cBtnW - 6;
            const cBtnY = liveY + 2;
            
            ctx.beginPath();
            ctx.roundRect(cBtnX, cBtnY, cBtnW, cBtnH, 10);
            let btnGrad = ctx.createLinearGradient(cBtnX, cBtnY, cBtnX, cBtnY + cBtnH);
            btnGrad.addColorStop(0, "#252525");
            btnGrad.addColorStop(1, "#151515");
            ctx.fillStyle = btnGrad; ctx.fill();
            ctx.strokeStyle = "#444"; ctx.stroke();
            
            ctx.fillStyle = "#e0e0e0";
            ctx.font = "11px 'Inter', 'Segoe UI', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("✏️ Edit Live Prompt", cBtnX + cBtnW / 2, cBtnY + cBtnH / 2 + 1);
            
            this.hitBoxes.push({ type: "custom_text", x: cBtnX, y: cBtnY, w: cBtnW, h: cBtnH });
            
            ctx.textAlign = "left"; // RESET TEXT ALIGN FOR WRAP TEXT
            
            // Get custom text from hidden widget
            let customTextStr = "";
            const wCust = this.widgets.find(wid => wid.name === "custom_text");
            if (wCust && wCust.value) {
                customTextStr = wCust.value;
            }
            
            let fullPrompt = "";
            if (customTextStr && customTextStr.trim() !== "") {
                fullPrompt = customTextStr.trim();
            } else {
                // Build the live prompt string from tags
                let livePromptParts = [];
                Array.from(this.selectedIds).forEach(id => {
                    for (const cat in this.db) {
                        for (const sub in this.db[cat]) {
                            if (sub === "_meta") continue;
                            const found = this.db[cat][sub].find(i => i.id === id);
                            if (found && found.prompt) { 
                                livePromptParts.push(found.prompt);
                            }
                        }
                    }
                });
                fullPrompt = livePromptParts.join(", ").replace(/, ,/g, ",");
            }
            
            if (fullPrompt.length === 0) {
                ctx.fillStyle = "#444";
                ctx.font = "italic 13px 'Segoe UI', Roboto, sans-serif";
                ctx.fillText("Select tags to see final prompt...", margin + 12, liveY + 30);
            } else {
                ctx.fillStyle = "#ccc";
                ctx.font = "12px 'Consolas', 'Courier New', monospace";
                ctx.textBaseline = "top";
                
                // Text wrapping logic
                const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight, maxHeight) => {
                    const words = text.split(' ');
                    let line = '';
                    let currentY = y;
                    for(let n = 0; n < words.length; n++) {
                        const testLine = line + words[n] + ' ';
                        const metrics = ctx.measureText(testLine);
                        const testWidth = metrics.width;
                        if (testWidth > maxWidth && n > 0) {
                            ctx.fillText(line, x, currentY);
                            line = words[n] + ' ';
                            currentY += lineHeight;
                            if (currentY - y > maxHeight - lineHeight * 2) {
                                ctx.fillText(line + "...", x, currentY);
                                return;
                            }
                        } else {
                            line = testLine;
                        }
                    }
                    ctx.fillText(line, x, currentY);
                };
                
                drawWrappedText(ctx, fullPrompt, margin + 12, liveY + 28, w - margin * 2 - 24, 16, liveH - 30);
            }
        };

        const onResize = nodeType.prototype.onResize;
        nodeType.prototype.onResize = function (size) {
            if (onResize) onResize.apply(this, arguments);
            if (size[0] < 600) size[0] = 600;
            if (size[1] < 550) size[1] = 550;
        };

        nodeType.prototype.onMouseDown = function (event, pos) {
            const x = pos[0]; 
            const y = pos[1];
            
            if (this.hitBoxes) {
                for (let i = this.hitBoxes.length - 1; i >= 0; i--) {
                    const h = this.hitBoxes[i];
                    if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
                        
                        if (h.type === "category") {
                            this.activeCategory = h.val;
                            const subcats = Object.keys(this.db[h.val] || {}).filter(k => k !== "_meta");
                            this.activeSubcategory = subcats.length > 0 ? subcats[0] : null;
                        } else if (h.type === "subcategory") {
                            this.activeSubcategory = h.val;
                        } else if (h.type === "item") {
                            if (this.selectedIds.has(h.val)) this.selectedIds.delete(h.val);
                            else this.selectedIds.add(h.val);
                            const wCust = this.widgets.find(w => w.name === "custom_text");
                            if (wCust) wCust.value = ""; // Clear override
                            this.updateWidget();
                        } else if (h.type === "remove") {
                            this.selectedIds.delete(h.val);
                            const wCust = this.widgets.find(w => w.name === "custom_text");
                            if (wCust) wCust.value = ""; // Clear override
                            this.updateWidget();
                        } else if (h.type === "manage") {
                            this.openManagerModal();
                        } else if (h.type === "custom_text") {
                            this.openCustomTextModal();
                        }
                        this.setDirtyCanvas(true);
                        return true; 
                    }
                }
            }
            return false;
        };
        
        nodeType.prototype.updateWidget = function() {
            const wSel = this.widgets.find(w => w.name === "selected_items");
            if (wSel) {
                wSel.value = JSON.stringify(Array.from(this.selectedIds));
            }
        };

        nodeType.prototype.saveDB = async function(closeOverlay = null) {
            try {
                await api.fetchApi("/3r3bos/prompts_db/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(this.db)
                });
                this.loadDB();
                if (closeOverlay) document.body.removeChild(closeOverlay);
            } catch (e) {
                alert("Failed to save to database: " + e.message);
            }
        };

        nodeType.prototype.openCustomTextModal = function() {
            const overlay = document.createElement("div");
            overlay.className = "r3bos-modal-overlay";
            
            const wCust = this.widgets.find(w => w.name === "custom_text");
            let currentVal = wCust ? wCust.value : "";
            
            // Pre-fill with generated tags if no manual override exists
            if (!currentVal || currentVal.trim() === "") {
                let parts = [];
                Array.from(this.selectedIds).forEach(id => {
                    for (const cat in this.db) {
                        for (const sub in this.db[cat]) {
                            if (sub === "_meta") continue;
                            const found = this.db[cat][sub].find(i => i.id === id);
                            if (found && found.prompt) parts.push(found.prompt);
                        }
                    }
                });
                currentVal = parts.join(", ").replace(/, ,/g, ",");
            }
            
            const modal = document.createElement("div");
            modal.className = "r3bos-modal";
            
            modal.innerHTML = `
                <h3 style="margin-bottom:5px;">✏️ Edit Live Prompt</h3>
                <p style="font-size:12px; color:#888; margin-bottom:15px; margin-top:0;">You are manually overriding the prompt. If you click on tags again, this manual edit will be cleared!</p>
                <textarea id="r3-custom-area" class="r3bos-input r3bos-textarea" style="height:150px;">${currentVal}</textarea>
                <div class="r3bos-flex-row" style="justify-content: flex-end; margin-top: 15px;">
                    <button id="r3-c-close" class="r3bos-btn">Cancel</button>
                    <button id="r3-c-save" class="r3bos-btn r3bos-btn-primary">Save Override</button>
                </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            const area = modal.querySelector("#r3-custom-area");
            area.value = currentVal;
            area.focus();
            
            modal.querySelector("#r3-c-close").addEventListener("click", () => {
                document.body.removeChild(overlay);
            });
            
            modal.querySelector("#r3-c-save").addEventListener("click", () => {
                if (wCust) {
                    wCust.value = area.value;
                }
                document.body.removeChild(overlay);
                this.setDirtyCanvas(true);
            });
        };

        nodeType.prototype.openManagerModal = function() {
            const overlay = document.createElement("div");
            overlay.className = "r3bos-modal-overlay";
            
            const modal = document.createElement("div");
            modal.className = "r3bos-modal";
            modal.style.position = "relative"; // For inner absolute overlays
            
            modal.innerHTML = `
                <!-- Main Content -->
                <div id="r3-modal-content">
                <h3>⚙️ Database Editor</h3>
                
                <div class="r3bos-form-group">
                    <label>Category</label>
                    <div class="r3bos-flex-row">
                        <select id="r3-cat-sel" class="r3bos-select"></select>
                        <button id="r3-cat-add" class="r3bos-btn r3bos-btn-action" title="New Category">➕</button>
                        <button id="r3-cat-ren" class="r3bos-btn r3bos-btn-action" title="Rename Category">✏️</button>
                        <button id="r3-cat-del" class="r3bos-btn r3bos-btn-action" title="Delete Category" style="color:#ff5555">🗑️</button>
                    </div>
                </div>
                
                <div class="r3bos-form-group">
                    <label>Subcategory</label>
                    <div class="r3bos-flex-row">
                        <select id="r3-sub-sel" class="r3bos-select"></select>
                        <button id="r3-sub-add" class="r3bos-btn r3bos-btn-action" title="New Subcategory">➕</button>
                        <button id="r3-sub-ren" class="r3bos-btn r3bos-btn-action" title="Rename Subcategory">✏️</button>
                        <button id="r3-sub-del" class="r3bos-btn r3bos-btn-action" title="Delete Subcategory" style="color:#ff5555">🗑️</button>
                    </div>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">

                <div class="r3bos-form-group">
                    <label>Prompt</label>
                    <div class="r3bos-flex-row">
                        <select id="r3-prompt-sel" class="r3bos-select"></select>
                        <button id="r3-prompt-del" class="r3bos-btn r3bos-btn-action" title="Delete Prompt" style="color:#ff5555">🗑️</button>
                    </div>
                </div>

                <div class="r3bos-form-group">
                    <label>Prompt Button Title</label>
                    <input type="text" id="r3-p-name" class="r3bos-input" placeholder="e.g., Cinematic Glow" maxlength="50">
                </div>
                
                <div class="r3bos-form-group">
                    <label>Prompt Code / Text</label>
                    <textarea id="r3-p-text" class="r3bos-input r3bos-textarea" placeholder="cinematic lighting, glowing edges..."></textarea>
                </div>
                
                <div class="r3bos-flex-row" style="justify-content: flex-end; margin-top: 25px;">
                    <button id="r3-close" class="r3bos-btn">Close</button>
                    <button id="r3-save" class="r3bos-btn r3bos-btn-primary">Save / Update Prompt</button>
                </div>
                
                <!-- Custom Prompt / Confirm Overlays -->
                <div id="r3-custom-overlay" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); border-radius:8px; z-index:100; justify-content:center; align-items:center; flex-direction:column; padding:20px; box-sizing:border-box;">
                    <h4 id="r3-co-title" style="margin:0 0 15px 0; color:#fff; text-align:center; font-weight:normal;">Title</h4>
                    <input type="text" id="r3-co-input" class="r3bos-input" style="margin-bottom:20px; display:none;">
                    <div id="r3-co-color-wrap" style="display:none; width:100%; margin-bottom:20px; text-align:left;">
                        <label style="color:#888; font-size:12px; display:block; margin-bottom:5px;">Category Color</label>
                        <input type="color" id="r3-co-color" style="width:100%; height:40px; background:#111; border:1px solid #333; border-radius:4px; padding:2px; cursor:pointer;" value="#00FF88">
                    </div>
                    <div id="r3-co-apply-all-wrap" style="display:none; width:100%; margin-bottom:20px; text-align:left;">
                        <label style="color:#ddd; font-size:12px; display:flex; align-items:center; cursor:pointer;">
                            <input type="checkbox" id="r3-co-apply-all" style="margin-right:8px; width:16px; height:16px; cursor:pointer;">
                            Apply this color to all Subcategories
                        </label>
                    </div>
                    <div class="r3bos-flex-row" style="justify-content:center; width:100%;">
                        <button id="r3-co-cancel" class="r3bos-btn">Cancel</button>
                        <button id="r3-co-ok" class="r3bos-btn r3bos-btn-primary">Confirm</button>
                    </div>
                </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            const els = {
                catSel: modal.querySelector("#r3-cat-sel"),
                subSel: modal.querySelector("#r3-sub-sel"),
                promptSel: modal.querySelector("#r3-prompt-sel"),
                pName: modal.querySelector("#r3-p-name"),
                pText: modal.querySelector("#r3-p-text"),
                catAdd: modal.querySelector("#r3-cat-add"),
                catRen: modal.querySelector("#r3-cat-ren"),
                catDel: modal.querySelector("#r3-cat-del"),
                subAdd: modal.querySelector("#r3-sub-add"),
                subRen: modal.querySelector("#r3-sub-ren"),
                subDel: modal.querySelector("#r3-sub-del"),
                promptDel: modal.querySelector("#r3-prompt-del"),
                saveBtn: modal.querySelector("#r3-save"),
                closeBtn: modal.querySelector("#r3-close")
            };

            const populateCats = (selectVal = null) => {
                els.catSel.innerHTML = "";
                Object.keys(this.db).forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c; opt.textContent = c;
                    els.catSel.appendChild(opt);
                });
                if (selectVal && this.db[selectVal]) els.catSel.value = selectVal;
                else if (this.activeCategory && this.db[this.activeCategory]) els.catSel.value = this.activeCategory;
                populateSubs();
            };

            const populateSubs = (selectVal = null) => {
                els.subSel.innerHTML = "";
                const cat = els.catSel.value;
                if (cat && this.db[cat]) {
                    Object.keys(this.db[cat]).filter(k => k !== "_meta").forEach(s => {
                        const opt = document.createElement("option");
                        opt.value = s; opt.textContent = s;
                        els.subSel.appendChild(opt);
                    });
                }
                if (selectVal && this.db[cat] && this.db[cat][selectVal]) els.subSel.value = selectVal;
                else if (this.activeSubcategory && this.db[cat] && this.db[cat][this.activeSubcategory]) els.subSel.value = this.activeSubcategory;
                populatePrompts();
            };

            const populatePrompts = (selectVal = null) => {
                els.promptSel.innerHTML = '<option value="_new_" style="color:#00FF88">[ ➕ Create New Prompt ]</option>';
                const cat = els.catSel.value;
                const sub = els.subSel.value;
                if (cat && sub && this.db[cat] && this.db[cat][sub]) {
                    this.db[cat][sub].forEach(p => {
                        const opt = document.createElement("option");
                        opt.value = p.id; opt.textContent = p.name;
                        els.promptSel.appendChild(opt);
                    });
                }
                
                if (selectVal) els.promptSel.value = selectVal;
                
                handlePromptChange();
            };

            const handlePromptChange = () => {
                const id = els.promptSel.value;
                if (id === "_new_") {
                    els.pName.value = "";
                    els.pText.value = "";
                    els.saveBtn.textContent = "Create Prompt";
                    els.promptDel.style.display = "none";
                } else {
                    const cat = els.catSel.value;
                    const sub = els.subSel.value;
                    const promptObj = this.db[cat][sub].find(p => p.id === id);
                    if (promptObj) {
                        els.pName.value = promptObj.name;
                        els.pText.value = promptObj.prompt;
                        els.saveBtn.textContent = "Update Prompt";
                        els.promptDel.style.display = "block";
                    }
                }
            };

            populateCats();

            els.catSel.addEventListener("change", () => populateSubs());
            els.subSel.addEventListener("change", () => populatePrompts());
            els.promptSel.addEventListener("change", handlePromptChange);

            // Custom Dialog Logic
            const customOverlay = modal.querySelector("#r3-custom-overlay");
            const coTitle = modal.querySelector("#r3-co-title");
            const coInput = modal.querySelector("#r3-co-input");
            const coColorWrap = modal.querySelector("#r3-co-color-wrap");
            const coColor = modal.querySelector("#r3-co-color");
            const coApplyAllWrap = modal.querySelector("#r3-co-apply-all-wrap");
            const coApplyAll = modal.querySelector("#r3-co-apply-all");
            const coCancel = modal.querySelector("#r3-co-cancel");
            const coOk = modal.querySelector("#r3-co-ok");

            const showCustomDialog = (title, showInput, defaultVal, showColor, defaultColor, showApplyAll, onConfirm) => {
                coTitle.textContent = title;
                if (showInput) {
                    coInput.style.display = "block";
                    coInput.value = defaultVal || "";
                    coInput.maxLength = 30; // Limit category/subcategory names
                } else {
                    coInput.style.display = "none";
                }
                
                if (showColor) {
                    coColorWrap.style.display = "block";
                    coColor.value = defaultColor || "#00FF88";
                } else {
                    coColorWrap.style.display = "none";
                }
                
                if (showApplyAll) {
                    coApplyAllWrap.style.display = "block";
                    coApplyAll.checked = false;
                } else {
                    coApplyAllWrap.style.display = "none";
                }
                
                customOverlay.style.display = "flex";
                if (showInput) coInput.focus();

                const cleanup = () => {
                    customOverlay.style.display = "none";
                    coCancel.removeEventListener("click", handleCancel);
                    coOk.removeEventListener("click", handleOk);
                    coInput.removeEventListener("keydown", handleKey);
                };

                const handleCancel = () => { cleanup(); };
                const handleOk = () => {
                    cleanup();
                    onConfirm(showInput ? coInput.value : true, showColor ? coColor.value : null, showApplyAll ? coApplyAll.checked : false);
                };
                const handleKey = (e) => {
                    if (e.key === "Enter") handleOk();
                    if (e.key === "Escape") handleCancel();
                };

                coCancel.addEventListener("click", handleCancel);
                coOk.addEventListener("click", handleOk);
                if (showInput) coInput.addEventListener("keydown", handleKey);
            };

            const r3Prompt = (msg, def, cb) => showCustomDialog(msg, true, def, false, null, false, cb);
            const r3PromptWithColor = (msg, def, defCol, showApply, cb) => showCustomDialog(msg, true, def, true, defCol, showApply, cb);
            const r3Confirm = (msg, cb) => showCustomDialog(msg, false, null, false, null, false, cb);

            // CATEGORY ACTIONS
            els.catAdd.addEventListener("click", () => {
                r3PromptWithColor("Enter new Category name:", "", "#00FF88", true, (name, color, applyAll) => {
                    if (name && name.trim() !== "" && !this.db[name]) {
                        this.db[name] = { "_meta": { color: color } };
                        this.saveDB();
                        populateCats(name);
                    }
                });
            });
            els.catRen.addEventListener("click", () => {
                const old = els.catSel.value;
                if (!old) return;
                let oldColor = "#00FF88";
                if (this.db[old]["_meta"] && this.db[old]["_meta"].color) oldColor = this.db[old]["_meta"].color;
                
                r3PromptWithColor("Rename Category & Change Color:", old, oldColor, true, (newName, newColor, applyAll) => {
                    if (newName && newName.trim() !== "") {
                        if (newName !== old && !this.db[newName]) {
                            this.db[newName] = this.db[old];
                            delete this.db[old];
                        }
                        if (!this.db[newName]["_meta"]) this.db[newName]["_meta"] = {};
                        this.db[newName]["_meta"].color = newColor;
                        
                        if (applyAll) {
                            delete this.db[newName]["_meta"].subcolors;
                        }
                        
                        this.saveDB();
                        populateCats(newName);
                    }
                });
            });
            els.catDel.addEventListener("click", () => {
                const old = els.catSel.value;
                if (!old) return;
                r3Confirm(`Delete Category '${old}' and all its contents?`, (yes) => {
                    if (yes) {
                        delete this.db[old];
                        this.saveDB();
                        populateCats();
                    }
                });
            });

            // SUBCATEGORY ACTIONS
            els.subAdd.addEventListener("click", () => {
                const cat = els.catSel.value;
                if (!cat) return;
                let catC = this.db[cat]?._meta?.color || "#0096FF";
                r3PromptWithColor("Enter new Subcategory name:", "", catC, false, (name, color) => {
                    if (name && name.trim() !== "" && !this.db[cat][name]) {
                        this.db[cat][name] = [];
                        if (!this.db[cat]["_meta"]) this.db[cat]["_meta"] = {};
                        if (!this.db[cat]["_meta"].subcolors) this.db[cat]["_meta"].subcolors = {};
                        this.db[cat]["_meta"].subcolors[name] = color;
                        this.saveDB();
                        populateSubs(name);
                    }
                });
            });
            els.subRen.addEventListener("click", () => {
                const cat = els.catSel.value;
                const old = els.subSel.value;
                if (!cat || !old) return;
                let oldColor = "#0096FF";
                if (this.db[cat]["_meta"] && this.db[cat]["_meta"].subcolors && this.db[cat]["_meta"].subcolors[old]) {
                    oldColor = this.db[cat]["_meta"].subcolors[old];
                }
                
                r3PromptWithColor("Rename Subcategory & Change Color:", old, oldColor, false, (newName, newColor) => {
                    if (newName && newName.trim() !== "") {
                        if (newName !== old && !this.db[cat][newName]) {
                            this.db[cat][newName] = this.db[cat][old];
                            delete this.db[cat][old];
                        }
                        if (!this.db[cat]["_meta"]) this.db[cat]["_meta"] = {};
                        if (!this.db[cat]["_meta"].subcolors) this.db[cat]["_meta"].subcolors = {};
                        
                        if (newName !== old && this.db[cat]["_meta"].subcolors[old]) {
                            delete this.db[cat]["_meta"].subcolors[old];
                        }
                        this.db[cat]["_meta"].subcolors[newName] = newColor;
                        
                        this.saveDB();
                        populateSubs(newName);
                    }
                });
            });
            els.subDel.addEventListener("click", () => {
                const cat = els.catSel.value;
                const old = els.subSel.value;
                if (!cat || !old) return;
                r3Confirm(`Delete Subcategory '${old}'?`, (yes) => {
                    if (yes) {
                        delete this.db[cat][old];
                        this.saveDB();
                        populateSubs();
                    }
                });
            });

            // PROMPT DELETE
            els.promptDel.addEventListener("click", () => {
                const cat = els.catSel.value;
                const sub = els.subSel.value;
                const id = els.promptSel.value;
                if (id === "_new_") return;
                
                r3Confirm(`Delete this prompt?`, (yes) => {
                    if (yes) {
                        this.db[cat][sub] = this.db[cat][sub].filter(p => p.id !== id);
                        this.selectedIds.delete(id); // remove from active selections if present
                        this.updateWidget();
                        this.saveDB();
                        populatePrompts();
                    }
                });
            });

            // CLOSE & SAVE
            els.closeBtn.addEventListener("click", () => {
                document.body.removeChild(overlay);
            });

            els.saveBtn.addEventListener("click", () => {
                const cat = els.catSel.value;
                const sub = els.subSel.value;
                const pName = els.pName.value.trim();
                const pText = els.pText.value.trim();
                const selId = els.promptSel.value;

                if (!cat || !sub || !pName || !pText) {
                    alert("Please fill out Title and Text!");
                    return;
                }

                if (selId === "_new_") {
                    // Create new
                    const safeCat = cat.replace(/\W+/g, '').toLowerCase().substring(0,5);
                    const safeName = pName.replace(/\W+/g, '').toLowerCase().substring(0,10);
                    const id = `p_${safeCat}_${safeName}_${Date.now().toString().substring(8)}`;
                    
                    let newP = { id: id, name: pName, prompt: pText };
                    this.db[cat][sub].push(newP);
                } else {
                    // Update existing
                    const promptObj = this.db[cat][sub].find(p => p.id === selId);
                    if (promptObj) {
                        promptObj.name = pName;
                        promptObj.prompt = pText;
                    }
                }

                this.saveDB(overlay); // Saves and closes modal
            });
        };
    }
});
