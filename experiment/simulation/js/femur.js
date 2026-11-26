/* ==============================
   CONFIGURATION
============================== */

const CM_PER_PIXEL = 1 / 20;

const TARGETS = {
    max_length:   { val: 41.40, tol: 1,   unit: "cm", instr: "Measure maximum length using osteometric board." },
    physio_length:{ val: 35.56, tol: 1,   unit: "cm", instr: "Measure physiological length." },
    troch_length: { val: 40.64, tol: 1,   unit: "cm", instr: "Measure trochanteric length." },
    shaft_diam:   { val: 3.24,  tol: 0.3, unit: "cm", instr: "Measure middle shaft diameter using calipers." },
    head_trans:   { val: 4.50,  tol: 0.5, unit: "cm", instr: "Measure transverse head diameter." },
    head_vert:    { val: 4.20,  tol: 0.5, unit: "cm", instr: "Measure vertical head diameter." },
    angle_neck:   { val: 125,   tol: 5,   unit: "deg", instr: "Measure collodiphysial angle." },
    angle_torsion:{ val: 15,    tol: 5,   unit: "deg", instr: "Measure femoral torsion angle." },
   femur_indices: { val: 0, tol: 0, unit: "", instr: "Enter measured values to calculate femur indices." }

};

 /* ==============================
   REAL FEMUR MEASUREMENTS (HIDDEN)
============================== */

const REAL_FEMUR = {
    transverse_head: 4.40,
    vertical_head: 4.23,
    max_length: 41.40,
    phys_length: 35.56,
    trochanteric_length: 40.64,
    mid_shaft_diameter: 3.24
};

const BONE_POSES = {
    max_length:   { left: "122px", top: "150px",  rotate: 0  },
    physio_length:{ left: "120px", top: "150px",  rotate: 0  },
    troch_length: { left: "120px", top: "150px",  rotate: 0  },
    shaft_diam:   { left: "250px", top: "250px", rotate: 90 },
    head_trans:   { left: "250px", top: "250px", rotate: 180 },
    head_vert:    { left: "250px", top: "250px", rotate: 90 },
    angle_neck:   { left: "330px", top: "200px", rotate: 15 },
    angle_torsion:{ left: "330px", top: "200px", rotate: 15 }
};

/* ==============================
   STATE
============================== */

let currentMode = "max_length";
let boneLocked = true;
let currentReading = 0;
let dragged = null;
let rotatingArm = null;
let offset = { x: 0, y: 0 };

/* ==============================
   MODE SWITCHING
============================== */

function setMode(mode, event) {

    currentMode = mode;
    // Show/Hide controls
    const controls = document.getElementById("controls");

    if (mode === "max_length" || mode === "physio_length" ||mode === "troch_length" ||  mode === "femur_indices") {
        controls.style.display = "none";
    } else {
        controls.style.display = "block";
    }
    document.querySelectorAll(".nav-btn")
        .forEach(btn => btn.classList.remove("active"));

    if (event && event.target) {
        event.target.classList.add("active");
    }

    ["tool-board","tool-caliper","tool-goniometer","tool-indices"]

        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = "none";
        });

    document.getElementById("instruction").innerText =
        TARGETS[mode]?.instr || "";

    document.getElementById("unit").innerText =
        TARGETS[mode]?.unit || "";

    document.getElementById("readout").innerText = 0;
    document.getElementById("feedback").innerText = "";
    currentReading = 0;

    const bone = document.getElementById("bone");

    /*if (mode === "indices") {
        bone.style.display = "none";
        document.getElementById("tool-indices").style.display = "block";
        return;
    }
        /* Show Femur Indices Panel */
    if (mode === "femur_indices") {
        document.getElementById("bone").style.display = "none";
        document.getElementById("tool-indices").style.display = "block";

        return;
    }


    bone.style.display = "block";

    const pose = BONE_POSES[mode];
    if (pose) {
        bone.style.left = pose.left;
        bone.style.top = pose.top;
        bone.style.transform = `rotate(${pose.rotate}deg)`;
    }
    if (
        mode === "shaft_diam" ||
        mode === "head_trans" ||
        mode === "head_vert" ||
        mode === "angle_neck" ||
        mode === "angle_torsion"
    ) {

        boneLocked = true;

        bone.style.cursor = "default";
        bone.style.boxShadow = "none";
    }
    else {

        boneLocked = false;

        bone.style.cursor = "grab";
    }
    if (mode === "max_length" || mode === "physio_length" || mode === "troch_length") {
        document.getElementById("tool-board").style.display = "block";
        document.getElementById("movable-wall").style.left = "420px";
    }
    else if (mode === "shaft_diam" || mode === "head_trans" || mode === "head_vert") {
        document.getElementById("tool-caliper").style.display = "block";
    }
    else {
        document.getElementById("tool-goniometer").style.display = "block";
        document.getElementById("goniometer").style.left = "350px";
        document.getElementById("goniometer").style.top = "250px";
    }
}

/* ==============================
   MOUSE EVENTS
============================== */

document.addEventListener("mousedown", e => {

if (
    (e.target.id === "bone" && !boneLocked) ||
    e.target.id === "movable-wall"
) {

    dragged = e.target;

    const rect = dragged.getBoundingClientRect();

    offset.x = e.clientX - rect.left;
    offset.y = e.clientY - rect.top;
}

/* MOVE WHOLE CALIPER */
    else if (
        e.target.closest("#tool-caliper") &&
        !e.target.closest("#caliper-slider")
    ) {

        dragged = document.getElementById("tool-caliper");

        const rect = dragged.getBoundingClientRect();

        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;
    }

    /* MOVE CALIPER SLIDER */
    else if (e.target.closest("#caliper-slider")) {

        dragged = document.getElementById("caliper-slider");

        const rect = dragged.getBoundingClientRect();

        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;
    }

    if (e.target.closest("#goniometer") &&
        !e.target.classList.contains("gonio-arm")) {

        dragged = document.getElementById("goniometer");
        const rect = dragged.getBoundingClientRect();
        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;
    }

    if (e.target.classList.contains("gonio-arm")) {
        rotatingArm = e.target;
    }
});

document.addEventListener("mousemove", e => {

    if (dragged) {

        const workspace = document.getElementById("workspace").getBoundingClientRect();

        /* BOARD */
                if (currentMode.includes("length") && dragged.id === "movable-wall") {

            const workspace = document.getElementById("workspace").getBoundingClientRect();
            const bone = document.getElementById("bone");
            const boneRect = bone.getBoundingClientRect();

            let x = e.clientX - workspace.left;

            const boneLeft = boneRect.left - workspace.left;
            const boneRight = boneRect.right - workspace.left;

            if (x < boneLeft) x = boneLeft;
            if (x > boneRight) x = boneRight;

            dragged.style.left = x + "px";

            const lengthPx = x - boneLeft;
            const fullWidthPx = boneRight - boneLeft;

            let targetValue = 41.40;

            if (currentMode === "physio_length") {
                targetValue = 35.56;
            }

            if (currentMode === "troch_length") {
                targetValue = 40.64;
            }

            const scale = targetValue / fullWidthPx;

            currentReading = lengthPx * scale;
        }
        /* BONE DRAGGING */
        else if (dragged.id === "bone") {

            let x = e.clientX - workspace.left - offset.x;
            let y = e.clientY - workspace.top - offset.y;

            dragged.style.left = x + "px";
            dragged.style.top  = y + "px";
        }
        /* CALIPER */
        /* MOVE WHOLE CALIPER */
        else if (dragged.id === "tool-caliper") {

            let x = e.clientX - workspace.left - offset.x;
            let y = e.clientY - workspace.top - offset.y;

            dragged.style.left = x + "px";
            dragged.style.top = y + "px";
        }
        else if (dragged.id === "caliper-slider") {

        const caliperBody =
            document.getElementById("caliper-body")
            .getBoundingClientRect();

        let x = e.clientX - caliperBody.left - offset.x;

        const minX = 60;
        const maxX = 520;

        if (x < minX) x = minX;
        if (x > maxX) x = maxX;

        dragged.style.left = x + "px";

        /* measurement calculation */
        const fixedJawX = 40;
        const distancePx = x - fixedJawX;

        currentReading = distancePx * CM_PER_PIXEL;
    }
        /* GONIOMETER BODY */
        else if (dragged.id === "goniometer") {

            let x = e.clientX - workspace.left - offset.x;
            let y = e.clientY - workspace.top - offset.y;

            dragged.style.left = x + "px";
            dragged.style.top  = y + "px";
        }

        document.getElementById("readout").innerText =
            parseFloat(currentReading).toFixed(2);
    }

    /* ROTATION */
    if (rotatingArm) {

        const center = document.getElementById("gonio-center").getBoundingClientRect();
        const cx = center.left + center.width / 2;
        const cy = center.top  + center.height / 2;

        const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
        rotatingArm.style.transform = `rotate(${angle}deg)`;

        const a1 = getRotation(document.getElementById("gonio-arm-1"));
        const a2 = getRotation(document.getElementById("gonio-arm-2"));

        let diff = Math.abs(a1 - a2);
        if (diff > 180) diff = 360 - diff;

        currentReading = Math.round(diff);
        document.getElementById("readout").innerText = currentReading;
    }
});

document.addEventListener("mouseup", () => {
    dragged = null;
    rotatingArm = null;
});

/* ==============================
   UTILITIES
============================== */

function getRotation(el) {
    if (!el.style.transform) return 0;
    return parseFloat(el.style.transform.replace("rotate(", "").replace("deg)", ""));
}



/* ==============================
   CORRECT ANSWERS
============================== */

const CORRECT_INDICES = {

    ans_slender_max: 7.82,

    ans_slender_phys: 9.11,

    ans_phys_max: 85.89,

    ans_troch_max: 98.16,

    ans_troch_phys: 114.28
};

/* ==============================
   CALCULATE + VALIDATE
============================== */

function calculate(numId, denId, ansId) {

    const num =
        parseFloat(
            document.getElementById(numId).value
        );

    const den =
        parseFloat(
            document.getElementById(denId).value
        );

    const ans =
        document.getElementById(ansId);

    /* EMPTY */
    if (
        isNaN(num) ||
        isNaN(den) ||
        den === 0
    ) {

        ans.value = "";

        ans.style.background = "#fff8dc";
        ans.style.border = "2px solid #f1c40f";

        return;
    }

    /* CALCULATE */
    const result =
        (num * 100) / den;

    ans.value =
        result.toFixed(2);

    /* CHECK ANSWER */
    const correct =
        CORRECT_INDICES[ansId];

    const tolerance = 0.2;

    if (
        Math.abs(result - correct)
        <= tolerance
    ) {

        /* CORRECT */
        ans.style.background = "#d4edda";
        ans.style.border = "3px solid green";
        ans.style.color = "green";

    } else {

        /* WRONG */
        ans.style.background = "#f8d7da";
        ans.style.border = "3px solid red";
        ans.style.color = "red";
    }
}

/* ==============================
   LIVE UPDATE
============================== */

document.addEventListener("input", () => {

    calculate(
        "slender_num1",
        "slender_den1",
        "ans_slender_max"
    );

    calculate(
        "slender_num2",
        "slender_den2",
        "ans_slender_phys"
    );

    calculate(
        "phys_num",
        "phys_den",
        "ans_phys_max"
    );

    calculate(
        "troch_num1",
        "troch_den1",
        "ans_troch_max"
    );

    calculate(
        "troch_num2",
        "troch_den2",
        "ans_troch_phys"
    );
});


function checkFemurIndices() {

    const tolerance = 2.5;

    /* -------- SYSTEM CALCULATES TRUE VALUES -------- */

    const M = REAL_FEMUR.max_length;
    const P = REAL_FEMUR.phys_length;
    const T = REAL_FEMUR.trochanteric_length;
    const D = REAL_FEMUR.mid_shaft_diameter;

    const correct = {

        slender_max: (D * 100) / M,

        slender_phys: (D * 100) / P,

        phys_max: (P * 100) / M,

        troch_max: (T * 100) / M,

        troch_phys: (T * 100) / P
    };

    /* -------- STUDENT VALUES -------- */

    const user = {

        slender_max: parseFloat(document.getElementById("ans_slender_max").value),
        slender_phys: parseFloat(document.getElementById("ans_slender_phys").value),
        phys_max: parseFloat(document.getElementById("ans_phys_max").value),
        troch_max: parseFloat(document.getElementById("ans_troch_max").value),
        troch_phys: parseFloat(document.getElementById("ans_troch_phys").value)
    };

    let score = 0;
    let total = 5;

    for (let key in correct) {

        const input = document.getElementById("ans_" + key);

        if (Math.abs(user[key] - correct[key]) <= tolerance) {

            input.style.border = "3px solid green";
            input.style.backgroundColor = "#e6ffe6";
            score++;

        } else {

            input.style.border = "3px solid red";
            input.style.backgroundColor = "#ffe6e6";
        }
    }

    const feedback = document.getElementById("femurIndexFeedback");

    if (score === total) {

        feedback.style.color = "green";
        feedback.innerHTML = `✔ Excellent! All calculations correct. (${score}/5)`;

    } else {

        feedback.style.color = "red";
        feedback.innerHTML = `
            ✖ Some calculations are incorrect.<br>
            Score: ${score}/5
        `;
    }
}

const bone = document.getElementById("bone");

/* Disable default browser drag ghost image */
bone.ondragstart = () => false;

/* Double-click to lock/unlock */
bone.addEventListener("dblclick", () => {

    /* modes where bone must stay fixed */
    const fixedModes = [
        "shaft_diam",
        "head_trans",
        "head_vert",
        "angle_neck",
        "angle_torsion"
    ];

    /* do nothing in fixed modes */
    if (fixedModes.includes(currentMode)) {
        return;
    }

    boneLocked = !boneLocked;

    if (!boneLocked) {

        bone.style.cursor = "grab";
        bone.style.boxShadow =
            "0 8px 20px rgba(0,0,0,0.25)";

    } else {

        bone.style.cursor = "default";
        bone.style.boxShadow = "none";
    }
});

function createScale() {

    const scale = document.getElementById("scale");
    scale.innerHTML = "";

    const PX_PER_CM = 16.3;

    for (let i = 0; i <= 50; i++) {

        const tick = document.createElement("div");

        tick.style.left = (i * PX_PER_CM) + "px";
        tick.classList.add("tick");

        if (i % 10 === 0) {
            tick.classList.add("large");

            const label = document.createElement("div");
            label.classList.add("tick-label");
            label.style.left = (i * PX_PER_CM - 5) + "px";
            label.innerText = i;

            scale.appendChild(label);

        } else if (i % 5 === 0) {
            tick.classList.add("medium");
        } else {
            tick.classList.add("small");
        }

        scale.appendChild(tick);
    }
}
/* ==============================
   CREATE CALIPER SCALE
============================== */

// function createCaliperScale() {

//     const scale = document.querySelector(".caliper-scale");

//     scale.innerHTML = "";

//     const PX_PER_CM = 20;

//     for (let i = 0; i <= 20; i++) {

//         const tick = document.createElement("div");

//         tick.classList.add("cal-tick");

//         tick.style.left = (i * PX_PER_CM) + "px";

//         if (i % 10 === 0) {
//             tick.classList.add("large");
//         }
//         else if (i % 5 === 0) {
//             tick.classList.add("medium");
//         }
//         else {
//             tick.classList.add("small");
//         }

//         scale.appendChild(tick);

//         /* labels every 1 cm */
//         const label = document.createElement("div");

//         label.classList.add("cal-label");

//         label.style.left = (i * PX_PER_CM) + "px";

//         label.innerText = i;

//         scale.appendChild(label);
//     }
// }

/* ==============================
   GONIOMETER SCALE
============================== */

function createGonioScale() {

    const scale =
        document.getElementById("gonio-scale");

    scale.innerHTML = "";

    const radius = 78;

    for (let deg = 0; deg < 360; deg += 5) {

        const tick =
            document.createElement("div");

        tick.classList.add("gonio-tick");

        let tickLength = 6;

        if (deg % 10 === 0) {
            tickLength = 12;
        }

        const angle =
            (deg - 90) * Math.PI / 180;

        const x =
            90 + radius * Math.cos(angle);

        const y =
            90 + radius * Math.sin(angle);

        tick.style.left = x + "px";
        tick.style.top = y + "px";

        tick.style.height = tickLength + "px";

        tick.style.transform =
            `translate(-50%, -100%) rotate(${deg}deg)`;

        scale.appendChild(tick);

        /* labels */
        if (deg % 20 === 0) {

            const label =
                document.createElement("div");

            label.classList.add("gonio-label");

            label.innerText = deg;

            const lx =
                90 + (radius - 18) * Math.cos(angle);

            const ly =
                90 + (radius - 18) * Math.sin(angle);

            label.style.left = lx + "px";
            label.style.top = ly + "px";

            scale.appendChild(label);
        }
    }
}
/* ==============================
   INITIAL LOAD
============================== */

setMode("max_length");
createScale();
// createCaliperScale();
createGonioScale();                                            