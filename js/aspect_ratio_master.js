// Developed by 3R3BOS
import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "3R3BOS.AspectRatioMaster",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "Aspect Ratio Master (3R3BOS)") return;

        const PRESETS = {
            "Low Quality": {
                video_qhd: 0.409600,
                video_ltx: 0.262144,
                video_dvd: 0.345600,
                image_eco: 0.600000,
                image_hunyuan: 1.048576,
                image_pony: 0.640000,
                image_illustrious: 1.048576,
                legacy: 0.262144
            },
            "Middle Quality": {
                video_qhd: 0.921600,
                video_ltx: 0.856064,
                video_dvd: 0.921600,
                image_eco: 1.048576,
                image_hunyuan: 2.097152,
                image_pony: 1.048576,
                image_illustrious: 1.500000,
                legacy: 0.393216
            },
            "High Quality": {
                video_qhd: 2.073600,
                video_ltx: 2.073600,
                video_dvd: 2.073600,
                image_eco: 2.097152,
                image_hunyuan: 4.194304,
                image_pony: 1.500000,
                image_illustrious: 2.359296,
                legacy: 0.640000
            }
        };

        const ARCHITECTURES = {
            "Wan Video (V2.x/V2.5)":          { round: 16, type: "video_qhd", vae_factor: 8 },
            "NVIDIA Cosmos (Gen/Predict)":   { round: 16, type: "video_dvd", vae_factor: 16 },
            "Hunyuan Video (V1/V2/V1.5)":    { round: 16, type: "video_qhd", vae_factor: 8 },
            "Mochi 1 (HD/Standard)":         { round: 16, type: "video_qhd", vae_factor: 8 },
            "HiDream (Video/Dynamic)":       { round: 16, type: "video_qhd", vae_factor: 8 },
            "LTX Video / LTX-2":             { round: 32, type: "video_ltx", vae_factor: 8 },
            "CogVideoX":                     { round: 32, type: "video_dvd", vae_factor: 8 },

            "Flux.1 / Flux.2 [Klein]":       { round: 16, type: "image_eco", vae_factor: 8 },
            "Z-Image Family (Base/Turbo/Edit)": { round: 16, type: "image_eco", vae_factor: 8 },
            "SANA-1.5 / SANA-Video":         { round: 32, type: "image_eco", vae_factor: 32 },
            "OmniGen / OmniGen2":            { round: 16, type: "image_eco", vae_factor: 8 },
            "Krea 2 (Turbo/Raw)":            { round: 16, type: "image_eco", vae_factor: 8 },
            "Aura Flow":                     { round: 16, type: "image_eco", vae_factor: 8 },
            "Lumina / Lumina-Next":          { round: 32, type: "image_eco", vae_factor: 8 },
            "PixArt Alpha / Sigma":          { round: 32, type: "image_eco", vae_factor: 8 },
            "Hunyuan Image 1.0":             { round: 16, type: "image_eco", vae_factor: 8 },
            "Hunyuan Image 2.1 (2K)":        { round: 16, type: "image_hunyuan", vae_factor: 8 },

            "SDXL (Base/Turbo/Lightning)":   { round: 8,  type: "image_pony", vae_factor: 8 },
            "Pony / Pony V7":                { round: 8,  type: "image_pony", vae_factor: 8 },
            "Kolors (Kwai)":                 { round: 8,  type: "image_pony", vae_factor: 8 },
            "Illustrious / NoobAI":          { round: 8,  type: "image_illustrious", vae_factor: 8 },

            "SD 3.5 (Large/Turbo)":          { round: 64, type: "image_eco", vae_factor: 8 },
            "SD 3.0":                        { round: 16, type: "image_eco", vae_factor: 8 },
            "SD 1.5 / LCM":                  { round: 8,  type: "legacy", vae_factor: 8 }
        };

        function getRes(arch, mode, ratioStr, scale, useCustomRatio = false, customW = 1024, customH = 1024) {
            const conf = ARCHITECTURES[arch] || ARCHITECTURES["Wan Video (V2.x/V2.5)"];
            const r = conf.round;
            const archType = conf.type;

            let mKey = "Middle Quality";
            if (mode.includes("Low")) mKey = "Low Quality";
            else if (mode.includes("High")) mKey = "High Quality";

            const presetGroup = PRESETS[mKey];
            const mp = presetGroup[archType] || 1.0;

            let w, h;
            if (useCustomRatio) {
                w = Math.round((customW * scale) / r) * r;
                h = Math.round((customH * scale) / r) * r;
                return { w, h, mode: mKey, conf };
            }

            const total = mp * (scale * scale) * 1000000;
            const p = ratioStr.split(':');
            let rw = parseFloat(p[0]);
            let rh = parseFloat(p[1]);

            if (isNaN(rw) || isNaN(rh)) { rw = 1.0; rh = 1.0; }

            const s = Math.sqrt(total / (rw * rh));
            w = Math.round((s * rw) / r) * r;
            h = Math.round((s * rh) / r) * r;

            return { w, h, mode: mKey, conf };
        }

        function drawMiniRatioShape(ctx, x, y, maxW, maxH, ratioStr, highlight, activeColor) {
            const p = ratioStr.split(':');
            let rw = parseFloat(p[0]);
            let rh = parseFloat(p[1]);
            if (isNaN(rw) || isNaN(rh)) return;

            let w = maxW; let h = maxH;
            const rVal = rw / rh;
            if (rVal > 1) {
                h = maxW / rVal;
                if (h > maxH) { h = maxH; w = maxH * rVal; }
            } else {
                w = maxH * rVal;
                if (w > maxW) { w = maxW; h = maxW / rVal; }
            }

            const bx = x - w / 2; const by = y - h / 2;
            ctx.beginPath();
            ctx.roundRect(bx, by, w, h, 2);
            ctx.strokeStyle = highlight ? activeColor : "rgba(255, 255, 255, 0.25)";
            ctx.lineWidth = 1;
            ctx.stroke();

            if (highlight) {
                ctx.fillStyle = activeColor + "22";
                ctx.fill();
            }
        }

        if (!nodeType.prototype.onNodeCreated.__patched) {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, arguments);
                this.setSize([380, 680]);
                this.min_size = [380, 680];
                this.color = "#242730";
                this.bgcolor = "#1b1e24";

                const refresh = () => { this.setDirtyCanvas(true, true); };
                this.widgets.forEach(w => {
                    const cb = w.callback;
                    w.callback = (v) => { if (cb) cb(v); refresh(); };
                });

                if (!this._animTimer) {
                    this._animTimer = setInterval(() => {
                        if (this.flags && !this.flags.collapsed && app.canvas.visible_nodes && app.canvas.visible_nodes.includes(this)) {
                            this.setDirtyCanvas(true, true);
                        }
                    }, 60);
                }
            };
            nodeType.prototype.onNodeCreated.__patched = true;
        }

        nodeType.prototype.onDrawForeground = function (ctx) {
            if (this.flags.collapsed) return;

            if (this.size[0] < 380 || this.size[1] < 680) {
                this.size[0] = Math.max(this.size[0], 380);
                this.size[1] = Math.max(this.size[1], 680);
            }

            const wCustomToggle = this.widgets.find(w => w.name === "use_custom_ratio");
            const wCustomW = this.widgets.find(w => w.name === "custom_width");
            const wCustomH = this.widgets.find(w => w.name === "custom_height");
            const wArch = this.widgets.find(w => w.name === "model_arch");
            const wMode = this.widgets.find(w => w.name === "performance_mode");
            const wRatio = this.widgets.find(w => w.name === "aspect_ratio");
            const wScale = this.widgets.find(w => w.name === "custom_scale_factor");

            const arch = wArch ? wArch.value : "Wan Video (V2.x/V2.5)";
            const mode = wMode ? wMode.value : "Middle Quality";
            const curRatio = wRatio ? wRatio.value : "16:9 (Cinematic)";
            const useCustomRatio = wCustomToggle ? wCustomToggle.value : false;
            const customW = wCustomW ? wCustomW.value : 1024;
            const customH = wCustomH ? wCustomH.value : 1024;
            const scale = wScale ? wScale.value : 1.0;

            const margin = 10;
            const topY = 350;
            const flipH = 28;
            const gw = this.size[0] - margin * 2;

            const currentRes = getRes(arch, mode, curRatio, scale, useCustomRatio, customW, customH);

            this.color = "#242730";
            this.bgcolor = "#1b1e24";

            const accentCol = "#00b4d8";
            const accentBg = "rgba(0, 180, 216, 0.12)";
            const accentBgHover = "rgba(0, 180, 216, 0.22)";
            const pulse = Math.sin(Date.now() / 300) * 0.35 + 0.65;

            ctx.beginPath();
            ctx.roundRect(margin, topY, gw, flipH, 6);

            if (this.hoverFlip) {
                ctx.fillStyle = accentBgHover; ctx.strokeStyle = accentCol; ctx.lineWidth = 1.5;
            } else {
                ctx.fillStyle = "rgba(20, 20, 24, 0.6)"; ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"; ctx.lineWidth = 1;
            }
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = this.hoverFlip ? "#fff" : "#ccc";
            ctx.font = "bold 11px Arial"; ctx.textAlign = "center";
            ctx.fillText(`Flip Aspect Ratio 🔄`, margin + gw / 2, topY + 18);

            this.flipBtnBox = { l: margin, t: topY, r: margin + gw, b: topY + flipH };

            const RATIOS = [
                { l: "1:1", v: "1:1" }, { l: "4:3", v: "4:3" }, { l: "3:4", v: "3:4" },
                { l: "16:9", v: "16:9" }, { l: "9:16", v: "9:16" }, { l: "21:9", v: "21:9" },
                { l: "9:21", v: "9:21" }, { l: "3:2", v: "3:2" }, { l: "2:3", v: "2:3" },
                { l: "2:1", v: "2:1" }, { l: "1:2", v: "1:2" }, { l: "5:4", v: "5:4" }
            ];

            const gridY = topY + flipH + 8;
            const bottomBarH = 26;
            const gh = this.size[1] - gridY - bottomBarH - 15;
            const ch = gh / 4;
            const cw = gw / 3;

            this.hitBoxes = [];
            ctx.save();
            ctx.translate(margin, gridY);

            RATIOS.forEach((r, i) => {
                const col = i % 3;
                const row = Math.floor(i / 3);
                const x = col * cw;
                const y = row * ch;

                // FIX: On force à false ici pour garder l'aperçu du ratio propre sur la grille
                const res = getRes(arch, mode, r.v, scale, false, customW, customH);
                const active = !useCustomRatio && curRatio.startsWith(r.v);
                const hovered = this.hoveredIndex === i;

                this.hitBoxes.push({ val: r.v, l: margin + x, t: gridY + y, r: margin + x + cw, b: gridY + y + ch });

                ctx.save();
                ctx.beginPath();
                ctx.roundRect(x + 2, y + 2, cw - 4, ch - 4, 6);

                if (active) {
                    ctx.fillStyle = accentBg; ctx.strokeStyle = accentCol; ctx.lineWidth = 1.5;
                    ctx.shadowColor = accentCol; ctx.shadowBlur = 3 + pulse * 5;
                } else if (hovered) {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.08)"; ctx.strokeStyle = "rgba(255, 255, 255, 0.25)"; ctx.lineWidth = 1;
                } else {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.02)"; ctx.strokeStyle = "rgba(255, 255, 255, 0.06)"; ctx.lineWidth = 1;
                }
                ctx.fill(); ctx.stroke();
                ctx.restore();

                const cardCy = y + ch / 2;
                const shapeX = x + 22;
                drawMiniRatioShape(ctx, shapeX, cardCy, 28, 28, r.v, active || hovered, accentCol);

                const textStartX = x + 44;
                ctx.textAlign = "left";
                ctx.fillStyle = active ? "#ffffff" : (hovered ? "#ffffff" : "#bbbbbb");
                ctx.font = active ? "bold 11px Arial" : "11px Arial";
                ctx.fillText(r.l, textStartX, cardCy - 4);

                ctx.fillStyle = active ? accentCol : (hovered ? "#aaaaaa" : "#777777");
                ctx.font = "9px Consolas";
                ctx.fillText(`${res.w}x${res.h}`, textStartX, cardCy + 8);
            });
            ctx.restore();

            const barY = this.size[1] - bottomBarH - 8;
            ctx.beginPath();
            ctx.roundRect(margin, barY, gw, bottomBarH, 4);
            ctx.fillStyle = "rgba(10, 10, 12, 0.7)"; ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
            ctx.fill(); ctx.stroke();

            const vaeF = currentRes.conf.vae_factor || 8;
            const latentW = Math.floor(currentRes.w / vaeF);
            const latentH = Math.floor(currentRes.h / vaeF);
            const mpCount = (currentRes.w * currentRes.h / 1000000).toFixed(2);

            ctx.fillStyle = accentCol; ctx.font = "bold 10px Consolas"; ctx.textAlign = "center";
            ctx.fillText(`${currentRes.w}x${currentRes.h} (${mpCount}MP) | Latents: ${latentW}x${latentH}`, margin + gw / 2, barY + 16);
        };

        nodeType.prototype.onMouseMove = function (e, pos) {
            const x = pos[0]; const y = pos[1];
            let hoveredIndex = -1; let hoverFlip = false;

            if (x >= 0 && x <= this.size[0] && y >= 0 && y <= this.size[1]) {
                if (this.hitBoxes) {
                    for (let i = 0; i < this.hitBoxes.length; i++) {
                        const h = this.hitBoxes[i];
                        if (x >= h.l && x <= h.r && y >= h.t && y <= h.b) { hoveredIndex = i; break; }
                    }
                }
                if (this.flipBtnBox) {
                    const fb = this.flipBtnBox;
                    if (x >= fb.l && x <= fb.r && y >= fb.t && y <= fb.b) { hoverFlip = true; }
                }
            }

            if (this.hoveredIndex !== hoveredIndex || this.hoverFlip !== hoverFlip) {
                this.hoveredIndex = hoveredIndex; this.hoverFlip = hoverFlip;
                this.setDirtyCanvas(true, true);
            }
        };

        nodeType.prototype.onMouseLeave = function () {
            this.hoveredIndex = -1; this.hoverFlip = false;
            this.setDirtyCanvas(true, true);
        };

        nodeType.prototype.onMouseDown = function (e, pos) {
            if (e.buttons !== 1) return false;
            const x = pos[0]; const y = pos[1];

            if (this.flipBtnBox) {
                const fb = this.flipBtnBox;
                if (x >= fb.l && x <= fb.r && y >= fb.t && y <= fb.b) {
                    const wRatio = this.widgets.find(w => w.name === "aspect_ratio");
                    const wCustomToggle = this.widgets.find(w => w.name === "use_custom_ratio");
                    const useCustomRatio = wCustomToggle ? wCustomToggle.value : false;

                    if (useCustomRatio) {
                        const wCustomW = this.widgets.find(w => w.name === "custom_width");
                        const wCustomH = this.widgets.find(w => w.name === "custom_height");
                        if (wCustomW && wCustomH) {
                            const valW = wCustomW.value; const valH = wCustomH.value;
                            wCustomW.value = valH; wCustomH.value = valW;
                            if (wCustomW.callback) wCustomW.callback(valH);
                            if (wCustomH.callback) wCustomH.callback(valW);
                        }
                    } else if (wRatio) {
                        const curVal = wRatio.value;
                        const lookup = {
                            "16:9 (Cinematic)": "9:16 (Stories)",
                            "9:16 (Stories)": "16:9 (Cinematic)",
                            "4:3 (Photo)": "3:4 (Portrait)",
                            "3:4 (Portrait)": "4:3 (Photo)",
                            "21:9 (Ultrawide)": "9:21 (Tower)",
                            "9:21 (Tower)": "21:9 (Ultrawide)",
                            "3:2 (DSLR)": "2:3 (Classic)",
                            "2:3 (Classic)": "3:2 (DSLR)",
                            "5:4 (Medium)": "4:5 (Social)",
                            "4:5 (Social)": "5:4 (Medium)",
                            "2:1 (Univisium)": "1:2 (Portrait Extra)",
                            "1:2 (Portrait Extra)": "2:1 (Univisium)"
                        };
                        const nextVal = lookup[curVal];
                        if (nextVal && wRatio.options.values.includes(nextVal)) {
                            wRatio.value = nextVal;
                            if (wRatio.callback) wRatio.callback(nextVal);
                        }
                    }
                    this.setDirtyCanvas(true, true);
                    return true;
                }
            }

            if (this.hitBoxes) {
                for (const h of this.hitBoxes) {
                    if (x >= h.l && x <= h.r && y >= h.t && y <= h.b) {
                        const wRatio = this.widgets.find(w => w.name === "aspect_ratio");
                        const wCustomToggle = this.widgets.find(w => w.name === "use_custom_ratio");
                        if (wRatio) {
                            const opt = wRatio.options.values.find(v => v.startsWith(h.val));
                            if (opt) {
                                if (wCustomToggle) {
                                    wCustomToggle.value = false;
                                    if (wCustomToggle.callback) wCustomToggle.callback(false);
                                }
                                wRatio.value = opt;
                                if (wRatio.callback) wRatio.callback(opt);
                            }
                        }
                        return true;
                    }
                }
            }
        };

        nodeType.prototype.onRemoved = function() {
            if (this._animTimer) clearInterval(this._animTimer);
        };
    }
});
