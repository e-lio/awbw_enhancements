class UnitMovementTracker {
    constructor(gamemap, parser, playersPanel) {
        console.log("AWBW Enhancements - Tracker initialized");
        this.gamemap = gamemap;
        this.parser = parser;
        this.playersPanel = playersPanel;
        
        this.originalCoords = {}; // unit.id -> {x, y}
        this.wasWaited = {};      // unit.id -> boolean (to track transitions)
        this.svgElement = null;
        this.lineElements = {};   // unit.id -> SVGLineElement
        this.circleElements = {}; // unit.id -> SVGCircleElement
        
        this.enabled = true;
        
        this.setupSvg();
        
        // Listen for map updates
        parser.addListener(this.onMapUpdate.bind(this));
        
        // Clear tracers on new turn start
        playersPanel.addTurnStartListener(this.resetAll.bind(this));
    }
    
    setupSvg() {
        if (this.svgElement && this.svgElement.parentNode) {
            return;
        }
        
        // Find or create SVG container
        let existingSvg = document.getElementById("awbwenhancements-tracers-svg");
        if (existingSvg) {
            this.svgElement = existingSvg;
        } else {
            this.svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.svgElement.id = "awbwenhancements-tracers-svg";
            
            // Set styles directly to ensure it is visible and overlayed on top
            this.svgElement.style.position = "absolute";
            this.svgElement.style.left = "0px";
            this.svgElement.style.top = "0px";
            this.svgElement.style.pointerEvents = "none";
            this.svgElement.style.zIndex = "9999"; // Draw above map, range previews, and units
            
            // Apply 65% alpha (35% transparency) to the entire SVG group container.
            // This prevents overlapping segments (circles, lines, arrowheads) from compounding their opacity.
            this.svgElement.style.opacity = "0.65";
            
            // Create defs with markers for the arrow
            let defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            
            // Foreground orange filled arrow marker (20% smaller: markerWidth/Height = 4.8 instead of 6)
            let markerFg = document.createElementNS("http://www.w3.org/2000/svg", "marker");
            markerFg.setAttribute("id", "awbwenhancements-arrow-fg");
            markerFg.setAttribute("viewBox", "0 0 10 10");
            markerFg.setAttribute("refX", "8"); // Align arrowhead tip with the destination center coord
            markerFg.setAttribute("refY", "5");
            markerFg.setAttribute("markerWidth", "4.8");
            markerFg.setAttribute("markerHeight", "4.8");
            markerFg.setAttribute("orient", "auto-start-reverse");
            
            let pathFg = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathFg.setAttribute("d", "M 2 2 L 8 5 L 2 8 Z"); // Closed filled arrow path
            pathFg.setAttribute("fill", "#ff9900");
            pathFg.setAttribute("stroke", "none");
            
            markerFg.appendChild(pathFg);
            defs.appendChild(markerFg);
            
            this.svgElement.appendChild(defs);
            this.gamemap.appendChild(this.svgElement);
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clearAllVisuals();
        } else {
            this.parser.handleMapUpdate();
        }
    }
    
    resetAll() {
        console.log("AWBW Enhancements - Resetting movement tracers");
        this.originalCoords = {};
        this.wasWaited = {};
        this.clearAllVisuals();
    }
    
    clearAllVisuals() {
        // Remove SVG lines
        for (let id in this.lineElements) {
            if (this.lineElements[id]) {
                this.lineElements[id].remove();
            }
        }
        // Remove SVG circles
        for (let id in this.circleElements) {
            if (this.circleElements[id]) {
                this.circleElements[id].remove();
            }
        }
        this.lineElements = {};
        this.circleElements = {};
    }
    
    onMapUpdate(mapEntities) {
        if (!this.enabled) return;
        
        // 1. Get currently active unit IDs on map
        let activeUnitIds = new Set();
        for (let unit of mapEntities.units) {
            activeUnitIds.add(unit.id);
        }
        
        // 2. Clean up any units that are no longer on the board
        for (let id in this.originalCoords) {
            if (!activeUnitIds.has(id)) {
                delete this.originalCoords[id];
                delete this.wasWaited[id];
                if (this.lineElements[id]) {
                    this.lineElements[id].remove();
                    delete this.lineElements[id];
                }
                if (this.circleElements[id]) {
                    this.circleElements[id].remove();
                    delete this.circleElements[id];
                }
            }
        }
        
        // Ensure SVG element is correctly attached
        this.setupSvg();
        
        if (this.svgElement) {
            // Dynamically calculate the map size in pixels by finding the max coordinate from map entities.
            // This prevents the SVG viewport from collapsing to 0x0 due to absolutely-positioned container styling.
            let maxX = 0;
            let maxY = 0;
            for (let prop of mapEntities.properties) {
                maxX = Math.max(maxX, prop.coords.x);
                maxY = Math.max(maxY, prop.coords.y);
            }
            for (let unit of mapEntities.units) {
                maxX = Math.max(maxX, unit.coords.x);
                maxY = Math.max(maxY, unit.coords.y);
            }
            
            // Map dimensions in pixels
            let widthPx = maxX > 0 ? (maxX + 1) * 16 : (this.gamemap.offsetWidth || this.gamemap.scrollWidth || 800);
            let heightPx = maxY > 0 ? (maxY + 1) * 16 : (this.gamemap.offsetHeight || this.gamemap.scrollHeight || 600);
            
            this.svgElement.style.width = widthPx + "px";
            this.svgElement.style.height = heightPx + "px";
            this.svgElement.setAttribute("width", widthPx.toString());
            this.svgElement.setAttribute("height", heightPx.toString());
        }
        
        // 3. Process each unit on the board
        for (let unit of mapEntities.units) {
            let id = unit.id;
            let isWaited = unit.is_waited;
            
            // Initialize if not tracked yet
            if (!this.originalCoords[id]) {
                this.originalCoords[id] = { x: unit.coords.x, y: unit.coords.y };
                this.wasWaited[id] = isWaited;
            }
            
            // If unit transitioned from waited to unwaited, update original coords to current position
            if (!isWaited && this.wasWaited[id]) {
                this.originalCoords[id] = { x: unit.coords.x, y: unit.coords.y };
            }
            
            // Remember current waited state for next update
            this.wasWaited[id] = isWaited;
            
            let orig = this.originalCoords[id];
            let curr = unit.coords;
            
            // If the starting location is different from the current location, draw/update tracer
            if (orig.x !== curr.x || orig.y !== curr.y) {
                this.updateTracer(unit, orig, curr);
            } else {
                // If they are back at original location, remove visuals
                if (this.lineElements[id]) {
                    this.lineElements[id].remove();
                    delete this.lineElements[id];
                }
                if (this.circleElements[id]) {
                    this.circleElements[id].remove();
                    delete this.circleElements[id];
                }
            }
        }
    }
    
    updateTracer(unit, orig, curr) {
        let id = unit.id;
        
        // Calculate center offsets for line connection
        let startX = orig.x * 16 + 8;
        let startY = orig.y * 16 + 8;
        let endX = curr.x * 16 + 8;
        let endY = curr.y * 16 + 8;
        
        console.log(`AWBW Enhancements - Drawing arrow for unit ${id} from (${orig.x}, ${orig.y}) to (${curr.x}, ${curr.y})`);
        
        // Resolve absolute page URL for SVG markers to bypass <base href="..."> resolution bugs
        let pageUrl = window.location.href.split('#')[0];
        
        // 1. Create or update starting circle (radius decreased by half: 1.75 instead of 3.5)
        if (!this.circleElements[id]) {
            let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("r", "1.75");
            circle.setAttribute("fill", "#ff9900");
            
            this.svgElement.appendChild(circle);
            this.circleElements[id] = circle;
        }
        this.circleElements[id].setAttribute("cx", startX.toString());
        this.circleElements[id].setAttribute("cy", startY.toString());
        
        // 2. Create or update line
        if (!this.lineElements[id]) {
            let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            
            // Apply thin orange presentation attributes
            line.setAttribute("stroke", "#ff9900");
            line.setAttribute("stroke-width", "1.5");
            line.setAttribute("stroke-linecap", "round");
            line.setAttribute("marker-end", `url(${pageUrl}#awbwenhancements-arrow-fg)`);
            
            this.svgElement.appendChild(line);
            this.lineElements[id] = line;
        }
        
        let line = this.lineElements[id];
        line.setAttribute("x1", startX.toString());
        line.setAttribute("y1", startY.toString());
        line.setAttribute("x2", endX.toString());
        line.setAttribute("y2", endY.toString());
    }
}
